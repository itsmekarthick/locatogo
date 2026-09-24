-- Crawler records without a job-specific URL previously used the source page
-- as apply_url. Deactivate only those root/careers links; valid ATS jobs remain active.
update public.company_jobs as jobs
set is_active = false
from public.listings as listings
where jobs.listing_id = listings.id
  and jobs.ats_job_id like 'crawl:%'
  and jobs.apply_url is not null
  and regexp_replace(lower(trim(jobs.apply_url)), '/+$', '') in (
    regexp_replace(lower(trim(listings.website)), '/+$', ''),
    regexp_replace(lower(trim(listings.careers_url)), '/+$', '')
  );

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
    and jobs.ats_job_id like 'crawl:%'
);