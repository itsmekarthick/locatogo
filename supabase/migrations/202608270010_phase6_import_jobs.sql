create type public.import_job_status as enum ('queued', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled');

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_id uuid not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  file_path text,
  status public.import_job_status not null default 'queued',
  total_rows integer not null default 0 check (total_rows >= 0),
  processed_rows integer not null default 0 check (processed_rows >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  errors_json jsonb not null default '[]'::jsonb,
  error_file_path text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (domain_id, tenant_id) references public.domains(id, tenant_id) on delete cascade
);

create index import_jobs_tenant_created_idx on public.import_jobs(tenant_id, created_at desc);
alter table public.import_jobs enable row level security;
create policy import_jobs_member_read on public.import_jobs for select using (public.is_tenant_member(tenant_id));
create policy import_jobs_manager_write on public.import_jobs for all using (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['tenant_owner', 'tenant_staff']::public.tenant_role[]));
revoke all on public.import_jobs from anon;
grant select, insert, update on public.import_jobs to authenticated;
