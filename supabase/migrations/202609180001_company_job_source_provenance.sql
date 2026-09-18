-- Preserve source URLs and the job details captured during external harvesting.
alter table public.company_profiles
  add column if not exists source_urls text[] not null default '{}';

alter table public.company_jobs
  add column if not exists source_url text,
  add column if not exists company_url text,
  add column if not exists source_search_url text,
  add column if not exists description text,
  add column if not exists employment_type text,
  add column if not exists source_fetched_at timestamptz;

create index if not exists idx_company_jobs_source_url
  on public.company_jobs(source_url)
  where source_url is not null;