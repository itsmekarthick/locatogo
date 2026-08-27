alter table public.domains add constraint domains_id_tenant_unique unique (id, tenant_id);
alter table public.categories add constraint categories_id_domain_tenant_unique unique (id, domain_id, tenant_id);
alter table public.listings add constraint listings_id_tenant_unique unique (id, tenant_id);

alter table public.categories drop constraint if exists categories_parent_category_id_fkey;
alter table public.categories add constraint categories_parent_same_tenant_domain_fkey
  foreign key (parent_category_id, domain_id, tenant_id)
  references public.categories(id, domain_id, tenant_id)
  on delete restrict;

alter table public.categories add constraint categories_domain_same_tenant_fkey
  foreign key (domain_id, tenant_id)
  references public.domains(id, tenant_id)
  on delete cascade;

alter table public.listings drop constraint if exists listings_category_id_fkey;
alter table public.listings add constraint listings_category_same_tenant_domain_fkey
  foreign key (category_id, domain_id, tenant_id)
  references public.categories(id, domain_id, tenant_id)
  on delete restrict;

alter table public.listings add constraint listings_domain_same_tenant_fkey
  foreign key (domain_id, tenant_id)
  references public.domains(id, tenant_id)
  on delete cascade;
