-- Migration: 202609030001_multi_ad_placements.sql
-- Add placement_location, category targeting, and multi-ad inventory

-- 1. Add placement and targeting columns to ad_slots
alter table public.ad_slots
  add column if not exists placement_location text default 'in_feed',
  add column if not exists target_category_id uuid references public.categories(id) on delete set null,
  add column if not exists target_city text default 'all';

-- 2. Update existing rows with suitable placement_location based on slot_type
update public.ad_slots
set placement_location = case
  when slot_type = 'flash_banner' then 'flash'
  when slot_type = 'header_banner' then 'in_feed'
  when slot_type = 'featured_pin' then 'map_overlay'
  else 'in_feed'
end
where placement_location is null or placement_location = 'in_feed';

-- 3. Seed diverse multi-ad campaigns across all strategic placements
do $$
declare
  t_id uuid;
  d_id uuid;
  cat_cowork uuid;
  cat_health uuid;
  cat_cafe uuid;
begin
  select id into t_id from public.tenants limit 1;
  if t_id is not null then
    select id into d_id from public.domains where tenant_id = t_id limit 1;
    select id into cat_cowork from public.categories where slug = 'coworking-spaces' or name ilike '%cowork%' limit 1;
    select id into cat_health from public.categories where slug = 'hospitals' or name ilike '%hospital%' limit 1;
    select id into cat_cafe from public.categories where slug = 'cafes' or name ilike '%cafe%' limit 1;

    if d_id is not null then
      -- Multi-ad 1: Second Top Flash Banner (for auto-rotation carousel)
      if not exists (select 1 from public.ad_slots where sponsor_name = 'Swiggy Gourmet') then
        insert into public.ad_slots (
          tenant_id, domain_id, slot_type, placement_location, sponsor_name,
          title, description, cta_text, badge_text, target_url, banner_url,
          start_date, end_date, status, price_paid
        ) values (
          t_id, d_id, 'flash_banner', 'flash', 'Swiggy Gourmet',
          'Explore Bangalore’s Finest Culinary Cafes & Chef-Curated Dining with 30% Off',
          'Fast delivery from top-rated dining venues across Indiranagar, CBD, and Koramangala.',
          'Explore Menus', 'Dining Partner', 'https://swiggy.com',
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
          timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '45 days', 'active', 399.00
        );
      end if;

      -- Multi-ad 2: In-feed Ad #2 (IndiQube Coworking)
      if not exists (select 1 from public.ad_slots where sponsor_name = 'IndiQube Spaces') then
        insert into public.ad_slots (
          tenant_id, domain_id, target_category_id, slot_type, placement_location, sponsor_name,
          title, description, cta_text, badge_text, target_url, banner_url,
          start_date, end_date, status, price_paid
        ) values (
          t_id, d_id, cat_cowork, 'featured_listing', 'in_feed', 'IndiQube Spaces',
          'Smart Business Ecosystems & Custom Enterprise Workspaces in Bangalore',
          'Fully serviced tech office parks in Outer Ring Road, Whitefield & HSR Layout.',
          'Book Tour', 'Featured Space', 'https://indiqube.com',
          'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
          timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '60 days', 'active', 499.00
        );
      end if;

      -- Multi-ad 3: Interactive Map Overlay Spotlight (Third Wave Coffee)
      if not exists (select 1 from public.ad_slots where sponsor_name = 'Third Wave Coffee') then
        insert into public.ad_slots (
          tenant_id, domain_id, target_category_id, slot_type, placement_location, sponsor_name,
          title, description, cta_text, badge_text, target_url, banner_url,
          start_date, end_date, status, price_paid
        ) values (
          t_id, d_id, cat_cafe, 'featured_pin', 'map_overlay', 'Third Wave Coffee',
          'Artisanal Specialty Roasts & Work-Friendly Cafes Across Bengaluru',
          'High-speed WiFi, quiet corners, and single-origin pour-overs.',
          'Find Nearest Cafe', 'Map Spotlight', 'https://thirdwavecoffeeroasters.com',
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
          timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '90 days', 'active', 599.00
        );
      end if;

      -- Multi-ad 4: Place Profile Sidebar / Bottom Showcase (Aster Healthcare)
      if not exists (select 1 from public.ad_slots where sponsor_name = 'Aster CMI Healthcare') then
        insert into public.ad_slots (
          tenant_id, domain_id, target_category_id, slot_type, placement_location, sponsor_name,
          title, description, cta_text, badge_text, target_url, banner_url,
          start_date, end_date, status, price_paid
        ) values (
          t_id, d_id, cat_health, 'header_banner', 'sidebar', 'Aster CMI Healthcare',
          '24/7 Advanced Multispecialty Care & Emergency Trauma Unit in Hebbal',
          'JCI-accredited tertiary care with robotic surgery and rapid ambulance response.',
          'Call Helpline', 'Healthcare Partner', 'https://asterbangalore.com',
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
          timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '60 days', 'active', 699.00
        );
      end if;

      -- Multi-ad 5: Place Detail Bottom Showcase (Razorpay X)
      if not exists (select 1 from public.ad_slots where sponsor_name = 'RazorpayX Business Banking') then
        insert into public.ad_slots (
          tenant_id, domain_id, slot_type, placement_location, sponsor_name,
          title, description, cta_text, badge_text, target_url, banner_url,
          start_date, end_date, status, price_paid
        ) values (
          t_id, d_id, 'header_banner', 'detail_bottom', 'RazorpayX Business Banking',
          'Automate Vendor Payouts, Payroll, and Corporate Cards for Local Businesses',
          'Supercharge your business finances with India’s leading neo-banking stack.',
          'Open Account', 'Fintech Partner', 'https://razorpay.com/x',
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
          timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '45 days', 'active', 799.00
        );
      end if;
    end if;
  end if;
end $$;
