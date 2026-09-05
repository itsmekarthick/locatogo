-- Overture Maps India import setup.
-- This migration intentionally deletes all listing rows before replacing the
-- Atlas taxonomy. Dependent listing records follow through their FK cascades.

do $$
declare
  atlas_tenant_id uuid;
  atlas_domain_id uuid;
begin
  insert into public.tenants (name, slug, status)
  values ('Locatogo Atlas', 'locatogo-atlas', 'active')
  on conflict (slug) do update set name = excluded.name, status = 'active'
  returning id into atlas_tenant_id;

  if atlas_tenant_id is null then
    select id into atlas_tenant_id from public.tenants where slug = 'locatogo-atlas';
  end if;

  insert into public.domains (
    tenant_id, name, slug, description, default_latitude,
    default_longitude, default_zoom, status
  )
  values (
    atlas_tenant_id,
    'India Atlas',
    'india-atlas',
    'Community places sourced from Overture Maps for India.',
    20.5937,
    78.9629,
    5,
    'published'
  )
  on conflict (tenant_id, slug) do update set
    name = excluded.name,
    description = excluded.description,
    default_latitude = excluded.default_latitude,
    default_longitude = excluded.default_longitude,
    default_zoom = excluded.default_zoom,
    status = 'published'
  returning id into atlas_domain_id;

  if atlas_domain_id is null then
    select id into atlas_domain_id
    from public.domains
    where tenant_id = atlas_tenant_id and slug = 'india-atlas';
  end if;

  delete from public.listings;
  delete from public.categories where tenant_id = atlas_tenant_id;

  insert into public.directory_settings (
    domain_id, default_timezone, default_language,
    geographic_scope_type, geographic_scope_json, settings_json
  )
  values (
    atlas_domain_id,
    'Asia/Kolkata',
    'en',
    'country',
    '{"country_code":"IN","bbox":[68.0,6.5,97.5,35.5]}'::jsonb,
    '{"source":"overture-maps","release":"2026-08-19.0","verification":"unverified"}'::jsonb
  )
  on conflict (domain_id) do update set
    default_timezone = excluded.default_timezone,
    geographic_scope_type = excluded.geographic_scope_type,
    geographic_scope_json = excluded.geographic_scope_json,
    settings_json = excluded.settings_json;

  -- Categories are global within this tenant. The current taxonomy migration
  -- permits listings to reference these categories across the Atlas domain.
  insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
  values
    (atlas_tenant_id, null, 'Schools & Education', 'schools-education', 'Schools, universities, colleges, and training centers', 1, true),
    (atlas_tenant_id, null, 'Restaurants & Cafes', 'restaurants-cafes', 'Restaurants, cafes, bakeries, and food courts', 2, true),
    (atlas_tenant_id, null, 'Hospitals & Clinics', 'hospitals-clinics', 'Hospitals, clinics, doctors, dentists, and pharmacies', 3, true),
    (atlas_tenant_id, null, 'Hotels & Accommodation', 'hotels-accommodation', 'Hotels, hostels, guest houses, resorts, and lodges', 4, true),
    (atlas_tenant_id, null, 'Shopping & Malls', 'shopping-malls', 'Shopping malls, supermarkets, department stores, and marketplaces', 5, true),
    (atlas_tenant_id, null, 'Banks & Finance', 'banks-finance', 'Banks, ATMs, money transfer, and insurance services', 6, true),
    (atlas_tenant_id, null, 'Tech & Coworking', 'tech-coworking', 'Coworking spaces, IT companies, and software companies', 7, true),
    (atlas_tenant_id, null, 'Temples & Religious', 'temples-religious', 'Temples, mosques, churches, gurudwaras, and monasteries', 8, true),
    (atlas_tenant_id, null, 'Government & Public', 'government-public', 'Government offices, post offices, courts, and emergency services', 9, true),
    (atlas_tenant_id, null, 'Petrol & Automotive', 'petrol-automotive', 'Fuel stations, repair shops, car washes, and dealers', 10, true),
    (atlas_tenant_id, null, 'Gyms & Sports', 'gyms-sports', 'Gyms, sports clubs, pools, yoga studios, and stadiums', 11, true),
    (atlas_tenant_id, null, 'Beauty & Spa', 'beauty-spa', 'Beauty salons, spas, barbers, and massage services', 12, true),
    (atlas_tenant_id, null, 'Entertainment & Nightlife', 'entertainment-nightlife', 'Cinemas, theaters, nightlife, bars, pubs, and amusement parks', 13, true),
    (atlas_tenant_id, null, 'Parks & Recreation', 'parks-recreation', 'Parks, gardens, playgrounds, and nature reserves', 14, true),
    (atlas_tenant_id, null, 'Transportation', 'transportation', 'Bus, train, metro, airport, and taxi facilities', 15, true),
    (atlas_tenant_id, null, 'Groceries & Daily Needs', 'groceries-daily-needs', 'Grocery, convenience, butcher, and vegetable markets', 16, true),
    (atlas_tenant_id, null, 'Professional Services', 'professional-services', 'Legal, accounting, consulting, and real estate services', 17, true),
    (atlas_tenant_id, null, 'Independent Retail', 'independent-retail', 'Clothing, electronics, books, jewelry, and specialty retail', 18, true),
    (atlas_tenant_id, null, 'Community & Non-Profit', 'community-nonprofit', 'Community centers, NGOs, libraries, and museums', 19, true),
    (atlas_tenant_id, null, 'Other', 'other', 'Places that do not match another Atlas category', 20, true);
end;
$$;

-- Global categories were introduced after the original public category policy,
-- which only handled domain-bound categories.
drop policy if exists categories_atlas_public_read on public.categories;
create policy categories_atlas_public_read on public.categories
  for select to anon, authenticated
  using (
    is_active = true
    and tenant_id = (select id from public.tenants where slug = 'locatogo-atlas')
    and exists (
      select 1 from public.domains d
      where d.tenant_id = categories.tenant_id
        and d.slug = 'india-atlas'
        and d.status = 'published'
    )
  );

grant select on public.categories to anon;