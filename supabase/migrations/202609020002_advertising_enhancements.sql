-- Migration: 202609020002_advertising_enhancements.sql
-- Add display attributes and tracking support to ad_slots and ad_events

-- 1. Add display content columns to ad_slots if not present
alter table public.ad_slots
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists cta_text text default 'Learn More',
  add column if not exists badge_text text default 'Sponsored';

-- 2. Update RLS policy on ad_slots so anyone can read active ads within valid date window
drop policy if exists ads_member_read on public.ad_slots;

create policy ads_member_read
  on public.ad_slots for select
  using (
    public.is_tenant_member(tenant_id)
    or (
      status = 'active'
      and start_date <= timezone('utc', now())
      and end_date >= timezone('utc', now())
    )
  );

-- 3. Update ad_events RLS and permissions so anon and authenticated users can log impressions/clicks
alter table public.ad_events enable row level security;

drop policy if exists ad_events_public_insert on public.ad_events;
create policy ad_events_public_insert
  on public.ad_events for insert
  with check (true);

drop policy if exists ad_events_member_read on public.ad_events;
create policy ad_events_member_read
  on public.ad_events for select
  using (public.is_tenant_member(tenant_id));

grant select on public.ad_slots to anon, authenticated;
grant insert on public.ad_events to anon, authenticated;
grant select on public.ad_events to authenticated;

-- 4. Seed sample partner advertisements if none exist for active tenants
do $$
declare
  t_id uuid;
  d_id uuid;
  first_listing_id uuid;
begin
  select id into t_id from public.tenants limit 1;
  if t_id is not null then
    select id into d_id from public.domains where tenant_id = t_id limit 1;
    select id into first_listing_id from public.listings where tenant_id = t_id and status = 'published' limit 1;

    if d_id is not null and not exists (select 1 from public.ad_slots where tenant_id = t_id) then
      -- Sample 1: Flash announcement banner
      insert into public.ad_slots (
        tenant_id,
        domain_id,
        slot_type,
        sponsor_name,
        title,
        description,
        cta_text,
        badge_text,
        target_url,
        banner_url,
        start_date,
        end_date,
        status,
        price_paid
      ) values (
        t_id,
        d_id,
        'flash_banner',
        'WeWork Bengaluru',
        'Looking for premium workspace in Bangalore? Get 25% off private suites this quarter.',
        'Experience enterprise coworking across Indiranagar, Koramangala & Whitefield.',
        'Claim Offer',
        'Partner Spotlight',
        'https://wework.co.in',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        timezone('utc', now()) - interval '1 day',
        timezone('utc', now()) + interval '30 days',
        'active',
        499.00
      );

      -- Sample 2: In-feed / Header banner placement
      insert into public.ad_slots (
        tenant_id,
        domain_id,
        listing_id,
        slot_type,
        sponsor_name,
        title,
        description,
        cta_text,
        badge_text,
        target_url,
        banner_url,
        start_date,
        end_date,
        status,
        price_paid
      ) values (
        t_id,
        d_id,
        first_listing_id,
        'header_banner',
        'AWS for Startups',
        'Accelerate Your Scale with $100,000 in AWS Cloud Credits & Technical Mentorship',
        'Join thousands of high-growth tech startups building on modern cloud infrastructure.',
        'Apply for Credits',
        'Tech Sponsor',
        'https://aws.amazon.com/startups',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        timezone('utc', now()) - interval '1 day',
        timezone('utc', now()) + interval '45 days',
        'active',
        999.00
      );
    end if;
  end if;
end $$;
