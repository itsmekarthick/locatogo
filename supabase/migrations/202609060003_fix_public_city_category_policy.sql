-- Public city directories need to read their tenant's shared categories.
-- The previous policy only exposed the India Atlas tenant, hiding metro filters.
drop policy if exists categories_atlas_public_read on public.categories;

create policy categories_atlas_public_read
  on public.categories
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.domains d
      where d.tenant_id = categories.tenant_id
        and d.status = 'published'
    )
  );

grant select on public.categories to anon;
