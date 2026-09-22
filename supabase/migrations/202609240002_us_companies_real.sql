-- Migration: Seed US Companies (Silicon Valley & NYC) for Real ATS Sync

DO $$
DECLARE
  v_tenant_id uuid;
  v_domain_id uuid;
  v_category_id uuid;
  
  v_stripe_id uuid := gen_random_uuid();
  v_figma_id uuid := gen_random_uuid();
  v_notion_id uuid := gen_random_uuid();
  v_vercel_id uuid := gen_random_uuid();
  v_plaid_id uuid := gen_random_uuid();
BEGIN
  -- Get the first available domain and category to attach to
  SELECT tenant_id, id INTO v_tenant_id, v_domain_id FROM public.domains LIMIT 1;
  SELECT id INTO v_category_id FROM public.categories WHERE tenant_id = v_tenant_id LIMIT 1;

  IF v_tenant_id IS NOT NULL AND v_category_id IS NOT NULL THEN
    -- Insert US Listings with real ATS URLs for jobs sync
    INSERT INTO public.listings (
      id, tenant_id, domain_id, category_id, 
      title, slug, short_description, 
      address_line_1, locality, city, country_code, 
      latitude, longitude, status, 
      company_type, funding_stage, careers_url
    ) VALUES
    (
      v_stripe_id, v_tenant_id, v_domain_id, v_category_id,
      'Stripe', 'stripe', 'Financial infrastructure platform for the internet.',
      '354 Oyster Point Blvd', 'South San Francisco', 'San Francisco', 'US',
      37.6688, -122.3838, 'published',
      'product_saas', 'Public', 'https://boards.greenhouse.io/stripe'
    ),
    (
      v_figma_id, v_tenant_id, v_domain_id, v_category_id,
      'Figma', 'figma', 'The collaborative interface design tool.',
      '760 Market St', 'Financial District', 'San Francisco', 'US',
      37.7865, -122.4046, 'published',
      'product_saas', 'Series E', 'https://boards.greenhouse.io/figma'
    ),
    (
      v_notion_id, v_tenant_id, v_domain_id, v_category_id,
      'Notion', 'notion', 'The all-in-one workspace for your notes, tasks, wikis, and databases.',
      '2300 Harrison St', 'Mission District', 'San Francisco', 'US',
      37.7609, -122.4113, 'published',
      'product_saas', 'Series C+', 'https://jobs.ashbyhq.com/notion'
    ),
    (
      v_vercel_id, v_tenant_id, v_domain_id, v_category_id,
      'Vercel', 'vercel', 'The platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.',
      '340 S Lemon Ave', 'Walnut', 'Los Angeles', 'US', -- Remote first, but based in US
      34.0205, -117.8509, 'published',
      'product_saas', 'Series D', 'https://jobs.ashbyhq.com/vercel'
    ),
    (
      v_plaid_id, v_tenant_id, v_domain_id, v_category_id,
      'Plaid', 'plaid', 'The data network that powers the fintech tools that millions of people rely on to live a healthier financial life.',
      '1098 Harrison St', 'SoMa', 'San Francisco', 'US',
      37.7753, -122.4074, 'published',
      'product_saas', 'Series D', 'https://jobs.lever.co/plaid'
    ) ON CONFLICT DO NOTHING;

    -- Note: We are NOT inserting company_jobs here.
    -- The real jobs will be synced using `npx tsx scripts/scrapers/ingest-real-ats-jobs.ts`
  END IF;
END $$;
