-- Migration: Blogs and Editorial City Guides Engine
-- Description: Adds blogs table with tenant RLS isolation and initial curated guides

create table if not exists public.blogs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    domain_id uuid references public.domains(id) on delete set null,
    title text not null,
    slug text not null,
    excerpt text,
    content text not null,
    cover_image_url text,
    author_name text not null default 'Locatogo Editorial',
    author_avatar_url text,
    category text not null default 'City Guide',
    tags text[] not null default '{}',
    reading_time_minutes integer not null default 4,
    published_at timestamptz not null default timezone('utc'::text, now()),
    status text not null default 'published' check (status in ('draft', 'published', 'archived')),
    is_featured boolean not null default false,
    view_count integer not null default 0,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    constraint uq_blogs_tenant_slug unique (tenant_id, slug)
);

-- Indexes for lightning-fast public discovery & filtering
create index if not exists idx_blogs_tenant_status on public.blogs(tenant_id, status);
create index if not exists idx_blogs_published_at on public.blogs(published_at desc);
create index if not exists idx_blogs_slug on public.blogs(slug);
create index if not exists idx_blogs_category on public.blogs(category);
create index if not exists idx_blogs_is_featured on public.blogs(is_featured);

-- Enable RLS
alter table public.blogs enable row level security;

-- 1. Public Read Policy: Anyone (anon + authenticated) can read published blogs
drop policy if exists blogs_public_read on public.blogs;
create policy blogs_public_read
    on public.blogs
    for select
    using (
        status = 'published'
        or public.is_tenant_member(tenant_id)
    );

-- 2. Tenant Admin Management Policies: Insert, Update, Delete
drop policy if exists blogs_admin_insert on public.blogs;
create policy blogs_admin_insert
    on public.blogs
    for insert
    to authenticated
    with check (
        public.is_tenant_member(tenant_id)
    );

drop policy if exists blogs_admin_update on public.blogs;
create policy blogs_admin_update
    on public.blogs
    for update
    to authenticated
    using (
        public.is_tenant_member(tenant_id)
    )
    with check (
        public.is_tenant_member(tenant_id)
    );

drop policy if exists blogs_admin_delete on public.blogs;
create policy blogs_admin_delete
    on public.blogs
    for delete
    to authenticated
    using (
        public.is_tenant_member(tenant_id)
    );

-- Grant select to anon and authenticated users
grant select on public.blogs to anon, authenticated;

-- Seed 5 rich, realistic editorial guides for the primary tenant
do $$
declare
    v_tenant_id uuid;
    v_domain_id uuid;
begin
    select id into v_tenant_id from public.tenants order by created_at limit 1;
    select id into v_domain_id from public.domains where tenant_id = v_tenant_id order by created_at limit 1;

    if v_tenant_id is not null then
        -- Article 1: Featured Coworking Hubs
        insert into public.blogs (
            tenant_id, domain_id, title, slug, excerpt, content,
            cover_image_url, author_name, author_avatar_url,
            category, tags, reading_time_minutes, is_featured, status
        ) values (
            v_tenant_id, v_domain_id,
            'Top 10 High-Growth Coworking Spaces in Bengaluru for 2026',
            'top-coworking-spaces-bengaluru-2026',
            'From leafy Indiranagar bungalows converted into creative studios to sleek 14-story enterprise towers in Bellandur, explore Bengaluru’s most vibrant work environments.',
            '## The Evolution of India’s Workspace Capital

Bengaluru has always been the heartbeat of Indian technology and startup culture. In 2026, the traditional office is no longer the default — flexible workspaces, hybrid hubs, and design-led creative sanctuaries have taken center stage. Whether you are an early-stage founder building an AI agent or a distributed enterprise engineering team, finding the right neighborhood and desk is critical.

### 1. Indiranagar: The Creative & Founder Epicenter
Indiranagar remains the most coveted neighborhood for founders. Tree-lined avenues meet 100-foot road, offering quick walks between pitch meetings, artisanal bakeries, and state-of-the-art coworking spaces.
- **Vibe**: High-energy, product-first, weekend networking.
- **Top Picks**: WeWork Galaxy on Residency Road, boutique lofts near 12th Main.
- **Transit**: Direct Purple Line metro connectivity via Indiranagar Station.

### 2. Koramangala: The Original Startup Crucible
Historically where Flipkart, Swiggy, and Ola wrote their first lines of code, Koramangala continues to thrive with incubators and developer cafes.
- **Vibe**: Dense network of venture funds, seed investors, and late-night hackathons.
- **Top Picks**: IndiQube Spaces and specialized developer hubs.

### 3. Outer Ring Road (ORR) & Bellandur: Enterprise Scale
For engineering teams that need 200+ dedicated desks, Tier-1 security, and redundant fiber links, the Outer Ring Road corridor provides campus-grade infrastructure.
- **Vibe**: Scaled enterprise tech, multinational tech centers, multi-cuisine food courts.

### What to Look for in 2026
1. **EV Charging & Micro-Mobility**: Look for spaces with dedicated charging docks for Ather, Ola, and Revolt bikes.
2. **Acoustic Phone Booths**: Essential for remote international standups across PST and GMT time zones.
3. **Ergonomic Furnishings**: Certified Herman Miller or Steelcase seating makes 12-hour sprint days comfortable.

*Explore all these coworking locations with live navigation and Uber links on our interactive map.*',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
            'Karthick Raman',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            'Tech & Workspaces',
            array['Coworking', 'Bengaluru', 'Startups', 'Tech Parks'],
            5, true, 'published'
        ) on conflict (tenant_id, slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            content = excluded.content,
            cover_image_url = excluded.cover_image_url,
            is_featured = true;

        -- Article 2: Third-Wave Specialty Coffee
        insert into public.blogs (
            tenant_id, domain_id, title, slug, excerpt, content,
            cover_image_url, author_name, author_avatar_url,
            category, tags, reading_time_minutes, is_featured, status
        ) values (
            v_tenant_id, v_domain_id,
            'A Local’s Guide to Specialty Coffee & Third-Wave Roasters in Bangalore',
            'specialty-coffee-guide-bangalore',
            'South Indian filter coffee will always hold our heart, but Bengaluru’s artisanal pour-over and manual brew revolution is in full swing.',
            '## From Traditional Filter Kaapi to Geisha Pour-Overs

Bangalore runs on caffeine. The dawn clatter of stainless steel dabaras in Malleshwaram has now joined forces with V60 drippers, Aeropress championships, and single-origin beans sourced directly from the misty slopes of Chikmagalur and Coorg.

### The Pioneers: Third Wave Coffee & Blue Tokai
What started as intimate tasting rooms has grown into neighborhood community living rooms.
- **What to Order**: Iced Sea Salt Mocha or a light-roast washed pour-over.
- **Where**: 12th Main Indiranagar, 4th Block Koramangala, and Lavelle Road.

### Hidden Gems for Serious Coffee Nerds
1. **Araku Coffee (Indiranagar)**: A stunning two-story temple to tribal biodynamic coffee from the Araku Valley. Experience sensory pairing menus curated by certified Q-graders.
2. **Subko Coffee**: Incredible craft sourdough and experimental fermented bean varietals.
3. **Maverick & Farmer (Ulsoor)**: Lakeside seating with cold brew creations and orange-infused espressos.

### How to Brew Like a Pro at Home
- **Water Temperature**: 92°C to 94°C brings out floral and citrus notes without extracting harsh bitterness.
- **Freshness**: Use beans roasted within 3 to 21 days for maximum aroma and crema.

*Visit our directory to discover cafe coordinates, outdoor seating availability, and pet-friendly policies across town.*',
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
            'Priya Natarajan',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
            'Food & Culture',
            array['Coffee', 'Food & Drink', 'Indiranagar', 'Cafes'],
            4, false, 'published'
        ) on conflict (tenant_id, slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            content = excluded.content;

        -- Article 3: Tech Corridors & Global Capability Centers
        insert into public.blogs (
            tenant_id, domain_id, title, slug, excerpt, content,
            cover_image_url, author_name, author_avatar_url,
            category, tags, reading_time_minutes, is_featured, status
        ) values (
            v_tenant_id, v_domain_id,
            'Bengaluru’s Emerging Tech Corridors: Outer Ring Road to Aerospace Park',
            'bengaluru-emerging-tech-corridors-2026',
            'How infrastructure megaprojects, metro expansions, and Global Capability Centers (GCCs) are reshaping where engineers live and build.',
            '## The Shifting Geography of India’s Silicon Valley

For over two decades, the tech ecosystem was anchored around Electronic City Phase 1 and Whitefield. Today, a multi-hub metropolis is emerging, fueled by the Blue Line Airport Metro corridor, the Peripheral Ring Road, and multi-billion-dollar R&D investments.

### 1. The North Bangalore Boom: Devanahalli & KIADB Aerospace Park
Proximity to Kempegowda International Airport and planned high-speed rail has made North Bengaluru the premier destination for aerospace, semiconductors, and deep-tech hardware labs.
- **Key Campuses**: Boeing India Engineering & Technology Center, Foxconn, Shell Technology Centre.

### 2. The Unstoppable Outer Ring Road (ORR)
Housing over 1 million tech workers, the stretch from Marathahalli to Silk Board remains the world’s dense concentration of Fortune 500 engineering centers.
- **Metro Impact**: The upcoming Silk Board-KR Puram line is set to slash commute times by 65%.

### 3. Sarjapur Road & Carmelaram: The AI Startup Belt
Younger teams and seed-stage AI startups are gravitating towards Sarjapur Road for modern gated communities and green suburban micro-campuses.

*Check our Tech Atlas for active job openings, office campus locations, and neighborhood amenities.*',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
            'Aditya Sharma',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            'Tech & Startups',
            array['Tech Atlas', 'Infrastructure', 'GCC', 'Engineering'],
            6, false, 'published'
        ) on conflict (tenant_id, slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            content = excluded.content;

        -- Article 4: South Bangalore Healthcare & Wellness
        insert into public.blogs (
            tenant_id, domain_id, title, slug, excerpt, content,
            cover_image_url, author_name, author_avatar_url,
            category, tags, reading_time_minutes, is_featured, status
        ) values (
            v_tenant_id, v_domain_id,
            'Navigating Healthcare in South Bangalore: Top Hospitals & Emergency Centers',
            'south-bangalore-healthcare-guide',
            'A comprehensive guide to multi-specialty hospitals, emergency cardiac care, and 24/7 pharmacies across Chandapura, Electronic City, and Bannerghatta.',
            '## World-Class Medical Care in Your Neighborhood

When a health emergency occurs, knowing the exact distance, ICU availability, and trauma response capabilities of nearby hospitals can save critical minutes. South Bengaluru is home to some of India’s most renowned healthcare institutions.

### 1. Narayana Health City (Bommasandra / Chandapura)
Founded by renowned cardiac surgeon Dr. Devi Shetty, Health City is one of the largest medical clusters in Asia.
- **Specialties**: Pediatric and adult cardiac surgery, bone marrow transplant, neuroscience, and oncology (Mazumdar Shaw Cancer Centre).
- **Emergency**: 24x7 trauma care with dedicated emergency hotline.

### 2. Fortis & Apollo Hospitals (Bannerghatta Road)
A multi-specialty hub renowned for robotic knee replacements, laparoscopic surgery, and comprehensive maternal health.

### 3. Community Clinics & 24/7 Pharmacies in Chandapura
- **Athreya Hospital**: Quick multi-specialty outpatient consultations on Chandapura Anekal Road.
- **Sri Swaranaamrutha Hospital**: Trusted local emergency and family medical center.

*Locatogo provides 1-tap phone numbers, verified addresses, and real-time navigation routes to all medical centers.*',
            'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
            'Dr. Sneha Hegde',
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
            'Healthcare',
            array['Hospitals', 'Emergency', 'Chandapura', 'Healthcare'],
            4, false, 'published'
        ) on conflict (tenant_id, slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            content = excluded.content;

        -- Article 5: Green Parks & Sustainable Living
        insert into public.blogs (
            tenant_id, domain_id, title, slug, excerpt, content,
            cover_image_url, author_name, author_avatar_url,
            category, tags, reading_time_minutes, is_featured, status
        ) values (
            v_tenant_id, v_domain_id,
            'The Green City Guide: Bangalore’s Best Parks, Lake Walks & EV Charging Stations',
            'bangalore-parks-lake-walks-ev-guide',
            'Discover the Garden City’s most rejuvenating lungs — from historic botanical walks in Lalbagh to serene morning birdwatching around Agara Lake.',
            '## Rediscovering the "Garden City"

Amid rapid urban expansion, Bengaluru’s lush canopies, ancient banyan trees, and restored urban lakes remain its crowning glory. Whether you want a sunrise run or need to top up your electric vehicle while walking your dog, here are the top green routes.

### 1. Cubbon Park & Lalbagh Botanical Garden
- **Cubbon Park**: 300 acres of tranquil bamboo groves in the heart of the city. Sundays are vehicle-free, making it paradise for dog owners and rollerbladers.
- **Lalbagh**: Home to the historic glass house modeled after London’s Crystal Palace and trees dating back over two centuries.

### 2. The Restored Lake Circuits
- **Agara Lake (HSR Layout)**: 2.5km paved walking trail with outdoor fitness stations and sunset viewpoints.
- **Sankey Tank (Malleshwaram)**: Peaceful waterside perimeter with boating and botanical gardens.

### 3. EV-Friendly Green Outings
Most major lake parks now feature Bescom and private fast-charging stations within 500 meters, allowing you to charge your EV while enjoying a 45-minute stroll.

*Use our interactive map with the "Near Metro" and "EV Charging" amenity filters to plan your weekend green escape.*',
            'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
            'Karthick Raman',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            'City Guide',
            array['Parks', 'Lakes', 'Green Living', 'Bangalore'],
            3, false, 'published'
        ) on conflict (tenant_id, slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            content = excluded.content;

    end if;
end $$;
