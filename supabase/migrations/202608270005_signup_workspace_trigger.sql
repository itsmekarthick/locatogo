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
  end if;

  return new;
end;
$$;
