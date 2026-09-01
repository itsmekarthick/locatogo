-- Migration: Global Tech Companies & Live Careers Tracker
-- Phase: Global Tech Atlas & Real-time Job Openings

-- 1. Create company_profiles table
create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  website text,
  careers_url text,
  ats_provider text default 'custom' check (ats_provider is null or ats_provider in ('custom', 'greenhouse', 'lever', 'ashby', 'workday', 'smartrecruiters')),
  ats_board_token text,
  company_type text not null default 'product_saas' check (company_type in ('tech_giant_mnc', 'product_saas', 'startup', 'it_services_consulting', 'deeptech_hardware', 'vc_accelerator')),
  funding_stage text check (funding_stage is null or funding_stage in ('Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Unicorn', 'Public', 'Bootstrapped', 'GCC')),
  employee_range text,
  sectors text[] default '{}',
  tech_stack text[] default '{}',
  founded_year int,
  headquarters_city text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug)
);

-- 2. Extend listings table with company metadata (allowing nullable for standard non-company listings)
alter table public.listings 
  add column if not exists company_profile_id uuid references public.company_profiles(id) on delete set null,
  add column if not exists office_type text check (office_type is null or office_type in ('global_hq', 'regional_hq', 'rd_center', 'delivery_center', 'branch', 'regional_office')),
  add column if not exists company_type text check (company_type is null or company_type in ('tech_giant_mnc', 'product_saas', 'startup', 'it_services_consulting', 'deeptech_hardware', 'vc_accelerator')),
  add column if not exists funding_stage text,
  add column if not exists employee_range text,
  add column if not exists careers_url text,
  add column if not exists active_jobs_count int default 0,
  add column if not exists tech_stack text[] default '{}',
  add column if not exists founded_year int;

-- 3. Create company_jobs table for live openings
create table if not exists public.company_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_profile_id uuid references public.company_profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  department text default 'Engineering',
  location_name text not null default 'Remote',
  workplace_type text default 'hybrid' check (workplace_type in ('on_site', 'hybrid', 'remote')),
  experience_level text default 'mid' check (experience_level in ('intern', 'entry', 'mid', 'senior', 'lead', 'executive')),
  salary_range text,
  apply_url text not null,
  ats_job_id text,
  is_active boolean not null default true,
  posted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for ultra-fast query performance
create index if not exists idx_company_profiles_tenant on public.company_profiles(tenant_id);
create index if not exists idx_company_profiles_type on public.company_profiles(company_type);
create index if not exists idx_company_jobs_company on public.company_jobs(company_profile_id) where is_active = true;
create index if not exists idx_company_jobs_listing on public.company_jobs(listing_id) where is_active = true;
create index if not exists idx_listings_active_jobs on public.listings(active_jobs_count) where active_jobs_count > 0;

-- Enable RLS
alter table public.company_profiles enable row level security;
alter table public.company_jobs enable row level security;

-- Drop old policies if they exist before recreating
drop policy if exists "Public can view active company profiles" on public.company_profiles;
drop policy if exists "Tenant staff can manage company profiles" on public.company_profiles;
drop policy if exists "Public can view active company jobs" on public.company_jobs;
drop policy if exists "Tenant staff can manage company jobs" on public.company_jobs;

-- RLS Policies for company_profiles
create policy "Public can view active company profiles"
  on public.company_profiles for select
  using (true);

create policy "Tenant staff can manage company profiles"
  on public.company_profiles for all
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = company_profiles.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );

-- RLS Policies for company_jobs
create policy "Public can view active company jobs"
  on public.company_jobs for select
  using (is_active = true);

create policy "Tenant staff can manage company jobs"
  on public.company_jobs for all
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = company_jobs.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );
