begin;

select plan(9);

insert into public.profiles (id, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'Tenant A'),
  ('00000000-0000-0000-0000-000000000002', 'Tenant B');
insert into public.tenants (id, owner_user_id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Tenant A', 'tenant-a'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Tenant B', 'tenant-b');
insert into public.tenant_users (tenant_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'tenant_owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'tenant_owner');
insert into public.domains (id, tenant_id, name, slug) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A directory', 'a-directory'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'B directory', 'b-directory');
insert into public.categories (id, tenant_id, domain_id, name, slug) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'A category', 'a-category'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'B category', 'b-category');
insert into public.listings (id, tenant_id, domain_id, category_id, title, slug, address_line_1, status) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'A listing', 'a-listing', 'A street', 'draft'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'B listing', 'b-listing', 'B street', 'draft');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'tenants', 'tenants table exists');
select has_table('public', 'tenant_users', 'tenant membership table exists');
select has_table('public', 'domains', 'domains table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'listings', 'listings table exists');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.listings), 1, 'tenant A reads only tenant A listings');
update public.listings set title = 'tampered' where id = '40000000-0000-0000-0000-000000000002';
select is((select count(*)::integer from public.listings where title = 'tampered'), 0, 'tenant A cannot update tenant B listing');
delete from public.listings where id = '40000000-0000-0000-0000-000000000002';
select is((select count(*)::integer from public.listings where id = '40000000-0000-0000-0000-000000000002'), 1, 'tenant A cannot delete tenant B listing');

select * from finish();
rollback;
