create extension if not exists pgcrypto;

create type public.platform_role as enum ('platform_admin', 'user');
create type public.tenant_role as enum ('tenant_owner', 'tenant_staff', 'business_owner');
create type public.tenant_status as enum ('active', 'suspended', 'archived');
create type public.domain_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  platform_role public.platform_role not null default 'user',
  locale text not null default 'en',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.tenant_role not null,
  permissions_json jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id)
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  iso_code text not null unique check (iso_code ~ '^[A-Z]{2}$'),
  iso3_code text unique check (iso3_code ~ '^[A-Z]{3}$'),
  name text not null,
  native_name text,
  phone_code text,
  default_currency text,
  default_timezone text,
  is_active boolean not null default true
);

create table public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name text not null,
  symbol text,
  decimal_digits smallint not null default 2 check (decimal_digits between 0 and 4),
  is_active boolean not null default true
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  favicon_url text,
  theme_config jsonb not null default '{}'::jsonb,
  default_latitude double precision check (default_latitude between -90 and 90),
  default_longitude double precision check (default_longitude between -180 and 180),
  default_zoom smallint check (default_zoom between 0 and 22),
  status public.domain_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug)
);

create table public.directory_settings (
  domain_id uuid primary key references public.domains(id) on delete cascade,
  default_currency text check (default_currency is null or default_currency ~ '^[A-Z]{3}$'),
  default_timezone text not null default 'UTC',
  default_language text not null default 'en',
  supported_languages jsonb not null default '["en"]'::jsonb,
  geographic_scope_type text not null default 'global' check (geographic_scope_type in ('global', 'continent', 'country', 'region', 'city', 'custom')),
  geographic_scope_json jsonb not null default '{}'::jsonb,
  settings_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index tenant_users_user_id_idx on public.tenant_users(user_id);
create index domains_tenant_id_idx on public.domains(tenant_id);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'platform_admin'
  );
$$;

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.tenant_users
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.countries enable row level security;
alter table public.currencies enable row level security;
alter table public.domains enable row level security;
alter table public.directory_settings enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_platform_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy tenants_member_read on public.tenants for select using (public.is_tenant_member(id));
create policy tenant_users_member_read on public.tenant_users for select using (public.is_tenant_member(tenant_id));
create policy countries_public_read on public.countries for select using (is_active = true);
create policy currencies_public_read on public.currencies for select using (is_active = true);
create policy domains_member_read on public.domains for select using (public.is_tenant_member(tenant_id));
create policy directory_settings_member_read on public.directory_settings for select using (exists (select 1 from public.domains d where d.id = domain_id and public.is_tenant_member(d.tenant_id)));

revoke all on public.profiles, public.tenants, public.tenant_users, public.countries, public.currencies, public.domains, public.directory_settings from anon;
grant select on public.countries, public.currencies to anon;
