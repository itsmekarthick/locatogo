-- Mock job rows are not real openings and must never appear in public listings.
update public.company_jobs
set is_active = false
where is_active = true
  and (apply_url = '#' or ats_job_id like 'mock:%');

update public.listings as listings
set active_jobs_count = (
      select count(*)::integer
      from public.company_jobs as jobs
      where jobs.listing_id = listings.id
        and jobs.is_active = true
    ),
    updated_at = timezone('utc', now())
where exists (
  select 1
  from public.company_jobs as jobs
  where jobs.listing_id = listings.id
    and jobs.ats_job_id like 'mock:%'
);