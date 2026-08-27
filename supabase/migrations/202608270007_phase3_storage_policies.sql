insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', false)
on conflict (id) do nothing;

create policy listing_media_objects_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'listing-media'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy listing_media_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-media'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['tenant_owner', 'tenant_staff']::public.tenant_role[])
  );

create policy listing_media_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-media'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['tenant_owner', 'tenant_staff']::public.tenant_role[])
  );
