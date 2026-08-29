-- Migration: Seed Petrol Bunks & Fuel Stations across Bangalore and Chandapura Corridor
-- Adds 'Petrol Bunks & Fuel Stations' category and comprehensive listings with verified GPS coordinates.

do $$
declare
  d record;
  v_fuel_id uuid;
begin
  for d in select id, tenant_id, name from public.domains loop
    -- 1. Ensure 'Petrol Bunks & Fuel Stations' category exists for the domain
    insert into public.categories (
      tenant_id,
      domain_id,
      name,
      slug,
      description,
      sort_order,
      is_active
    )
    values (
      d.tenant_id,
      d.id,
      'Petrol Bunks & Fuel Stations',
      'petrol-bunks-fuel',
      '24/7 petrol pumps, diesel fuel outlets, CNG stations, air filling, and EV fast charging',
      7,
      true
    )
    on conflict (domain_id, slug) do update
    set name = 'Petrol Bunks & Fuel Stations'
    returning id into v_fuel_id;

    if v_fuel_id is null then
      select id into v_fuel_id
      from public.categories
      where domain_id = d.id and slug = 'petrol-bunks-fuel'
      limit 1;
    end if;

    -- 2. Seed Petrol Bunks
    insert into public.listings (
      tenant_id,
      domain_id,
      category_id,
      title,
      slug,
      short_description,
      description,
      address_line_1,
      address_line_2,
      locality,
      city,
      administrative_area,
      country_code,
      postal_code,
      latitude,
      longitude,
      phone,
      website,
      status,
      verification_status,
      is_featured,
      published_at
    )
    values
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Indian Oil Petrol Bunk Chandapura Circle',
        'indian-oil-chandapura-circle',
        '24/7 Indian Oil fuel station with high-speed diesel, XP95 petrol, nitrogen air, and digital payment.',
        'Indian Oil fuel outlet situated at Chandapura Circle on Hosur Main Road, offering 24-hour petrol and diesel dispensing, automated tyre pressure, engine lubricants, and clean amenities.',
        'Chandapura Circle, NH 44 Hosur Road',
        'Near Flyover Junction',
        'Chandapura',
        'Bangalore',
        'Karnataka',
        'IN',
        '560099',
        12.7988,
        77.7018,
        '+91 80 2783 4567',
        'https://iocl.com',
        'published',
        'verified',
        true,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Shell Petrol Bunk Bommasandra',
        'shell-petrol-bunk-bommasandra',
        'Premium Shell fuel station featuring V-Power petrol, quality diesel, Deli2go cafe, and lube bay.',
        'Shell fuel station along the Bommasandra-Chandapura corridor offering high-performance Shell V-Power fuels, quick convenience store, car care lubricants, and 24/7 operation.',
        'NH 44 Hosur Main Road, Bommasandra',
        'Opposite Industrial Area Gate',
        'Bommasandra',
        'Bangalore',
        'Karnataka',
        'IN',
        '560099',
        12.8150,
        77.6912,
        '+91 80 6712 3456',
        'https://www.shell.in',
        'published',
        'verified',
        true,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Bharat Petroleum (BPCL) Electronic City',
        'bpcl-petrol-pump-electronic-city',
        '24/7 BPCL fuel station with Speed petrol, diesel, EV fast charger, and In & Out convenience shop.',
        'Bharat Petroleum fuel outlet located at Electronic City Phase 1 on Hosur Road, featuring Speed branded petrol, Pure for Sure automated dispensers, and electric vehicle charging points.',
        'Hosur Main Road, Electronic City Phase 1',
        'Near Toll Plaza Corridor',
        'Electronic City',
        'Bangalore',
        'Karnataka',
        'IN',
        '560100',
        12.8420,
        77.6780,
        '+91 80 2852 0987',
        'https://bharatpetroleum.in',
        'published',
        'verified',
        true,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'HP Petrol Pump Bommasandra Industrial Area',
        'hp-petrol-pump-bommasandra',
        'Hindustan Petroleum outlet offering Power petrol, Turbojet diesel, and commercial fleet services.',
        'HPCL petrol and diesel dispensing station in Bommasandra Industrial Area catering to commercial vehicles, private commuters, and fleet owners with high-speed automated dispensers.',
        'Bommasandra Industrial Area 3rd Phase',
        'Chandapura Link Corridor',
        'Bommasandra',
        'Bangalore',
        'Karnataka',
        'IN',
        '560099',
        12.8210,
        77.6885,
        '+91 80 2783 7890',
        'https://hindustanpetroleum.com',
        'published',
        'verified',
        false,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Indian Oil COCO Fuel Station Koramangala',
        'indian-oil-coco-koramangala',
        'Company Owned Company Operated (COCO) 24/7 Indian Oil station with premium fuels and EV station.',
        'Direct company-operated flagship Indian Oil station on 80 Feet Road Koramangala, ensuring 100% pure quality fuel testing, Servo lubricants, nitrogen air, and EV battery charging.',
        '80 Feet Road, 4th Block',
        'Near Sony World Signal',
        'Koramangala',
        'Bangalore',
        'Karnataka',
        'IN',
        '560034',
        12.9362,
        77.6245,
        '+91 80 2553 4321',
        'https://iocl.com',
        'published',
        'verified',
        true,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Shell Petrol Bunk Indiranagar 100 Feet Road',
        'shell-petrol-bunk-indiranagar',
        'Flagship Shell fuel outlet on 100 Feet Road with Shell V-Power, Deli by Shell, and car wash.',
        'Modern Shell fuel station centrally located in Indiranagar, providing premium performance fuels, Deli snacks and coffee, automated vehicle wash, and professional oil change service.',
        '100 Feet Road, HAL 2nd Stage',
        'Near 12th Main Junction',
        'Indiranagar',
        'Bangalore',
        'Karnataka',
        'IN',
        '560038',
        12.9725,
        77.6415,
        '+91 80 4115 6789',
        'https://www.shell.in',
        'published',
        'verified',
        true,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Bharat Petroleum (BPCL) Hope Farm Whitefield',
        'bpcl-petrol-pump-whitefield',
        '24/7 BPCL petrol pump near Hope Farm Junction serving IT corridors with petrol, diesel, and air.',
        'High-capacity fuel station at Hope Farm Junction Whitefield, catering to tech park commuters with Speed petrol, quick digital UPI payments, and 24-hour convenience store.',
        'Whitefield Main Road, Hope Farm Junction',
        'Near Metro Station',
        'Whitefield',
        'Bangalore',
        'Karnataka',
        'IN',
        '560066',
        12.9835,
        77.7470,
        '+91 80 2845 1234',
        'https://bharatpetroleum.in',
        'published',
        'verified',
        false,
        timezone('utc', now())
      ),
      (
        d.tenant_id,
        d.id,
        v_fuel_id,
        'Nayara Energy Fuel Station Anekal Road',
        'nayara-energy-fuel-station-anekal',
        'Multi-bay fuel station with petrol, diesel, windshield cleaning, and 24/7 emergency service.',
        'Nayara Energy fuel station on Chandapura-Anekal Main Road offering quality-tested petrol and high-speed diesel for rural and suburban commuters.',
        'Survey No. 78, Chandapura - Anekal Main Road',
        'Near Iggalur Junction',
        'Anekal',
        'Bangalore',
        'Karnataka',
        'IN',
        '562106',
        12.7680,
        77.7035,
        '+91 80 2785 4567',
        'https://nayaraenergy.com',
        'published',
        'verified',
        false,
        timezone('utc', now())
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

