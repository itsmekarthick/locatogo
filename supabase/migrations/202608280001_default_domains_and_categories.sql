-- Helper function to provision default domain and standard starter categories for a tenant
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
  on conflict (domain_id, slug) do nothing;

  return v_domain_id;
end;
$$;

-- Update handle_new_user trigger to provision defaults on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  workspace_name text := nullif(trim(new.raw_user_meta_data ->> 'tenant_name'), '');
  workspace_slug text := nullif(trim(new.raw_user_meta_data ->> 'tenant_slug'), '');
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;

  if workspace_name is not null and workspace_slug is not null then
    insert into public.tenants (name, slug, owner_user_id)
    values (workspace_name, workspace_slug, new.id)
    returning id into new_tenant_id;

    insert into public.tenant_users (tenant_id, user_id, role)
    values (new_tenant_id, new.id, 'tenant_owner');

    -- Automatically provision default domain and taxonomy
    perform public.provision_tenant_defaults(new_tenant_id, workspace_name, workspace_slug);
  end if;

  return new;
end;
$$;

-- Backfill defaults for any existing tenants in the database
do $$
declare
  t record;
begin
  for t in select id, name, slug from public.tenants loop
    perform public.provision_tenant_defaults(t.id, t.name, t.slug);
  end loop;
end;
$$;

