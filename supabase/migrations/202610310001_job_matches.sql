-- Structured profile fields read from the resume, and per-user ranked job matches.

alter table public.tech_profiles
  add column if not exists headline text check (headline is null or char_length(headline) <= 200),
  add column if not exists experience_level text check (experience_level is null or experience_level in ('intern', 'entry', 'mid', 'senior', 'lead', 'executive')),
  add column if not exists years_experience numeric(4, 1) check (years_experience is null or (years_experience >= 0 and years_experience <= 60)),
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists work_history jsonb not null default '[]'::jsonb,
  add column if not exists resume_parsed_at timestamptz;

-- One row per (user, job). Scores come from the matching engine, never from the client.
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.company_jobs(id) on delete cascade,
  rank smallint not null check (rank > 0),
  score smallint not null check (score between 0 and 100),
  skills_score smallint not null default 0 check (skills_score between 0 and 100),
  role_score smallint not null default 0 check (role_score between 0 and 100),
  level_score smallint not null default 0 check (level_score between 0 and 100),
  location_score smallint not null default 0 check (location_score between 0 and 100),
  matched_skills text[] not null default '{}',
  fit_notes text[] not null default '{}',
  gap_notes text[] not null default '{}',
  notes_source text not null default 'rules' check (notes_source in ('rules', 'ai')),
  computed_at timestamptz not null default timezone('utc', now()),
  unique (user_id, job_id)
);

create index if not exists job_matches_user_rank_idx on public.job_matches (user_id, rank);
create index if not exists job_matches_job_idx on public.job_matches (job_id);

-- The latest run per user: what was read, and which profile it was computed from.
create table if not exists public.match_runs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profile_hash text not null,
  scope text not null,
  roles_in_scope integer not null default 0 check (roles_in_scope >= 0),
  roles_read integer not null default 0 check (roles_read >= 0),
  shortlisted integer not null default 0 check (shortlisted >= 0),
  ranked integer not null default 0 check (ranked >= 0),
  notes_source text not null default 'rules' check (notes_source in ('rules', 'ai')),
  completed_at timestamptz not null default timezone('utc', now())
);

alter table public.job_matches enable row level security;
alter table public.match_runs enable row level security;

drop policy if exists job_matches_self_read on public.job_matches;
create policy job_matches_self_read on public.job_matches
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists job_matches_self_insert on public.job_matches;
create policy job_matches_self_insert on public.job_matches
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists job_matches_self_update on public.job_matches;
create policy job_matches_self_update on public.job_matches
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists job_matches_self_delete on public.job_matches;
create policy job_matches_self_delete on public.job_matches
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists match_runs_self_read on public.match_runs;
create policy match_runs_self_read on public.match_runs
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists match_runs_self_insert on public.match_runs;
create policy match_runs_self_insert on public.match_runs
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists match_runs_self_update on public.match_runs;
create policy match_runs_self_update on public.match_runs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists match_runs_self_delete on public.match_runs;
create policy match_runs_self_delete on public.match_runs
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.job_matches, public.match_runs from anon;
grant select, insert, update, delete on public.job_matches, public.match_runs to authenticated;
