-- Migration: 202609250002_expanded_global_domains.sql
-- Registers Paris, Amsterdam, Dublin, Dubai, Tokyo, and Sydney domains

DO $$
DECLARE
  v_tenant_id uuid;
  v_paris_id uuid;
  v_amsterdam_id uuid;
  v_dublin_id uuid;
  v_dubai_id uuid;
  v_tokyo_id uuid;
  v_sydney_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'karthick' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  END IF;

  -- 1. Paris, France
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Paris',
    'paris',
    'Paris Innovation Capital: Station F, Generative AI frontier labs, deeptech leaders, and French Tech unicorns.',
    48.8566,
    2.3522,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_paris_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_paris_id,
    'Europe/Paris',
    'en',
    'city',
    '{"city": "Paris", "country_code": "FR"}'::jsonb,
    '{"currency": "EUR", "country_code": "FR"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 2. Amsterdam, Netherlands
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Amsterdam',
    'amsterdam',
    'Amsterdam Tech Hub: Global payments infrastructure, travel tech leaders, open-source innovators, and European HQs.',
    52.3676,
    4.9041,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_amsterdam_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_amsterdam_id,
    'Europe/Amsterdam',
    'en',
    'city',
    '{"city": "Amsterdam", "country_code": "NL"}'::jsonb,
    '{"currency": "EUR", "country_code": "NL"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 3. Dublin, Ireland
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Dublin',
    'dublin',
    'Dublin Silicon Docks: European headquarters of global tech giants, enterprise SaaS, and Irish scale-ups.',
    53.3498,
    -6.2603,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_dublin_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_dublin_id,
    'Europe/Dublin',
    'en',
    'city',
    '{"city": "Dublin", "country_code": "IE"}'::jsonb,
    '{"currency": "EUR", "country_code": "IE"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 4. Dubai, UAE
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Dubai',
    'dubai',
    'Dubai Future District: DIFC FinTech hub, Web3 pioneers, global digital trade, and Middle East headquarters.',
    25.2048,
    55.2708,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_dubai_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_dubai_id,
    'Asia/Dubai',
    'en',
    'city',
    '{"city": "Dubai", "country_code": "AE"}'::jsonb,
    '{"currency": "AED", "country_code": "AE"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 5. Tokyo, Japan
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Tokyo',
    'tokyo',
    'Tokyo Tech Metropolis: Shibuya Bit Valley, robotics innovators, gaming giants, and Japanese tech scaleups.',
    35.6762,
    139.6503,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_tokyo_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_tokyo_id,
    'Asia/Tokyo',
    'ja',
    'city',
    '{"city": "Tokyo", "country_code": "JP"}'::jsonb,
    '{"currency": "JPY", "country_code": "JP"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

  -- 6. Sydney, Australia
  INSERT INTO domains (tenant_id, name, slug, description, default_latitude, default_longitude, default_zoom, status)
  VALUES (
    v_tenant_id,
    'Sydney',
    'sydney',
    'Sydney Silicon Harbour: Tech Central, collaboration SaaS unicorns, consumer fintech, and Australasian tech leaders.',
    -33.8688,
    151.2093,
    12,
    'published'
  )
  ON CONFLICT (tenant_id, slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      default_latitude = EXCLUDED.default_latitude,
      default_longitude = EXCLUDED.default_longitude,
      default_zoom = EXCLUDED.default_zoom
  RETURNING id INTO v_sydney_id;

  INSERT INTO directory_settings (domain_id, default_timezone, default_language, geographic_scope_type, geographic_scope_json, settings_json)
  VALUES (
    v_sydney_id,
    'Australia/Sydney',
    'en',
    'city',
    '{"city": "Sydney", "country_code": "AU"}'::jsonb,
    '{"currency": "AUD", "country_code": "AU"}'::jsonb
  )
  ON CONFLICT (domain_id) DO NOTHING;

END $$;
