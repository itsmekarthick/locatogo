-- Migration: Seed Iconic Bangalore Places Across All Categories
-- Adds places for Restaurants & Cafes, Tech & Coworking, Independent Retail, and Creative & Arts.

do $$
declare
  d record;
  v_restaurants_id uuid;
  v_tech_id uuid;
  v_retail_id uuid;
  v_arts_id uuid;
begin
  for d in select id, tenant_id, name from public.domains loop
    -- 1. Ensure Categories exist and fetch their IDs
    -- Restaurants & Cafes
    insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
    values (d.tenant_id, d.id, 'Restaurants & Cafes', 'restaurants-cafes', 'Food, dining, coffee shops, and bakeries', 3, true)
    on conflict (domain_id, slug) do update set name = 'Restaurants & Cafes'
    returning id into v_restaurants_id;
    if v_restaurants_id is null then
      select id into v_restaurants_id from public.categories where domain_id = d.id and slug = 'restaurants-cafes' limit 1;
    end if;

    -- Tech & Coworking
    insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
    values (d.tenant_id, d.id, 'Tech & Coworking', 'tech-coworking', 'Technology hubs, startups, and shared workspaces', 4, true)
    on conflict (domain_id, slug) do update set name = 'Tech & Coworking'
    returning id into v_tech_id;
    if v_tech_id is null then
      select id into v_tech_id from public.categories where domain_id = d.id and slug = 'tech-coworking' limit 1;
    end if;

    -- Independent Retail
    insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
    values (d.tenant_id, d.id, 'Independent Retail', 'independent-retail', 'Boutiques, local goods, books, and specialty stores', 5, true)
    on conflict (domain_id, slug) do update set name = 'Independent Retail'
    returning id into v_retail_id;
    if v_retail_id is null then
      select id into v_retail_id from public.categories where domain_id = d.id and slug = 'independent-retail' limit 1;
    end if;

    -- Creative & Arts
    insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
    values (d.tenant_id, d.id, 'Creative & Arts', 'creative-arts', 'Studios, art galleries, design agencies, and makers', 6, true)
    on conflict (domain_id, slug) do update set name = 'Creative & Arts'
    returning id into v_arts_id;
    if v_arts_id is null then
      select id into v_arts_id from public.categories where domain_id = d.id and slug = 'creative-arts' limit 1;
    end if;

    -- 2. Seed RESTAURANTS & CAFES
    insert into public.listings (
      tenant_id, domain_id, category_id, title, slug, short_description, description,
      address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code,
      latitude, longitude, phone, website, status, verification_status, is_featured, published_at
    )
    values
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Truffles Koramangala',
        'truffles-koramangala',
        'Bustling cafe famous for gourmet all-American burgers, hearty pasta, peri-peri steaks, and decadent desserts.',
        'Truffles is an iconic Bangalore eatery in Koramangala renowned for its legendary crispy chicken burgers, loaded french fries, classic pastas, and handcrafted shakes.',
        '93, 4th B Cross Road, 5th Block', 'Koramangala Industrial Layout', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560034',
        12.9338, 77.6228, '+91 80 2552 2496', 'https://truffles.co.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Vidyarthi Bhavan Gandhi Bazaar',
        'vidyarthi-bhavan-gandhi-bazaar',
        'Iconic vintage heritage restaurant founded in 1943, celebrated for crispy golden butter masala dosas and filter coffee.',
        'Vidyarthi Bhavan in Basavanagudi has been a culinary temple for writers, artists, and food lovers for over 80 years, famous for its signature thick dosas served with pure ghee.',
        '32, Gandhi Bazaar Main Road', 'Basavanagudi', 'Basavanagudi', 'Bangalore', 'Karnataka', 'IN', '560004',
        12.9460, 77.5714, '+91 80 2667 7588', 'https://vidyarthibhavan.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Toit Brewpub Indiranagar',
        'toit-brewpub-indiranagar',
        'Bangalore flagship pioneer microbrewery on 100 Feet Road, serving legendary craft beers and wood-fired pizzas.',
        'Toit is Bangalore premier craft brewing destination, featuring famous signature brews like Tint-in-Wit, Colonial Toit, and decadent wood-fired sourdough pizzas.',
        '298, 100 Feet Road, Near Domlur Flyover', 'Indiranagar', 'Indiranagar', 'Bangalore', 'Karnataka', 'IN', '560038',
        12.9793, 77.6406, '+91 90197 13388', 'https://toit.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'CTR - Shri Sagar Malleshwaram',
        'ctr-shri-sagar-malleshwaram',
        'Legendary South Indian tiffin landmark on 7th Cross Malleshwaram, world-renowned for Benne Masala Dosa.',
        'Central Tiffin Room (CTR) Shri Sagar in Malleshwaram is famous for its crisp golden exterior and fluffy interior Benne Dosa served with mint and coconut chutneys.',
        '7th Cross Road, Margosa Road', 'Malleshwaram', 'Malleshwaram', 'Bangalore', 'Karnataka', 'IN', '560003',
        13.0039, 77.5684, '+91 80 2331 7531', 'https://shrisagarctr.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Third Wave Coffee Roasters Koramangala',
        'third-wave-coffee-koramangala',
        'Specialty artisanal coffee house and roastery offering single-origin manual pour-overs and cold brews.',
        'Third Wave Coffee Roasters serves ethically sourced Indian coffees roasted in-house, pairing specialty beverages with wholesome breakfasts and sandwiches.',
        '80 Feet Road, 4th Block', 'Koramangala', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560034',
        12.9345, 77.6258, '+91 80 4370 7695', 'https://thirdwavecoffeeroasters.com', 'published', 'verified', false, timezone('utc', now())
      ),

      -- 3. Seed TECH & COWORKING
      (
        d.tenant_id, d.id, v_tech_id,
        'WeWork Galaxy Residency Road',
        'wework-galaxy-residency-road',
        'Premier flagship coworking ecosystem and startup campus featuring private offices and conference suites.',
        'WeWork Galaxy on Residency Road offers flexible collaborative workspaces, private suites, and community events in the heart of Bangalore CBD.',
        '43, Residency Road, Shanthala Nagar', 'Richmond Town', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560025',
        12.9718, 77.6052, '+91 80 6828 7300', 'https://wework.co.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'International Tech Park Bangalore (ITPB)',
        'itpb-whitefield',
        'India premier 69-acre IT technology park housing global Fortune 500 tech corporations and R&D labs.',
        'ITPB Whitefield is an iconic business campus offering world-class technology infrastructure, executive conference spaces, and green working environments.',
        'ITPL Main Road, Pattandur Agrahara', 'Whitefield', 'Whitefield', 'Bangalore', 'Karnataka', 'IN', '560066',
        12.9868, 77.7382, '+91 80 4188 0000', 'https://capitaland.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'Manyata Embassy Business Park',
        'manyata-tech-park-hebbal',
        'One of Asia largest integrated tech parks situated in North Bangalore, accommodating top multinational tech giants.',
        'Manyata Embassy Business Park in Hebbal is a state-of-the-art office ecosystem spanning over 300 acres with direct highway connectivity.',
        'Outer Ring Road, Nagavara', 'Hebbal Corridor', 'Hebbal', 'Bangalore', 'Karnataka', 'IN', '560045',
        13.0487, 77.6200, '+91 80 4179 9999', 'https://embassyofficeparks.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        '91springboard 8th Block Koramangala',
        '91springboard-koramangala',
        'Vibrant 24/7 collaborative coworking space and startup incubator offering high-speed fiber connectivity.',
        '91springboard Koramangala provides fully managed dedicated desks, private cabins, and dynamic event programming for high-growth startups.',
        'Padmavathi Complex, 80 Feet Road', '8th Block Koramangala', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560095',
        12.9388, 77.6189, '+91 80 4748 6891', 'https://91springboard.com', 'published', 'verified', false, timezone('utc', now())
      ),

      -- 4. Seed INDEPENDENT RETAIL & SHOPPING
      (
        d.tenant_id, d.id, v_retail_id,
        'Commercial Street Shopping District',
        'commercial-street-bangalore',
        'Bangalore vibrant traditional retail promenade celebrated for apparel, silk fabrics, jewellery, and footwear.',
        'Commercial Street in Tasker Town is one of Bangalore oldest and most beloved shopping avenues, offering a rich variety of boutique fashion and tailoring.',
        'Commercial Street, Tasker Town', 'Shivajinagar', 'Shivajinagar', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9822, 77.6083, '+91 80 2558 7600', 'https://karnatakatourism.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'UB City Luxury Collection',
        'ub-city-vittal-mallya',
        'India first luxury commercial and retail destination on Vittal Mallya Road featuring high-end international designers.',
        'UB City represents high-end luxury in Bangalore, hosting prestigious global fashion houses, art galleries, fine-dining restaurants, and rooftop lounges.',
        '24, Vittal Mallya Road', 'KG Halli, D Souza Layout', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9719, 77.5958, '+91 80 2268 2222', 'https://ubcitybangalore.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'Phoenix Marketcity Whitefield',
        'phoenix-marketcity-whitefield',
        'Bangalore largest lifestyle and entertainment retail destination spanning over 1 million sq ft with 300+ global brands.',
        'Phoenix Marketcity on Whitefield Main Road offers extensive shopping, IMAX multiplex, international culinary dining, and open-air musical courtyards.',
        'Mahadevapura, Whitefield Main Road', 'Next to VR Bengaluru', 'Whitefield', 'Bangalore', 'Karnataka', 'IN', '560048',
        12.9972, 77.6967, '+91 80 6726 6111', 'https://phoenixmarketcity.com/bangalore', 'published', 'verified', false, timezone('utc', now())
      ),

      -- 5. Seed CREATIVE & ARTS
      (
        d.tenant_id, d.id, v_arts_id,
        'National Gallery of Modern Art (NGMA)',
        'ngma-bangalore',
        'Sprawling heritage mansion gallery set in 3.5-acre gardens, showcasing masterworks of modern Indian art.',
        'The National Gallery of Modern Art at Manikyavelu Mansion presents historical and contemporary paintings, sculptures, and photographic retrospectives in Bangalore.',
        '49, Manikyavelu Mansion, Palace Road', 'Vasanth Nagar', 'Vasanth Nagar', 'Bangalore', 'Karnataka', 'IN', '560052',
        12.9882, 77.5878, '+91 80 2234 2338', 'https://ngmaindia.gov.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Ranga Shankara Theatre',
        'ranga-shankara-theatre',
        'Prestigious cultural performance arts theatre in JP Nagar hosting live drama plays and creative workshops.',
        'Ranga Shankara is dedicated to staging theatre from across India, providing an intimate auditorium, bookshop, and cultural cafe for performing arts.',
        '36/2, 8th Cross Road, JP Nagar 2nd Phase', 'Near RV Dental College', 'JP Nagar', 'Bangalore', 'Karnataka', 'IN', '560078',
        12.9157, 77.5851, '+91 80 2659 2777', 'https://rangashankara.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Karnataka Chitrakala Parishath',
        'karnataka-chitrakala-parishath',
        'Renowned art institute and museum complex hosting 13 permanent galleries and folk art collections.',
        'Karnataka Chitrakala Parishath on Kumara Krupa Road is celebrated for traditional Mysore paintings, Russian master Roerich galleries, and the annual Chitra Santhe.',
        '1, Art Complex, Kumara Krupa Road', 'Near Hotel Lalit Ashok', 'Kumara Krupa', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9904, 77.5824, '+91 80 2226 1816', 'https://karnatakachitrakalaparishath.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Visvesvaraya Industrial & Technological Museum',
        'visvesvaraya-museum-bangalore',
        'Premier science and technology innovation museum situated near Cubbon Park with aerospace engines and robotics.',
        'VITM on Kasturba Road features hands-on interactive science exhibits, biotechnology galleries, and dinosaur animatronics attracting visitors of all ages.',
        'Kasturba Road, Near Cubbon Park', 'Ambedkar Veedhi', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9752, 77.5962, '+91 80 2286 6200', 'https://vismuseum.gov.in', 'published', 'verified', false, timezone('utc', now())
      )
    on conflict (domain_id, slug) do update set
      title = excluded.title,
      short_description = excluded.short_description,
      description = excluded.description,
      address_line_1 = excluded.address_line_1,
      address_line_2 = excluded.address_line_2,
      locality = excluded.locality,
      city = excluded.city,
      administrative_area = excluded.administrative_area,
      country_code = excluded.country_code,
      postal_code = excluded.postal_code,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      phone = excluded.phone,
      website = excluded.website,
      status = 'published',
      verification_status = excluded.verification_status,
      is_featured = excluded.is_featured;
  end loop;
end;
$$;

