create type public.custom_field_type as enum ('text', 'long_text', 'number', 'currency', 'boolean', 'date', 'select', 'multi_select', 'url', 'email', 'phone', 'image', 'file');
create type public.media_type as enum ('logo', 'cover', 'gallery', 'document', 'video_thumbnail');

create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  key text not null check (key ~ '^[a-z][a-z0-9_]*$'),
  description text,
  field_type public.custom_field_type not null,
  is_required boolean not null default false,
  is_public boolean not null default true,
  is_searchable boolean not null default false,
  is_filterable boolean not null default false,
  is_sortable boolean not null default false,
  options_json jsonb not null default '[]'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (domain_id, key),
  unique (id, tenant_id),
  unique (id, domain_id, tenant_id),
  foreign key (domain_id, tenant_id) references public.domains(id, tenant_id) on delete cascade
);

create table public.listing_attributes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  field_id uuid not null,
  value_text text,
  value_number numeric,
  value_boolean boolean,
  value_date date,
  value_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (listing_id, field_id),
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade,
  foreign key (field_id, tenant_id) references public.custom_fields(id, tenant_id) on delete cascade
);

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  media_type public.media_type not null,
  storage_path text not null,
  public_url text,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade
);

create table public.listing_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  is_24_hours boolean not null default false,
  open_time time,
  close_time time,
  sort_order integer not null default 0,
  unique (listing_id, day_of_week),
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade,
  check (is_closed = false or (is_24_hours = false and open_time is null and close_time is null)),
  check (is_24_hours = true or (is_closed = true) or (open_time is not null and close_time is not null))
);

create table public.listing_social_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  listing_id uuid not null,
  platform text not null check (length(trim(platform)) > 0),
  url text not null,
  foreign key (listing_id, tenant_id) references public.listings(id, tenant_id) on delete cascade,
  unique (listing_id, platform)
);

create table public.listing_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index custom_fields_domain_idx on public.custom_fields(domain_id, sort_order);
create index listing_attributes_listing_idx on public.listing_attributes(listing_id);
create index listing_media_listing_idx on public.listing_media(listing_id, sort_order);
create index listing_hours_listing_idx on public.listing_hours(listing_id, day_of_week);
create index audit_tenant_created_idx on public.listing_audit_logs(tenant_id, created_at desc);

alter table public.custom_fields enable row level security;
alter table public.listing_attributes enable row level security;
alter table public.listing_media enable row level security;
alter table public.listing_hours enable row level security;
alter table public.listing_social_links enable row level security;
alter table public.listing_audit_logs enable row level security;

create policy custom_fields_member_read on public.custom_fields for select using (public.is_tenant_member(tenant_id));
create policy custom_fields_manager_write on public.custom_fields for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listing_attributes_member_read on public.listing_attributes for select using (public.is_tenant_member(tenant_id));
create policy listing_attributes_manager_write on public.listing_attributes for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listing_media_member_read on public.listing_media for select using (public.is_tenant_member(tenant_id) or exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
create policy listing_media_manager_write on public.listing_media for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listing_hours_member_read on public.listing_hours for select using (public.is_tenant_member(tenant_id) or exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
create policy listing_hours_manager_write on public.listing_hours for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listing_social_member_read on public.listing_social_links for select using (public.is_tenant_member(tenant_id) or exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
create policy listing_social_manager_write on public.listing_social_links for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy audit_member_read on public.listing_audit_logs for select using (public.is_tenant_member(tenant_id));
create policy audit_manager_insert on public.listing_audit_logs for insert with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));

revoke all on public.custom_fields, public.listing_attributes, public.listing_media, public.listing_hours, public.listing_social_links, public.listing_audit_logs from anon;
grant select on public.listing_media, public.listing_hours, public.listing_social_links to anon;
grant select, insert, update, delete on public.custom_fields, public.listing_attributes, public.listing_media, public.listing_hours, public.listing_social_links, public.listing_audit_logs to authenticated;

create or replace function public.audit_listing_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.listing_audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, old_values, new_values)
  values (coalesce(new.tenant_id, old.tenant_id), auth.uid(), case when tg_op = 'INSERT' then 'listing.created' when tg_op = 'UPDATE' then 'listing.updated' else 'listing.deleted' end, 'listing', coalesce(new.id, old.id), to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

create trigger listings_audit_trigger
after insert or update or delete on public.listings
for each row execute procedure public.audit_listing_change();
