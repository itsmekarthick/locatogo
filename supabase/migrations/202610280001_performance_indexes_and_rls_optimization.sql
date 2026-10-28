-- Optimizations for high-volume listing searches, keyset cursor pagination, and RLS evaluation speed.

-- 1. Enable pg_trgm for super-fast ILIKE text search across listings and jobs
create extension if not exists pg_trgm;

-- 2. Trigram GIN indexes for autocomplete and substring search (.ilike('%query%'))
create index if not exists idx_listings_title_trgm on public.listings using gin (title gin_trgm_ops);
create index if not exists idx_listings_locality_trgm on public.listings using gin (locality gin_trgm_ops);
create index if not exists idx_listings_city_trgm on public.listings using gin (city gin_trgm_ops);
create index if not exists idx_listings_slug_trgm on public.listings using gin (slug gin_trgm_ops);
create index if not exists idx_company_jobs_title_trgm on public.company_jobs using gin (title gin_trgm_ops) where is_active = true;

-- 3. High-performance partial indexes for public published listings
-- Keyset pagination for sitemap and mass catalog syncs
create index if not exists idx_listings_published_id on public.listings (id) where status = 'published';

-- Directory browsing: domain + category + featured order
create index if not exists idx_listings_published_domain_cat_featured on public.listings (domain_id, category_id, is_featured desc) where status = 'published';

-- Direct domain listing query
create index if not exists idx_listings_published_domain_featured on public.listings (domain_id, is_featured desc) where status = 'published';

-- Tech companies atlas query
create index if not exists idx_listings_published_tech_companies on public.listings (country_code, is_featured desc, active_jobs_count desc) where status = 'published' and company_type is not null;

-- Spatial coordinates filtering for map
create index if not exists idx_listings_published_lat_long on public.listings (latitude, longitude) where status = 'published' and latitude is not null and longitude is not null;

-- 4. Optimize RLS helper functions with (select auth.uid()) to avoid per-row re-evaluation
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and platform_role = 'platform_admin'
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
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

