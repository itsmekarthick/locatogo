-- Setup 8 Indian Metro domains and 20 categories under Karthick's tenant
-- and perform clean-slate wipe on public.listings.

do $$
declare
  karthick_tenant_id uuid;
  metro record;
  d_id uuid;
begin
  select id into karthick_tenant_id from public.tenants where slug = 'karthick';
  if karthick_tenant_id is null then
    raise exception 'Tenant karthick not found';
  end if;

  -- 1. Clean slate wipe of existing listings as approved
  delete from public.listings;

  -- 2. Ensure all 8 Metro domains exist
  for metro in 
    select * from (values
      ('Bangalore', 'bangalore', 'Discover top verified places, IT parks, dining, and healthcare across Bangalore.', 12.9716, 77.5946, 11),
      ('Chennai', 'chennai', 'Explore leading commercial centers, hospitals, and dining spots in Chennai.', 13.0827, 80.2707, 11),
      ('Mumbai', 'mumbai', 'The financial capital guide: commercial hubs, retail, and lifestyle across Mumbai.', 19.0760, 72.8777, 11),
      ('Hyderabad', 'hyderabad', 'Explore Cyberabad, tech parks, heritage, and dining in Hyderabad.', 17.3850, 78.4867, 11),
      ('Kochi', 'kochi', 'Discover coastal businesses, IT corridors, and cultural destinations in Kochi.', 9.9312, 76.2673, 11),
      ('Delhi NCR', 'delhi', 'The National Capital Region directory: Delhi, Gurgaon, Noida commercial and lifestyle hub.', 28.6139, 77.2090, 11),
      ('Kolkata', 'kolkata', 'Explore cultural centers, IT hubs, and top institutions across Kolkata.', 22.5726, 88.3639, 11),
      ('Pune', 'pune', 'Discover automotive hubs, IT parks, and educational landmarks across Pune.', 18.5204, 73.8567, 11)
    ) as t(name, slug, description, lat, lon, zoom)
  loop
    insert into public.domains (
      tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status
    )
    values (
      karthick_tenant_id, metro.name, metro.slug, metro.description, metro.lat, metro.lon, metro.zoom, 'published'
    )
    on conflict (tenant_id, slug) do update set
      name = excluded.name,
      description = excluded.description,
      default_latitude = excluded.default_latitude,
      default_longitude = excluded.default_longitude,
      default_zoom = excluded.default_zoom,
      status = 'published'
    returning id into d_id;

    if d_id is null then
      select id into d_id from public.domains where tenant_id = karthick_tenant_id and slug = metro.slug;
    end if;

    insert into public.directory_settings (
      domain_id, default_timezone, default_language,
      geographic_scope_type, geographic_scope_json, settings_json
    )
    values (
      d_id,
      'Asia/Kolkata',
      'en',
      'city',
      jsonb_build_object('city', metro.name, 'country_code', 'IN'),
      jsonb_build_object('source', 'overture-maps', 'release', '2026-08-19.0')
    )
    on conflict (domain_id) do update set
      default_timezone = excluded.default_timezone,
      geographic_scope_type = excluded.geographic_scope_type,
      geographic_scope_json = excluded.geographic_scope_json,
      settings_json = excluded.settings_json;
  end loop;

  -- 3. Ensure all 20 standard categories exist for tenant karthick
  insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
  values
    (karthick_tenant_id, null, 'Schools & Education', 'schools-education', 'Schools, universities, colleges, and training centers', 1, true),
    (karthick_tenant_id, null, 'Restaurants & Cafes', 'restaurants-cafes', 'Restaurants, cafes, bakeries, and food courts', 2, true),
    (karthick_tenant_id, null, 'Hospitals & Clinics', 'hospitals-clinics', 'Hospitals, clinics, doctors, dentists, and pharmacies', 3, true),
    (karthick_tenant_id, null, 'Hotels & Accommodation', 'hotels-accommodation', 'Hotels, hostels, guest houses, resorts, and lodges', 4, true),
    (karthick_tenant_id, null, 'Shopping & Malls', 'shopping-malls', 'Shopping malls, supermarkets, department stores, and marketplaces', 5, true),
    (karthick_tenant_id, null, 'Banks & Finance', 'banks-finance', 'Banks, ATMs, money transfer, and insurance services', 6, true),
    (karthick_tenant_id, null, 'Tech & Coworking', 'tech-coworking', 'Coworking spaces, IT companies, and software companies', 7, true),
    (karthick_tenant_id, null, 'Temples & Religious', 'temples-religious', 'Temples, mosques, churches, gurudwaras, and monasteries', 8, true),
    (karthick_tenant_id, null, 'Government & Public', 'government-public', 'Government offices, post offices, courts, and emergency services', 9, true),
    (karthick_tenant_id, null, 'Petrol & Automotive', 'petrol-automotive', 'Fuel stations, repair shops, car washes, and dealers', 10, true),
    (karthick_tenant_id, null, 'Gyms & Sports', 'gyms-sports', 'Gyms, sports clubs, pools, yoga studios, and stadiums', 11, true),
    (karthick_tenant_id, null, 'Beauty & Spa', 'beauty-spa', 'Beauty salons, spas, barbers, and massage services', 12, true),
    (karthick_tenant_id, null, 'Entertainment & Nightlife', 'entertainment-nightlife', 'Cinemas, theaters, nightlife, bars, pubs, and amusement parks', 13, true),
    (karthick_tenant_id, null, 'Parks & Recreation', 'parks-recreation', 'Parks, gardens, playgrounds, and nature reserves', 14, true),
    (karthick_tenant_id, null, 'Transportation', 'transportation', 'Bus, train, metro, airport, and taxi facilities', 15, true),
    (karthick_tenant_id, null, 'Groceries & Daily Needs', 'groceries-daily-needs', 'Grocery, convenience, butcher, and vegetable markets', 16, true),
    (karthick_tenant_id, null, 'Professional Services', 'professional-services', 'Legal, accounting, consulting, and real estate services', 17, true),
    (karthick_tenant_id, null, 'Independent Retail', 'independent-retail', 'Clothing, electronics, books, jewelry, and specialty retail', 18, true),
    (karthick_tenant_id, null, 'Community & Non-Profit', 'community-nonprofit', 'Community centers, NGOs, libraries, and museums', 19, true),
    (karthick_tenant_id, null, 'Other', 'other', 'Places that do not match another category', 20, true)
  on conflict (tenant_id, slug) where domain_id is null do update set
    name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

end;
$$;
