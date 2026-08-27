create type public.listing_status as enum ('draft', 'pending_review', 'approved', 'published', 'rejected', 'suspended', 'archived');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles public.tenant_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.tenant_users
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  parent_category_id uuid,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  icon text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (domain_id, slug),
  unique (id, domain_id),
  foreign key (parent_category_id, domain_id) references public.categories(id, domain_id) on delete restrict
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  category_id uuid not null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description text,
  address_line_1 text not null check (length(trim(address_line_1)) > 0),
  address_line_2 text,
  locality text,
  city text,
  administrative_area text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  postal_code text,
  timezone text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  website text,
  phone text,
  email text,
  whatsapp text,
  status public.listing_status not null default 'draft',
  verification_status public.verification_status not null default 'unverified',
  is_featured boolean not null default false,
  priority integer not null default 0,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (domain_id, slug),
  foreign key (category_id, domain_id) references public.categories(id, domain_id) on delete restrict
);

create index categories_tenant_id_idx on public.categories(tenant_id);
create index categories_domain_id_idx on public.categories(domain_id);
create index listings_tenant_id_idx on public.listings(tenant_id);
create index listings_domain_status_idx on public.listings(domain_id, status);
create index listings_location_idx on public.listings(country_code, city);

alter table public.categories enable row level security;
alter table public.listings enable row level security;

create policy categories_member_read on public.categories for select using (public.is_tenant_member(tenant_id));
create policy categories_manager_insert on public.categories for insert with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy categories_manager_update on public.categories for update using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy categories_owner_delete on public.categories for delete using (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));

create policy listings_public_read on public.listings for select using (status = 'published' or public.is_tenant_member(tenant_id));
create policy listings_manager_insert on public.listings for insert with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listings_manager_update on public.listings for update using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
create policy listings_owner_delete on public.listings for delete using (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));

revoke all on public.categories, public.listings from anon;
grant select on public.listings to anon;
