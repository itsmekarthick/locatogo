-- Migration: Universal Shared Taxonomy (Global Categories with Optional Domain Overrides)
-- Allows standard categories (Tech Parks, Coworking, Hospitals, Dining, etc.) to be shared globally across all cities/domains.

-- 1. Make domain_id nullable on categories table
alter table public.categories alter column domain_id drop not null;

-- 2. Drop dependent foreign keys on listings and categories FIRST
alter table public.listings drop constraint if exists listings_category_same_tenant_domain_fkey;
alter table public.listings drop constraint if exists listings_category_id_domain_id_fkey;
alter table public.listings drop constraint if exists listings_category_id_fkey;

alter table public.categories drop constraint if exists categories_parent_same_tenant_domain_fkey;
alter table public.categories drop constraint if exists categories_parent_category_id_domain_id_fkey;
alter table public.categories drop constraint if exists categories_parent_category_id_fkey;

-- 3. Drop legacy composite unique constraints on categories table
alter table public.categories drop constraint if exists categories_domain_id_slug_key cascade;
alter table public.categories drop constraint if exists categories_id_domain_key cascade;
alter table public.categories drop constraint if exists categories_id_domain_tenant_unique cascade;

-- 4. Add robust tenant-safe unique constraints and foreign keys
alter table public.categories drop constraint if exists categories_id_tenant_unique cascade;
alter table public.categories add constraint categories_id_tenant_unique unique (id, tenant_id);

-- Ensure slug uniqueness per tenant for global categories
create unique index if not exists categories_tenant_global_slug_unique 
  on public.categories (tenant_id, slug) 
  where domain_id is null;

-- Ensure slug uniqueness per domain for domain-specific categories
create unique index if not exists categories_tenant_domain_slug_unique 
  on public.categories (tenant_id, domain_id, slug) 
  where domain_id is not null;

-- Foreign key allowing listings to reference any valid category in the same tenant (global or domain-specific)
alter table public.listings add constraint listings_category_id_fkey
  foreign key (category_id)
  references public.categories(id)
  on delete restrict;

alter table public.categories add constraint categories_parent_category_id_fkey
  foreign key (parent_category_id)
  references public.categories(id)
  on delete restrict;

-- 5. Convert existing categories to Universal Global categories by default
update public.categories set domain_id = null where domain_id is not null;
