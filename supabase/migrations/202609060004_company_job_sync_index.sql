-- Make provider job sync idempotent per listing.
create unique index if not exists company_jobs_listing_ats_job_unique
  on public.company_jobs (listing_id, ats_job_id)
  where ats_job_id is not null;

alter table public.company_jobs
  add column if not exists last_synced_at timestamptz;
