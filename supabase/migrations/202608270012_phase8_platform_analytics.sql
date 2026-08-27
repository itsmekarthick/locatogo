create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  price numeric(18,4) not null default 0 check (price >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  interval text not null default 'month' check (interval in ('month', 'year')),
  domain_limit integer check (domain_limit is null or domain_limit > 0),
  listing_limit integer check (listing_limit is null or listing_limit > 0),
  features_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'trialing',
  gateway text,
  gateway_ref text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  domain_id uuid,
  listing_id uuid,
  event_type text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  foreign key (domain_id, tenant_id) references public.domains(id, tenant_id) on delete cascade,
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade
);

create index analytics_tenant_event_idx on public.analytics_events(tenant_id, event_type, occurred_at desc);
create index analytics_domain_event_idx on public.analytics_events(domain_id, event_type, occurred_at desc);

alter table public.plans enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.analytics_events enable row level security;
create policy plans_public_read on public.plans for select using (is_active = true);
create policy plans_platform_write on public.plans for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy subscriptions_member_read on public.tenant_subscriptions for select using (public.is_tenant_member(tenant_id));
create policy subscriptions_platform_write on public.tenant_subscriptions for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy analytics_public_insert on public.analytics_events for insert to anon, authenticated with check (tenant_id is null or exists (select 1 from public.domains d where d.id = domain_id and d.tenant_id = tenant_id and d.status = 'published'));
create policy analytics_member_read on public.analytics_events for select using (public.is_tenant_member(tenant_id));
create policy analytics_platform_read on public.analytics_events for select using (public.is_platform_admin());
revoke all on public.plans, public.tenant_subscriptions, public.analytics_events from anon;
grant select on public.plans to anon;
grant select on public.tenant_subscriptions, public.analytics_events to authenticated;
grant insert on public.analytics_events to anon, authenticated;
