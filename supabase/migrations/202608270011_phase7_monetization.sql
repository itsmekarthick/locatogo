create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');
create type public.monetization_status as enum ('draft', 'active', 'expired', 'cancelled');
create type public.ad_slot_type as enum ('flash_banner', 'header_banner', 'featured_pin', 'featured_listing');
create type public.upgrade_type as enum ('featured', 'verified', 'priority');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  payer_user_id uuid references public.profiles(id) on delete set null,
  payment_type text not null,
  amount numeric(18,4) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  gateway text not null,
  gateway_ref text,
  status public.payment_status not null default 'pending',
  commission_amount numeric(18,4) not null default 0 check (commission_amount >= 0),
  tenant_payout_amount numeric(18,4) not null default 0 check (tenant_payout_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (gateway, gateway_ref)
);

create table public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null,
  listing_id uuid,
  slot_type public.ad_slot_type not null,
  sponsor_name text not null,
  banner_url text,
  target_url text,
  start_date timestamptz not null,
  end_date timestamptz not null check (end_date > start_date),
  status public.monetization_status not null default 'draft',
  price_paid numeric(18,4) not null default 0 check (price_paid >= 0),
  platform_commission_amount numeric(18,4) not null default 0,
  tenant_payout_amount numeric(18,4) not null default 0,
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (domain_id, tenant_id) references public.domains(id, tenant_id) on delete cascade
);

create table public.listing_upgrades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  upgrade_type public.upgrade_type not null,
  price_paid numeric(18,4) not null check (price_paid >= 0),
  platform_commission_amount numeric(18,4) not null default 0,
  tenant_payout_amount numeric(18,4) not null default 0,
  start_date timestamptz not null,
  end_date timestamptz not null check (end_date > start_date),
  payment_id uuid references public.payments(id) on delete set null,
  status public.monetization_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade
);

create table public.ad_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ad_slot_id uuid not null references public.ad_slots(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  occurred_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create index payments_tenant_created_idx on public.payments(tenant_id, created_at desc);
create index ad_slots_domain_status_idx on public.ad_slots(domain_id, status, start_date);
create index upgrades_listing_status_idx on public.listing_upgrades(listing_id, status, end_date);

alter table public.payments enable row level security;
alter table public.ad_slots enable row level security;
alter table public.listing_upgrades enable row level security;
alter table public.ad_events enable row level security;
create policy payments_member_read on public.payments for select using (public.is_tenant_member(tenant_id) or payer_user_id = auth.uid());
create policy payments_manager_insert on public.payments for insert with check (payer_user_id = auth.uid() or public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));
create policy ads_member_read on public.ad_slots for select using (public.is_tenant_member(tenant_id) or status = 'active');
create policy ads_manager_write on public.ad_slots for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy upgrades_member_read on public.listing_upgrades for select using (public.is_tenant_member(tenant_id) or exists (select 1 from public.listings l where l.id = listing_id and l.owner_user_id = auth.uid()));
create policy upgrades_owner_insert on public.listing_upgrades for insert with check (exists (select 1 from public.listings l where l.id = listing_id and l.tenant_id = tenant_id and (l.owner_user_id = auth.uid() or public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]))));
create policy ad_events_member_read on public.ad_events for select using (public.is_tenant_member(tenant_id));
revoke all on public.payments, public.ad_slots, public.listing_upgrades, public.ad_events from anon;
grant select, insert on public.payments to authenticated;
grant select, insert, update, delete on public.ad_slots, public.listing_upgrades, public.ad_events to authenticated;
grant select on public.ad_slots to anon;
