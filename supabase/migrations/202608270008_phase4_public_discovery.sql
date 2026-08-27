create policy published_domains_public_read on public.domains
  for select to anon, authenticated
  using (status = 'published');

create policy published_categories_public_read on public.categories
  for select to anon, authenticated
  using (is_active = true and exists (select 1 from public.domains d where d.id = domain_id and d.status = 'published'));

create policy published_settings_public_read on public.directory_settings
  for select to anon, authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and d.status = 'published'));
