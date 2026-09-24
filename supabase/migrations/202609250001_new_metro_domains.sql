-- Migration: 202609250001_new_metro_domains.sql
-- Registers international and additional US tech hub metro domains

DO $$
DECLARE
  v_tenant_id uuid;
  v_chicago_id uuid;
  v_denver_id uuid;
  v_atlanta_id uuid;
  v_sandiego_id uuid;
  v_london_id uuid;
  v_toronto_id uuid;
  v_berlin_id uuid;
  v_singapore_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'karthick' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  END IF;

  -- 1. Chicago, US
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Chicago',
    'chicago',
    'Chicago Tech Hub: Leading enterprise software, logistics tech, B2B SaaS, and FinTech across the Windy City.',
    41.8781,
    -87.6298,
    11,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_chicago_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_chicago_id,
    'America/Chicago',
    'en',
    'city',
    '{"city": "Chicago", "country_code": "US"}'::jsonb,
    '{"currency": "USD", "country_code": "US"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 2. Denver, US
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Denver',
    'denver',
    'Denver & Boulder Innovation Corridor: Cloud infrastructure, SaaS unicorns, cybersecurity, and outdoor tech.',
    39.7392,
    -104.9903,
    11,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_denver_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_denver_id,
    'America/Denver',
    'en',
    'city',
    '{"city": "Denver", "country_code": "US"}'::jsonb,
    '{"currency": "USD", "country_code": "US"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 3. Atlanta, US
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Atlanta',
    'atlanta',
    'Atlanta Tech Hub: FinTech powerhouse, sales enablement leaders, data privacy unicorns, and Midtown innovation.',
    33.7490,
    -84.3880,
    11,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_atlanta_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_atlanta_id,
    'America/New_York',
    'en',
    'city',
    '{"city": "Atlanta", "country_code": "US"}'::jsonb,
    '{"currency": "USD", "country_code": "US"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 4. San Diego, US
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'San Diego',
    'san-diego',
    'San Diego Tech Coast: Security automation, productivity platforms, biotech, and Southern California innovation.',
    32.7157,
    -117.1611,
    11,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_sandiego_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_sandiego_id,
    'America/Los_Angeles',
    'en',
    'city',
    '{"city": "San Diego", "country_code": "US"}'::jsonb,
    '{"currency": "USD", "country_code": "US"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 5. London, United Kingdom
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'London',
    'london',
    'London Tech Capital: European FinTech epicenter, Generative AI leaders, marketplace unicorns, and Silicon Roundabout.',
    51.5074,
    -0.1278,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_london_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_london_id,
    'Europe/London',
    'en',
    'city',
    '{"city": "London", "country_code": "GB"}'::jsonb,
    '{"currency": "GBP", "country_code": "GB"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 6. Toronto, Canada
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Toronto',
    'toronto',
    'Toronto Innovation Corridor: Pioneer AI labs, next-gen FinTech, adtech platforms, and Canadian tech leaders.',
    43.6532,
    -79.3832,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_toronto_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_toronto_id,
    'America/Toronto',
    'en',
    'city',
    '{"city": "Toronto", "country_code": "CA"}'::jsonb,
    '{"currency": "CAD", "country_code": "CA"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 7. Berlin, Germany
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Berlin',
    'berlin',
    'Berlin Startup Hub: European digital banking, e-commerce scaleups, travel tech, and creative tech ventures.',
    52.5200,
    13.4050,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_berlin_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_berlin_id,
    'Europe/Berlin',
    'en',
    'city',
    '{"city": "Berlin", "country_code": "DE"}'::jsonb,
    '{"currency": "EUR", "country_code": "DE"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 8. Singapore
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Singapore',
    'singapore',
    'Singapore Global Gateway: Southeast Asia FinTech, digital banking, global cross-border payments, and APAC HQs.',
    1.3521,
    103.8198,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_singapore_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_singapore_id,
    'Asia/Singapore',
    'en',
    'city',
    '{"city": "Singapore", "country_code": "SG"}'::jsonb,
    '{"currency": "SGD", "country_code": "SG"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

END $$;
