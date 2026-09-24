-- Setup US Metro Tech domains and directory settings under Karthick's tenant

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

  for metro in 
    select * from (values
      ('Silicon Valley & SF', 'siliconvalley', 'Silicon Valley & San Francisco Tech Directory: Leading AI labs, SaaS unicorns, and venture-backed startups.', 37.7749, -122.4194, 11, 'America/Los_Angeles', 'San Francisco'),
      ('New York City', 'new-york', 'New York City Tech Hub: FinTech, enterprise software, media tech, and scale-ups across Silicon Alley.', 40.7128, -74.0060, 11, 'America/New_York', 'New York'),
      ('Seattle', 'seattle', 'Seattle Tech Directory: Cloud computing giants, AI innovators, and enterprise software across the Pacific Northwest.', 47.6062, -122.3321, 11, 'America/Los_Angeles', 'Seattle'),
      ('Austin', 'austin', 'Austin Silicon Hills: Leading SaaS, hardware, semiconductor, and fast-growing tech ventures.', 30.2672, -97.7431, 11, 'America/Chicago', 'Austin'),
      ('Boston', 'boston', 'Boston Tech & Innovation Hub: Robotics, biotech, enterprise SaaS, and Cambridge university spin-outs.', 42.3601, -71.0589, 11, 'America/New_York', 'Boston'),
      ('Los Angeles', 'los-angeles', 'Silicon Beach & Los Angeles: Consumer tech, gaming, entertainment technology, and venture startups.', 34.0522, -118.2437, 11, 'America/Los_Angeles', 'Los Angeles')
    ) as t(name, slug, description, lat, lon, zoom, timezone, city)
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
      metro.timezone,
      'en',
      'city',
      jsonb_build_object('city', metro.city, 'country_code', 'US'),
      jsonb_build_object('currency', 'USD', 'country_code', 'US', 'source', 'us-tech-catalog')
    )
    on conflict (domain_id) do update set
      default_timezone = excluded.default_timezone,
      geographic_scope_type = excluded.geographic_scope_type,
      geographic_scope_json = excluded.geographic_scope_json,
      settings_json = excluded.settings_json;
  end loop;
end;
$$;
