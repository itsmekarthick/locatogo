-- Public category reads must not query public.tenants directly: anon users
-- intentionally have no permission on that table.
drop policy if exists categories_atlas_public_read on public.categories;

create policy categories_atlas_public_read on public.categories
  for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.domains d
      where d.tenant_id = categories.tenant_id
        and d.slug = 'india-atlas'
        and d.status = 'published'
    )
  );

grant select on public.categories to anon;