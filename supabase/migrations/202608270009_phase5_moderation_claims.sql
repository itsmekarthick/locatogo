create type public.submission_status as enum ('pending_review', 'approved', 'rejected', 'changes_requested');
create type public.claim_status as enum ('pending', 'approved', 'rejected');
create type public.notification_channel as enum ('in_app', 'email');

create table public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null,
  submitted_by_user_id uuid references public.profiles(id) on delete set null,
  submitted_email text,
  payload_json jsonb not null,
  status public.submission_status not null default 'pending_review',
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  foreign key (domain_id, tenant_id) references public.domains(id, tenant_id) on delete cascade
);

create table public.listing_claims (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.claim_status not null default 'pending',
  submitted_information jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade,
  unique (listing_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  event_type text not null,
  subject text not null,
  body text not null,
  data_json jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index submissions_tenant_status_idx on public.listing_submissions(tenant_id, status, submitted_at desc);
create index claims_tenant_status_idx on public.listing_claims(tenant_id, status, submitted_at desc);
create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);

alter table public.listing_submissions enable row level security;
alter table public.listing_claims enable row level security;
alter table public.notifications enable row level security;

create policy submissions_public_create on public.listing_submissions for insert to anon, authenticated with check (exists (select 1 from public.domains d where d.id = domain_id and d.tenant_id = tenant_id and d.status = 'published'));
create policy submissions_manager_read on public.listing_submissions for select using (public.is_tenant_member(tenant_id));
create policy submissions_manager_update on public.listing_submissions for update using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));

create policy claims_self_create on public.listing_claims for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy claims_member_read on public.listing_claims for select using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
create policy claims_manager_update on public.listing_claims for update using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));

create policy notifications_self_read on public.notifications for select using (recipient_user_id = auth.uid());
create policy notifications_self_update on public.notifications for update using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());
create policy notifications_manager_insert on public.notifications for insert with check (recipient_user_id = auth.uid() or public.is_tenant_member(tenant_id));

revoke all on public.listing_submissions, public.listing_claims, public.notifications from anon;
grant insert on public.listing_submissions to anon;
grant select, insert, update on public.listing_submissions, public.listing_claims, public.notifications to authenticated;
