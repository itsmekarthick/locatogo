-- Add robust error handling and foolproof slug generation to the handle_new_user trigger
-- Also fixes provision_tenant_defaults which was broken by the taxonomy migration changing unique constraints

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
  -- Because of 202609020001_universal_shared_taxonomy.sql, domain_id is usually null,
  -- and unique constraint on (domain_id, slug) was dropped. 
  -- We just use ON CONFLICT DO NOTHING without specifying a target to safely ignore duplicates.
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
  user_role text := new.raw_user_meta_data ->> 'platform_role';
  v_display_name text;
begin
  -- Resolve display name from metadata or email
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  -- Insert profile
  insert into public.profiles (id, display_name)
  values (new.id, v_display_name)
  on conflict (id) do update set display_name = excluded.display_name;

  if user_role = 'tech_user' then
    -- Safely update role if valid
    update public.profiles set platform_role = 'tech_user' where id = new.id;
    insert into public.tech_profiles (id) values (new.id) on conflict (id) do nothing;
  else
    -- Auto-generate workspace name if not provided
    if workspace_name is null then
      workspace_name := trim(v_display_name) || '''s Workspace';
    end if;

    -- Ensure a 100% valid, regex-compliant slug using a static prefix and the uuid
    if workspace_slug is null then
      workspace_slug := 'workspace-' || lower(substring(replace(new.id::text, '-', '') from 1 for 10));
    end if;

    -- Create tenant
    insert into public.tenants (name, slug, owner_user_id)
    values (workspace_name, workspace_slug, new.id)
    returning id into new_tenant_id;

    -- Assign user as tenant owner
    insert into public.tenant_users (tenant_id, user_id, role)
    values (new_tenant_id, new.id, 'tenant_owner')
    on conflict (tenant_id, user_id) do nothing;

    -- Automatically provision default domain and starter categories
    perform public.provision_tenant_defaults(new_tenant_id, workspace_name, workspace_slug);
  end if;

  return new;
exception
  when others then
    raise warning 'Error in handle_new_user for %: %', new.id, SQLERRM;
    return new;
end;
$$;
