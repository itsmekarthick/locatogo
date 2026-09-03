-- Enhance handle_new_user to automatically provision a default workspace even if
-- tenant_name or tenant_slug are not manually supplied by the user on registration.
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
  v_display_name text;
  v_base_slug text;
begin
  -- Resolve display name from metadata or email
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name)
  on conflict (id) do update set display_name = excluded.display_name;

  -- Auto-generate workspace name if not provided
  if workspace_name is null then
    workspace_name := v_display_name || '''s Workspace';
  end if;

  -- Auto-generate clean unique workspace slug if not provided
  if workspace_slug is null then
    v_base_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
    if v_base_slug is null or length(v_base_slug) = 0 then
      v_base_slug := 'workspace';
    end if;
    workspace_slug := v_base_slug || '-' || substring(replace(new.id::text, '-', '') from 1 for 6);
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

  return new;
end;
$$;
