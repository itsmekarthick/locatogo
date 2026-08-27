grant select on public.domains, public.categories, public.directory_settings to anon;

create policy published_custom_fields_public_read on public.custom_fields
  for select to anon, authenticated
  using (is_public = true and exists (select 1 from public.domains d where d.id = domain_id and d.status = 'published'));

grant select on public.custom_fields to anon;
