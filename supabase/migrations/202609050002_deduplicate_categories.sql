-- Migration: Deduplicate Categories & Enforce Single Canonical Taxonomy
-- Removes duplicate orphan categories created under obsolete tenants and ensures unique slug constraint.

do $$
declare
  karthick_tenant_id uuid := '1c186ac3-a365-4653-bd47-b87758890dfb';
begin
  -- 1. Reassign any rogue listing references just in case
  update public.listings l
  set category_id = c_good.id
  from public.categories c_bad
  join public.categories c_good on c_good.slug = c_bad.slug and c_good.tenant_id = karthick_tenant_id and c_good.domain_id is null
  where l.category_id = c_bad.id
    and c_bad.id != c_good.id;

  -- 2. Delete orphan duplicate categories from other tenants
  delete from public.categories
  where tenant_id != karthick_tenant_id;

  -- 3. Delete obsolete/inactive categories that have 0 listings
  delete from public.categories
  where slug in ('creative-arts', 'health-wellness', 'petrol-bunks-fuel', 'hospitals-healthcare')
    and not exists (select 1 from public.listings where category_id = categories.id);

  -- 4. Enforce unique index on (slug) where domain_id is null so global categories cannot be duplicated
  drop index if exists public.categories_global_slug_unique;
  create unique index categories_global_slug_unique on public.categories (slug) where domain_id is null;

end;
$$;
