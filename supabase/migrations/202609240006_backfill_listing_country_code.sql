-- Migration: Ensure country_code is always set on listings
-- Backfill any remaining nulls to 'IN' and set reasonable default

update public.listings
set country_code = 'IN'
where country_code is null;

-- Ensure an index on country_code exists for fast country-level filtering
create index if not exists idx_listings_country_code on public.listings(country_code);
