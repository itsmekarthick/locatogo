alter table public.tenants
  add column owner_user_id uuid references public.profiles(id) on delete restrict;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy tenants_authenticated_create on public.tenants
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy tenants_owner_update on public.tenants
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy tenant_users_owner_create on public.tenant_users
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'tenant_owner'
    and exists (
      select 1 from public.tenants
      where id = tenant_id and owner_user_id = auth.uid()
    )
  );

create policy domains_manager_create on public.domains
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));

create policy domains_owner_update on public.domains
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));

create policy domains_owner_delete on public.domains
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['tenant_owner']::public.tenant_role[]));

create policy directory_settings_owner_create on public.directory_settings
  for insert to authenticated
  with check (exists (select 1 from public.domains d where d.id = domain_id and public.has_tenant_role(d.tenant_id, array['tenant_owner']::public.tenant_role[])));

create policy directory_settings_owner_update on public.directory_settings
  for update to authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and public.has_tenant_role(d.tenant_id, array['tenant_owner']::public.tenant_role[])))
  with check (exists (select 1 from public.domains d where d.id = domain_id and public.has_tenant_role(d.tenant_id, array['tenant_owner']::public.tenant_role[])));

grant select, insert, update, delete on public.domains, public.directory_settings, public.categories, public.listings to authenticated;
grant select on public.tenants, public.tenant_users, public.profiles to authenticated;
