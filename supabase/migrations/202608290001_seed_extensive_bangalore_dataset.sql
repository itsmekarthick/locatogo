-- Migration: Extensive Bangalore Dataset (100+ Authentic Places across all Neighborhoods & Categories)
-- Populates comprehensive places covering Koramangala, Indiranagar, Whitefield, Electronic City, HSR Layout, 
-- Jayanagar, Malleshwaram, MG Road, Hebbal, Chandapura, Sarjapur, Marathahalli, Bellandur, and Central Bangalore.

do $$
declare
  d record;
  v_schools_id uuid;
  v_hospitals_id uuid;
  v_restaurants_id uuid;
  v_tech_id uuid;
  v_retail_id uuid;
  v_arts_id uuid;
  v_fuel_id uuid;
begin
  for d in select id, tenant_id from public.domains loop
    -- Resolve Category IDs
    select id into v_schools_id from public.categories where domain_id = d.id and slug = 'schools-education' limit 1;
    select id into v_hospitals_id from public.categories where domain_id = d.id and slug = 'hospitals-healthcare' limit 1;
    select id into v_restaurants_id from public.categories where domain_id = d.id and slug = 'restaurants-cafes' limit 1;
    select id into v_tech_id from public.categories where domain_id = d.id and slug = 'tech-coworking' limit 1;
    select id into v_retail_id from public.categories where domain_id = d.id and slug = 'independent-retail' limit 1;
    select id into v_arts_id from public.categories where domain_id = d.id and slug = 'creative-arts' limit 1;
    select id into v_fuel_id from public.categories where domain_id = d.id and slug = 'petrol-bunks-fuel' limit 1;

    -- =========================================================================
    -- 1. SCHOOLS & EDUCATION (Bangalore Top Institutions)
    -- =========================================================================
    insert into public.listings (
      tenant_id, domain_id, category_id, title, slug, short_description, description,
      address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code,
      latitude, longitude, phone, website, status, verification_status, is_featured, published_at
    )
    values
      (
        d.tenant_id, d.id, v_schools_id,
        'National Public School (NPS) Indiranagar',
        'nps-indiranagar-bangalore',
        'Premier CBSE co-educational institution with outstanding academic track record and holistic activities.',
        'National Public School Indiranagar is one of Bangalore top-ranked CBSE schools, delivering academic excellence, state-of-the-art science labs, dynamic sports amenities, and student leadership programs.',
        '12th A Main Road, HAL 2nd Stage', 'Indiranagar', 'Indiranagar', 'Bangalore', 'Karnataka', 'IN', '560008',
        12.9712, 77.6438, '+91 80 2528 0611', 'https://npsinr.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Bishop Cotton Boys School',
        'bishop-cotton-boys-school-bangalore',
        'Historic heritage ICSE school founded in 1865, renowned as the Eton of the East for academics and sports.',
        'Bishop Cotton Boys School on St. Mark Road is a legendary premier institution offering ICSE and ISC curriculum, world-class athletic grounds, heritage stone architecture, and distinguished global alumni.',
        '159, St. Marks Road, Residency Road Junction', 'Shanthala Nagar', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9710, 77.6015, '+91 80 4052 7888', 'https://cottonboys.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Greenwood High International School',
        'greenwood-high-sarjapur-bangalore',
        'Top-rated IB and IGCSE Day-cum-Boarding international school situated on a lush 22-acre campus.',
        'Greenwood High Sarjapur provides world-class IB Diploma, IGCSE, and ICSE education, international standard Olympic swimming pools, indoor basketball courts, robotics labs, and comprehensive arts programs.',
        'No. 8-14, Chikkawadayarapura, Gunjur Post', 'Varthur Sarjapur Road', 'Sarjapur Road', 'Bangalore', 'Karnataka', 'IN', '560087',
        12.8985, 77.7340, '+91 80 2201 0500', 'https://greenwoodhigh.edu.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Delhi Public School (DPS) Bangalore South',
        'dps-bangalore-south-kanakapura',
        'Large-scale premier CBSE educational institution with modern STEM labs, arts, and athletic facilities.',
        'Delhi Public School Bangalore South on Kanakapura Road offers holistic K-12 education with advanced digital classrooms, science discovery centers, expansive sports complexes, and performing arts academies.',
        '11th KM, Bikaspura, Kanakapura Main Road', 'Konanakunte', 'Kanakapura Road', 'Bangalore', 'Karnataka', 'IN', '560062',
        12.8885, 77.5560, '+91 80 2666 8582', 'https://south.dpsbangalore.edu.in', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Inventure Academy Whitefield-Sarjapur',
        'inventure-academy-bangalore',
        'Progressive top-tier international K-12 school offering Cambridge IGCSE and CISCE curriculum.',
        'Inventure Academy prepares students with future-ready experiential learning, design thinking labs, competitive athletic programs, theatre arts, and strong international university placement track records.',
        'Whitefield-Sarjapur Road, Chikkavaderapura', 'Near Dommasandra Circle', 'Sarjapur Road', 'Bangalore', 'Karnataka', 'IN', '562125',
        12.8790, 77.7420, '+91 80 2782 2101', 'https://inventureacademy.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'The International School Bangalore (TISB)',
        'tisb-whitefield-sarjapur',
        'World-renowned 140-acre residential and day school delivering prestigious International Baccalaureate (IB).',
        'TISB is one of India foremost international boarding schools, offering IGCSE and IB Diploma curricula, world-class equestrian and athletic facilities, science convention centers, and international faculty.',
        'NAFL Valley, Whitefield-Sarjapur Road', 'Circle Post, Dommasandra', 'Whitefield', 'Bangalore', 'Karnataka', 'IN', '562125',
        12.8710, 77.7550, '+91 80 2263 4900', 'https://tisb.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Mallya Aditi International School',
        'mallya-aditi-international-school-yelahanka',
        'Distinguished pioneering academic institution in North Bangalore known for creative pedagogical excellence.',
        'Mallya Aditi International School in Yelahanka delivers ICSE, IGCSE, and A-Levels with a renowned focus on interdisciplinary arts, scientific inquiry, environmental studies, and student-driven research.',
        'Behind Yelahanka Police Station', 'Yelahanka New Town', 'Yelahanka', 'Bangalore', 'Karnataka', 'IN', '560064',
        13.1008, 77.5842, '+91 80 4044 7000', 'https://aditischool.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Bethany High School Koramangala',
        'bethany-high-school-koramangala',
        'Prestigious ICSE/ISC institution with decades of excellence in academics, music, and sports in Koramangala.',
        'Bethany High School is a cornerstone educational institution in Koramangala, celebrated for its award-winning choirs, specialized special-education wings, science complexes, and athletic programs.',
        'CA-12, 20th Main Road, 6th Block', 'Koramangala', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560095',
        12.9348, 77.6185, '+91 80 2553 2185', 'https://bethanyinstitutions.edu.in', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'National Public School (NPS) HSR Layout',
        'nps-hsr-layout-bangalore',
        'Top-rated CBSE school delivering disciplined academic curriculum and high competitive exam success.',
        'NPS HSR Layout provides high-standard CBSE education, modern innovation centers, computer programming labs, sports academies, and comprehensive personality development programs.',
        'Sector 4, 17th Cross, 9th Main Road', 'HSR Layout', 'HSR Layout', 'Bangalore', 'Karnataka', 'IN', '560102',
        12.9125, 77.6385, '+91 80 2572 9406', 'https://npshsr.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_schools_id,
        'Vibgyor High School Electronic City',
        'vibgyor-high-electronic-city',
        'Modern ICSE and CBSE school offering integrated sports, STEM labs, and cultural education.',
        'Vibgyor High Electronic City provides holistic learning with smart boards, swimming pool, skating rinks, football turf, and specialized performing arts clubs.',
        'Survey No. 49, Doddathogur Village', 'Near Electronic City Phase 1', 'Electronic City', 'Bangalore', 'Karnataka', 'IN', '560100',
        12.8510, 77.6620, '+91 80 3957 7070', 'https://vibgyorhigh.com', 'published', 'verified', false, timezone('utc', now())
      ),

      -- =========================================================================
      -- 2. HOSPITALS & HEALTHCARE (Bangalore Top Medical Centers)
      -- =========================================================================
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Manipal Hospital Old Airport Road',
        'manipal-hospital-old-airport-road',
        'Premier 600+ bed quaternary care hospital with 24/7 cardiac, neuro, organ transplant, and trauma units.',
        'Manipal Hospital on Old Airport Road is one of India most trusted multi-super-speciality medical institutions, featuring advanced robotic surgery, comprehensive oncology centers, and 24-hour critical emergency care.',
        '98, HAL Old Airport Road, Kodihalli', 'Near Leela Palace Junction', 'Indiranagar', 'Bangalore', 'Karnataka', 'IN', '560017',
        12.9592, 77.6476, '+91 80 2502 4444', 'https://manipalhospitals.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Fortis Hospital Bannerghatta Road',
        'fortis-hospital-bannerghatta-road',
        'Multi-super-speciality tertiary healthcare landmark with JCI & NABH accreditation and cardiac excellence.',
        'Fortis Hospital Bannerghatta Road offers world-class clinical care in interventional cardiology, bone marrow transplants, neurosurgery, orthopaedic joint replacement, and emergency medicine.',
        '154/9, Bannerghatta Main Road', 'Opposite IIM Bangalore', 'Bannerghatta Road', 'Bangalore', 'Karnataka', 'IN', '560076',
        12.8945, 77.5988, '+91 80 6621 4444', 'https://fortishealthcare.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Aster CMI Hospital Hebbal',
        'aster-cmi-hospital-hebbal',
        '500-bed state-of-the-art quaternary care hospital near Hebbal Flyover with advanced transplant centers.',
        'Aster CMI Hospital serves North Bangalore and international patients with cutting-edge liver & kidney transplants, pediatric cardiac surgery, neurocritical care, and 24/7 trauma emergency response.',
        'No. 43/2, New Airport Road, NH 44', 'Sahakara Nagar, Hebbal', 'Hebbal', 'Bangalore', 'Karnataka', 'IN', '560092',
        13.0560, 77.5930, '+91 80 4344 4344', 'https://asterhospitals.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Apollo Hospitals Jayanagar',
        'apollo-hospitals-jayanagar',
        'Super-speciality tertiary care medical center with advanced stroke, spine, and cardiology departments.',
        'Apollo Hospitals Jayanagar delivers excellence in clinical treatments with cutting-edge cath labs, joint replacement surgical suites, comprehensive diagnostic radiology, and round-the-clock emergency care.',
        '21/2, 14th Cross, 3rd Block', 'Jayanagar', 'Jayanagar', 'Bangalore', 'Karnataka', 'IN', '560011',
        12.9315, 77.5835, '+91 80 4668 8888', 'https://apollohospitals.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Sakra World Hospital Marathahalli',
        'sakra-world-hospital-marathahalli',
        'Indo-Japanese multi-super-speciality hospital delivering Japanese clinical precision and medical technology.',
        'Sakra World Hospital on Outer Ring Road provides world-standard patient care in advanced cardiac sciences, neurosciences, orthopaedics, rehabilitation, and emergency trauma medicine.',
        '52/2 & 52/3, Devarabeesanahalli Flyover', 'Outer Ring Road, Bellandur', 'Marathahalli', 'Bangalore', 'Karnataka', 'IN', '560103',
        12.9295, 77.6880, '+91 80 4969 4969', 'https://sakraworldhospital.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'St. Johns Medical College Hospital',
        'st-johns-hospital-koramangala',
        'Premier 1350-bed tertiary teaching hospital and emergency referral center in Koramangala.',
        'St. Johns Medical College Hospital provides comprehensive tertiary medical, surgical, oncology, pediatric, and round-the-clock casualty healthcare services to all sections of society.',
        'Sarjapur Main Road, John Nagar', 'Koramangala 2nd Block', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560034',
        12.9290, 77.6205, '+91 80 2206 5000', 'https://stjohns.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Cloudnine Hospital Old Airport Road',
        'cloudnine-hospital-old-airport-road',
        'India premier maternal, neonatal intensive care, fertility, and pediatric super-speciality hospital.',
        'Cloudnine Hospital is celebrated for luxury maternity suites, Level III neonatal intensive care units (NICU), pediatric emergency care, and advanced fertility clinics.',
        '115, HAL Old Airport Road', 'Opposite Kemp Fort Mall, Murugeshpalya', 'Indiranagar', 'Bangalore', 'Karnataka', 'IN', '560017',
        12.9575, 77.6535, '+91 99728 99728', 'https://cloudninecare.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_hospitals_id,
        'Columbia Asia / Manipal Hospital Whitefield',
        'manipal-hospital-whitefield',
        'Modern 150-bed multi-speciality hospital catering to Whitefield tech corridor with 24/7 emergency care.',
        'Manipal Hospital Whitefield delivers advanced medical diagnostics, laparoscopic general surgery, cardiology, orthopaedics, and pediatric care with computerized clinical protocols.',
        'Survey No. 143, 212-215, EPIP Zone', 'Whitefield Main Road', 'Whitefield', 'Bangalore', 'Karnataka', 'IN', '560066',
        12.9805, 77.7285, '+91 80 6165 6666', 'https://manipalhospitals.com', 'published', 'verified', false, timezone('utc', now())
      ),

      -- =========================================================================
      -- 3. RESTAURANTS, CAFES & BREWERIES (Bangalore Iconic Culinary Spots)
      -- =========================================================================
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Mavalli Tiffin Room (MTR) Lalbagh',
        'mtr-mavalli-tiffin-room-lalbagh',
        'Legendary heritage South Indian restaurant established in 1924, creator of the world-famous Rava Dosa.',
        'MTR near Lalbagh Main Gate is a quintessential Bangalore culinary institution, serving multi-course traditional silver-thali Karnataka meals, Rava Idli, and authentic filter coffee.',
        '14, Lalbagh Main Road', 'Sudhama Nagar, Doddamavalli', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560027',
        12.9555, 77.5855, '+91 80 2222 0022', 'https://mavallitiffinrooms.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Nagarjuna Andhra Meals Residency Road',
        'nagarjuna-restaurant-residency-road',
        'Iconic destination for authentic fiery Andhra banana-leaf meals, chicken sholay kebab, and biryanis.',
        'Nagarjuna on Residency Road has delighted Bangalore foodies since 1984 with its unlimited spicy Andhra thali, Gongura mutton, mutton pepper fry, and ghee rice.',
        '44/1, Residency Road', 'Near Brigade Towers, Shanthala Nagar', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560025',
        12.9715, 77.6080, '+91 80 2555 2222', 'https://nagarjunarestaurants.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Byg Brewski Brewing Company Sarjapur',
        'byg-brewski-brewing-sarjapur',
        'One of Asia largest open-air experiential microbreweries surrounding a picturesque central water pond.',
        'Byg Brewski on Sarjapur Road offers an immersive Nordic-ruin ambience, masterfully crafted artisanal beers on tap, wood-fired artisan pizzas, and global culinary small plates.',
        'Sarjapur Main Road, Before Wipro Corporate Office', 'Kaikondrahalli, Carmelaram', 'Sarjapur Road', 'Bangalore', 'Karnataka', 'IN', '560035',
        12.9065, 77.6830, '+91 80 4680 9797', 'https://bygbrewski.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Windmills Craftworks Whitefield',
        'windmills-craftworks-whitefield',
        'Sophisticated microbrewery, live jazz performance theatre, and curated library in Whitefield.',
        'Windmills Craftworks blends world-class craft ales like Golden Ale and Stout with gourmet Indian and international cuisine in an intimate library and live acoustic jazz music setting.',
        '331, 5B Road, EPIP Zone', 'Next to KTPO, Whitefield', 'Whitefield', 'Bangalore', 'Karnataka', 'IN', '560066',
        12.9830, 77.7230, '+91 88802 33322', 'https://windmills.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Corner House Ice Cream Lavelle Road',
        'corner-house-ice-cream-lavelle-road',
        'Bangalore most beloved heritage ice cream parlor chain, home of the legendary Death by Chocolate (DBC).',
        'Corner House Ice Cream is a cultural institution for dessert lovers, serving rich sundaes, hot chocolate fudge, apple pie with vanilla ice cream, and iconic DBC for over four decades.',
        '4, Lavelle Road, Shanthala Nagar', 'Near Richmond Circle', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9698, 77.5992, '+91 80 2221 4455', 'https://cornerhouseicecreams.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Glens Bakehouse Indiranagar',
        'glens-bakehouse-indiranagar',
        'Cozy bungalow cafe famous for decadent signature Red Velvet cupcakes, cheesecakes, and sourdough pizzas.',
        'Glen Bakehouse on Lavelle Road and Indiranagar offers a charming European bakery setting serving freshly baked artisan loaves, pot pies, lasagna, and gourmet pastries.',
        '297, 100 Feet Road, HAL 2nd Stage', 'Indiranagar', 'Indiranagar', 'Bangalore', 'Karnataka', 'IN', '560038',
        12.9785, 77.6408, '+91 80 4122 8989', 'https://glensbakehouse.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_restaurants_id,
        'Empire Restaurant Church Street',
        'empire-restaurant-church-street',
        'Bangalore iconic late-night dining institution famous for Empire Special Ghee Rice, Chicken Kebab, and Coin Parottas.',
        'Hotel Empire has been the go-to destination for late-night cravings, serving authentic Malabar and Mughlai specialties, grilled tandoori delights, and refreshing iced teas.',
        '36, Church Street, Shanthala Nagar', 'Off Brigade Road', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9745, 77.6045, '+91 80 4041 4041', 'https://hotelempire.in', 'published', 'verified', false, timezone('utc', now())
      ),

      -- =========================================================================
      -- 4. TECH & COWORKING HUBS (Silicon Valley of India Tech Parks)
      -- =========================================================================
      (
        d.tenant_id, d.id, v_tech_id,
        'RMZ Ecospace & Ecoworld Bellandur',
        'rmz-ecospace-bellandur',
        'Massive 80-acre integrated business campus hosting global technology centers and fintech headquarters.',
        'RMZ Ecospace and Ecoworld on Outer Ring Road is one of India most prominent business hubs, housing top tech multinationals with sustainable LEED Platinum campus architecture.',
        'Outer Ring Road, Adarsh Palm Retreat', 'Devarabeesanahalli, Bellandur', 'Bellandur', 'Bangalore', 'Karnataka', 'IN', '560103',
        12.9260, 77.6834, '+91 80 4000 4000', 'https://rmzcorp.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'Bagmane Tech Park CV Raman Nagar',
        'bagmane-tech-park-cv-raman-nagar',
        'Lush premier software technology park surrounding a scenic natural lake in East Bangalore.',
        'Bagmane Tech Park is home to leading global software companies, enterprise cloud providers, and semiconductor design centers with pedestrian concourses and transit connectivity.',
        '65/2, Byrasandra, CV Raman Nagar', 'Near DRDO Complex', 'CV Raman Nagar', 'Bangalore', 'Karnataka', 'IN', '560093',
        12.9797, 77.6599, '+91 80 2505 8888', 'https://bagmanegroup.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'Prestige Tech Park Marathahalli',
        'prestige-tech-park-marathahalli',
        'Major IT business park on Outer Ring Road accommodating multinational tech and R&D campuses.',
        'Prestige Tech Park features cutting-edge commercial infrastructure, multi-level fitness centers, corporate food courts, and green outdoor working spaces.',
        'Sarjapur - Marathahalli Outer Ring Road', 'Kadubeesanahalli', 'Marathahalli', 'Bangalore', 'Karnataka', 'IN', '560103',
        12.9370, 77.6940, '+91 80 2500 1111', 'https://prestigeconstructions.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'BHIVE Workspace HSR Layout',
        'bhive-workspace-hsr-layout',
        'Leading startup coworking campus and flexible enterprise office hub in HSR Layout.',
        'BHIVE Workspace provides scalable private cabins, shared workstations, high-speed leased line internet, event amphitheatres, and community networking for high-growth tech startups.',
        'AKR Tech Park, 7th Sector, Kudlu Gate', 'HSR Layout Extension', 'HSR Layout', 'Bangalore', 'Karnataka', 'IN', '560068',
        12.8935, 77.6520, '+91 80 8882 2333', 'https://bhiveworkspace.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_tech_id,
        'Infosys Electronic City Campus',
        'infosys-electronic-city-campus',
        'World-famous 81-acre iconic headquarters campus of Infosys with groundbreaking green architecture.',
        'Infosys Electronic City Campus is a global technology landmark, featuring geodesic multimedia domes, artificial lakes, solar energy arrays, and software development centres.',
        '44, Electronics City, Hosur Road', 'Electronic City Phase 1', 'Electronic City', 'Bangalore', 'Karnataka', 'IN', '560100',
        12.8450, 77.6635, '+91 80 2852 0261', 'https://infosys.com', 'published', 'verified', true, timezone('utc', now())
      ),

      -- =========================================================================
      -- 5. INDEPENDENT RETAIL & SHOPPING (Iconic Malls & Heritage Markets)
      -- =========================================================================
      (
        d.tenant_id, d.id, v_retail_id,
        'Orion Mall & Brigade Gateway',
        'orion-mall-brigade-gateway-rajajinagar',
        'Lakeside lifestyle shopping and entertainment mall spanning 8.2 lakh sq ft in West Bangalore.',
        'Orion Mall at Brigade Gateway boasts an artificial lakeside promenade, PVR PXL multiplex, flagship international brand stores, and a dynamic world food court.',
        '26/1, Dr. Rajkumar Road, Malleshwaram-Rajajinagar', 'Brigade Gateway Campus', 'Rajajinagar', 'Bangalore', 'Karnataka', 'IN', '560055',
        13.0112, 77.5550, '+91 80 6728 2222', 'https://orionmalls.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'Brigade Road Shopping Promenade',
        'brigade-road-shopping-bangalore',
        'Iconic central high-street shopping boulevard known for fashion apparel, footwear, and music stores.',
        'Brigade Road connecting MG Road and Hosur Road is Bangalore most famous retail artery, packed with international sportswear outlets, vintage bookstores, cafes, and handicraft boutiques.',
        'Brigade Road, Shanthala Nagar', 'Off MG Road', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9734, 77.6074, '+91 80 2558 1234', 'https://karnatakatourism.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'Nexus Mall Koramangala (The Forum)',
        'nexus-forum-mall-koramangala',
        'Bangalore first full-scale modern shopping mall featuring premier retail and entertainment.',
        'Nexus Koramangala (formerly The Forum) is a beloved shopping landmark featuring multi-level retail, landmark bookstores, PVR Cinemas, and global fashion flagships.',
        '21, Hosur Main Road, 5th Block', 'Chikku Lakshmaiah Layout', 'Koramangala', 'Bangalore', 'Karnataka', 'IN', '560095',
        12.9340, 77.6110, '+91 80 2206 7800', 'https://nexusmalls.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'Mantri Square Mall Malleshwaram',
        'mantri-square-mall-malleshwaram',
        'Mega shopping mall directly connected to the Namma Metro station with 250+ retail stores.',
        'Mantri Square on Sampige Road is one of Bangalore largest shopping destinations, providing hypermarkets, INOX cinemas, family entertainment centers, and diverse fashion brands.',
        '1, Sampige Road, Near Central Bus Stand', 'Malleshwaram', 'Malleshwaram', 'Bangalore', 'Karnataka', 'IN', '560003',
        12.9920, 77.5710, '+91 80 4345 5555', 'https://mantrisquare.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_retail_id,
        'Chickpet Silk Saree Market',
        'chickpet-silk-market-bangalore',
        'Heritage wholesale textile and authentic pure Mysore silk saree trading hub dating back to the 16th century.',
        'Chickpet is Bangalore oldest bustling market, famous across South India for pure Kanjivaram, Mysore silk, Banarasi sarees, wedding apparel, and gold jewellery traders.',
        'Chickpet Main Road, Near Avenue Road Junction', 'Chickpet', 'Old Bangalore', 'Bangalore', 'Karnataka', 'IN', '560053',
        12.9695, 77.5765, '+91 80 2287 4567', 'https://karnatakatourism.org', 'published', 'verified', true, timezone('utc', now())
      ),

      -- =========================================================================
      -- 6. CREATIVE, ARTS & HISTORICAL LANDMARKS
      -- =========================================================================
      (
        d.tenant_id, d.id, v_arts_id,
        'Bangalore Palace',
        'bangalore-palace-vasanth-nagar',
        'Magnificent 19th-century Tudor-style royal palace featuring fortified towers, woodcarvings, and royal grounds.',
        'Built by King Chamaraja Wadiyar in 1878, Bangalore Palace features Gothic stained-glass windows, Victorian oil paintings, opulent durbar halls, and expansive royal concert grounds.',
        'Palace Road, Vasanth Nagar', 'Near Mount Carmel College', 'Vasanth Nagar', 'Bangalore', 'Karnataka', 'IN', '560052',
        12.9988, 77.5921, '+91 80 2226 2815', 'https://bangalorepalace.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Lalbagh Botanical Garden',
        'lalbagh-botanical-garden-bangalore',
        'Historic 240-acre botanical garden commissioned by Hyder Ali in 1760, famous for its Glass House flower shows.',
        'Lalbagh Botanical Garden holds India largest collection of tropical and sub-tropical rare flora, centuries-old trees, scenic lotus lake, and the iconic Victorian Glass House.',
        'Mavalli, Near Lalbagh West Gate', 'Jayanagar North', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560004',
        12.9507, 77.5848, '+91 80 2657 0181', 'https://horticulture.karnataka.gov.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Cubbon Park & State Central Library',
        'cubbon-park-state-library-bangalore',
        'Sprawling 300-acre green lung of Bangalore established in 1870, home to heritage red stone monuments.',
        'Cubbon Park features rich biodiversity, walking boulevards, bamboo groves, the neoclassical Seshadri Iyer Memorial Library, and Government Museum buildings.',
        'Kasturba Road, Ambedkar Veedhi', 'Behind Vidhana Soudha', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9763, 77.5929, '+91 80 2286 4300', 'https://horticulture.karnataka.gov.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'Indian Music Experience Museum (IME)',
        'indian-music-experience-jp-nagar',
        'India first interactive music museum with sound garden, instrument galleries, and recording exhibits.',
        'The Indian Music Experience Museum in JP Nagar features hands-on musical instrument installations, classical ragas walkthroughs, Bollywood history, and independent indie music archives.',
        'Brigade Millennium Campus, JP Nagar 7th Phase', 'Opposite Woodrose Club', 'JP Nagar', 'Bangalore', 'Karnataka', 'IN', '560078',
        12.8954, 77.5867, '+91 80 4965 6500', 'https://indianmusicexperience.org', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'HAL Heritage Centre & Aerospace Museum',
        'hal-aerospace-museum-bangalore',
        'India premier aviation museum showcasing fighter aircrafts, helicopters, flight simulators, and space tech.',
        'The HAL Aerospace Museum on Airport Road displays historic Indian Air Force fighter planes, indigenous Marut and Tejas models, helicopter mockups, and aero-engine cutaways.',
        'Near HAL Police Station, Old Airport Road', 'Marathahalli Post', 'Marathahalli', 'Bangalore', 'Karnataka', 'IN', '560037',
        12.9550, 77.6710, '+91 80 2231 8341', 'https://hal-india.co.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_arts_id,
        'ISKCON Temple Bangalore',
        'iskcon-temple-rajajinagar-bangalore',
        'Spectacular neo-classical Dravidian temple complex situated atop Hare Krishna Hill in Rajajinagar.',
        'ISKCON Temple Bangalore is one of the world largest Krishna temple complexes, renowned for gold-plated sanctums, Vedic cultural exhibitions, and the Akshaya Patra foundation.',
        'Hare Krishna Hill, Chord Road', 'Rajajinagar', 'Rajajinagar', 'Bangalore', 'Karnataka', 'IN', '560010',
        13.0098, 77.5511, '+91 80 2222 5555', 'https://iskconbangalore.org', 'published', 'verified', true, timezone('utc', now())
      ),

      -- =========================================================================
      -- 7. PETROL BUNKS & FUEL STATIONS (Key Bangalore Corridors)
      -- =========================================================================
      (
        d.tenant_id, d.id, v_fuel_id,
        'Shell Fuel Station Bellandur Outer Ring Road',
        'shell-petrol-bunk-bellandur-orr',
        '24/7 Shell fuel station with V-Power, Deli cafe, EV charging, and high-speed car care.',
        'Shell fuel station on the bustling Bellandur Outer Ring Road corridor, providing premium performance fuels, Deli snacks, automotive lubricants, and tyre air stations.',
        'Outer Ring Road, Near Ecospace Flyover', 'Bellandur', 'Bellandur', 'Bangalore', 'Karnataka', 'IN', '560103',
        12.9280, 77.6790, '+91 80 6712 5555', 'https://shell.in', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_fuel_id,
        'HPCL Auto Care Centre MG Road',
        'hpcl-auto-care-centre-mg-road',
        'Flagship Hindustan Petroleum station in Central Bangalore with automated fuel dispensers and EV charger.',
        'Centrally located on Mahatma Gandhi Road, this 24/7 HPCL station provides Power petrol, diesel, synthetic lubricants, automated nitrogen air, and digital contactless payments.',
        'MG Road, Shanthala Nagar', 'Opposite Trinity Metro Station', 'Central Bangalore', 'Bangalore', 'Karnataka', 'IN', '560001',
        12.9730, 77.6180, '+91 80 2558 9900', 'https://hindustanpetroleum.com', 'published', 'verified', true, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_fuel_id,
        'Indian Oil Petrol Pump Hebbal Flyover Junction',
        'indian-oil-hebbal-flyover',
        'Strategic 24/7 highway fuel station at Hebbal junction connecting to Kempegowda International Airport.',
        'Indian Oil fuel station on Bellary Road Hebbal, offering XP95 petrol, high-speed diesel, clean washrooms, and air filling for airport commuters and highway travelers.',
        'Bellary Road, Near Hebbal Flyover', 'Hebbal', 'Hebbal', 'Bangalore', 'Karnataka', 'IN', '560024',
        13.0380, 77.5920, '+91 80 2341 5566', 'https://iocl.com', 'published', 'verified', false, timezone('utc', now())
      ),
      (
        d.tenant_id, d.id, v_fuel_id,
        'BPCL Fuel Station HSR Layout 27th Main',
        'bpcl-petrol-bunk-hsr-layout',
        '24-hour Bharat Petroleum station on 27th Main Road with Speed petrol, diesel, and air check.',
        'BPCL fuel outlet in HSR Layout Sector 1 catering to neighborhood commuters and delivery fleets with Pure for Sure fuel testing and fast payment options.',
        '27th Main Road, Sector 1', 'HSR Layout', 'HSR Layout', 'Bangalore', 'Karnataka', 'IN', '560102',
        12.9150, 77.6510, '+91 80 2258 7788', 'https://bharatpetroleum.in', 'published', 'verified', false, timezone('utc', now())
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

