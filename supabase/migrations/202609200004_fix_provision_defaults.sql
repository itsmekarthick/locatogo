-- Fix provision_tenant_defaults which was broken by the taxonomy migration changing unique constraints.
-- The previous ON CONFLICT (domain_id, slug) caused a crash because that constraint was dropped.

create or replace function public.provision_tenant_defaults(p_tenant_id uuid, p_tenant_name text, p_tenant_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain_id uuid;
begin
  -- 1. Create or get default published domain
  insert into public.domains (tenant_id, name, slug, description, status)
  values (
    p_tenant_id,
    p_tenant_name,
    p_tenant_slug,
    'Official directory for ' || p_tenant_name,
    'published'
  )
  on conflict (tenant_id, slug) do update set status = 'published'
  returning id into v_domain_id;

  if v_domain_id is null then
    select id into v_domain_id from public.domains where tenant_id = p_tenant_id and slug = p_tenant_slug limit 1;
  end if;

  -- 2. Ensure directory settings exist
  insert into public.directory_settings (domain_id)
  values (v_domain_id)
  on conflict (domain_id) do nothing;

  -- 3. Seed starter categories
  -- We use ON CONFLICT DO NOTHING without specifying a target to safely ignore duplicates,
  -- regardless of whether domain_id is null or not (since unique constraints changed).
  insert into public.categories (tenant_id, domain_id, name, slug, description, sort_order, is_active)
  values
    (p_tenant_id, v_domain_id, 'Schools & Education', 'schools-education', 'K-12 schools, CBSE/ICSE academies, preschools, and learning institutes', 1, true),
    (p_tenant_id, v_domain_id, 'Restaurants & Cafes', 'restaurants-cafes', 'Food, dining, coffee shops, and bakeries', 2, true),
    (p_tenant_id, v_domain_id, 'Creative & Arts', 'creative-arts', 'Studios, art galleries, design agencies, and makers', 3, true),
    (p_tenant_id, v_domain_id, 'Independent Retail', 'independent-retail', 'Boutiques, local goods, books, and specialty stores', 4, true),
    (p_tenant_id, v_domain_id, 'Tech & Coworking', 'tech-coworking', 'Technology hubs, startups, and shared workspaces', 5, true),
    (p_tenant_id, v_domain_id, 'Health & Wellness', 'health-wellness', 'Fitness studios, yoga, clinics, and personal care', 6, true),
    (p_tenant_id, v_domain_id, 'Professional Services', 'professional-services', 'Consulting, legal, marketing, and financial advisors', 7, true),
    (p_tenant_id, v_domain_id, 'Community & Non-Profit', 'community-nonprofit', 'Civic groups, cultural foundations, and charities', 8, true)
  on conflict do nothing;

  return v_domain_id;
end;
$$;
