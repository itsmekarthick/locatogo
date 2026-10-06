-- Migration: Fix company_jobs RLS policies to isolate mutation operations and protect anonymous public SELECT
drop policy if exists "Tenant staff can manage company jobs" on public.company_jobs;

create policy "Tenant staff can insert company jobs"
  on public.company_jobs for insert
  with check (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = company_jobs.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );

create policy "Tenant staff can update company jobs"
  on public.company_jobs for update
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = company_jobs.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );

create policy "Tenant staff can delete company jobs"
  on public.company_jobs for delete
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = company_jobs.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );
