-- Role category, inferred level and fresher flag for company jobs, plus faceted counts for the explorer filters.
-- Stored experience levels default to mid, so level is read from the title first. The trigger keeps new and updated jobs classified.

create or replace function public.classify_job_text(t text)
returns text
language sql
immutable
as $$
  select case
    when t is null or btrim(t) = '' then null
    when t ~* '\m(marketing|brand|communications?|seo|social media|public relations|demand gen(eration)?|content (marketing|strategist|writer|manager))\M' then 'marketing'
    when t ~* '\m(sales|account (executive|manager|development|director|representative|associate|coordinator)|business development|bdr|sdr|partnerships?|revenue|commercial|go[- ]to[- ]market|gtm|customer executive)\M' then 'sales'
    when t ~* '\m(customer (success|support|experience|service|care)|technical support|support (engineer|specialist|agent|analyst)|help ?desk|client success|onboarding)\M' then 'customer'
    when t ~* '\m(security|cyber\w*|infosec|appsec|penetration|pentest\w*|soc analyst|threat|vulnerability|iam)\M' then 'security'
    when t ~* '\m(designer|ux|ui/ux|user experience|product design\w*|visual design\w*|creative (director|lead)|design (lead|manager|director|systems?)|illustrator|animator)\M' then 'design'
    when t ~* '\m(product (manager|owner|management|lead|director|analyst|operations|specialist)|(director|vp|head|chief)(,| of)? (of )?product|pm|group product)\M' then 'product'
    when t ~* '\m(consultant|consulting|professional services|solutions? (architect|engineer|consultant)|forward deployed|implementation (manager|consultant|engineer)|pre-?sales|technical account manager|sap|erp|managed services)\M' then 'consulting'
    when t ~* '\m((engineering|software|technical|development|data|platform|r&d|qa|security|it|infrastructure) (manager|director|head)|head of (engineering|data|platform|technology)|vp,? engineering|director,? (of )?(engineering|software|technology|data)|manager,? (of )?(software )?engineering|tech lead|chief technology|cto)\M' then 'eng_management'
    when t ~* '\m(machine learning|ml|mlops|ai|artificial intelligence|nlp|computer vision|llm|deep learning|generative|genai|research (scientist|engineer)|applied scientist|prompt engineer)\M' then 'ml_ai'
    when t ~* '\m(data (engineer|analyst|scientist|architect|platform|analytics|warehouse|science|steward|modeler|ops)|analytics|business intelligence|bi (developer|analyst|engineer)|etl|big data|database developer|statistician)\M' then 'data'
    when t ~* '\m(qa|quality assurance|quality engineer|sdet|test (engineer|automation|analyst|lead|manager)|software test|tester)\M' then 'qa'
    when t ~* '\m(devops|sre|site reliability|platform engineer|infrastructure|cloud (engineer|architect|ops|infrastructure|platform)|systems? (engineer|administrator|admin|analyst)|network (engineer|administrator|admin|architect)|release engineer|production engineer|reliability engineer|dba|database (administrator|admin|engineer)|devsecops|kubernetes)\M' then 'devops'
    when t ~* '\m(embedded|firmware|hardware|fpga|asic|vlsi|silicon|rtl|verification|physical design|analog|mixed[- ]signal|electrical|electronics|mechanical|pcb|rf|semiconductor|photonics?|optical|robotics|mechatronics|chip|dft)\M' then 'hardware'
    when t ~* '\m(ios|android|mobile|react native|flutter|swift(ui)?|kotlin)\M' then 'mobile'
    when t ~* '\mfull[- ]?stack\M' then 'fullstack'
    when t ~* '\m(front[- ]?end|ui (engineer|developer)|web (developer|engineer)|react|angular|vue|javascript|typescript)\M' then 'frontend'
    when t ~* '\m(back[- ]?end|server[- ]side|api (engineer|developer)|java|python|golang|go|node(\.?js)?|ruby|rails|php|rust|scala|django|spring|microservices|distributed systems)\M' or t ~* '(c\+\+|c#|\.net)' then 'backend'
    when t !~* '\m(engineer|developer|architect)\M'
      and t ~* '\m(recruit(er|ing|ment)?|talent|people|human resources|hr|payroll|finance|financial|accountant|accounting|controller|treasury|audit(or)?|tax|legal|counsel|attorney|paralegal|compliance|operations|admin(istrat\w*)?|office manager|procurement|supply chain|logistics|facilities|fund|investigator|aml|risk)\M' then 'people_ops'
    when t ~* '\m(engineer|engineering|developer|software|programmer|architect|sde|swe|technologist|technical|r&d)\M' then 'engineering'
    else null
  end
$$;

create or replace function public.classify_job_category(p_title text, p_department text default null)
returns text
language sql
immutable
as $$
  select coalesce(
    public.classify_job_text(p_title),
    case
      when p_department is null or btrim(p_department) = '' then null
      when p_department ~* 'marketing|brand|communications' then 'marketing'
      when p_department ~* 'sales|revenue|commercial|business development|gtm|partnerships?|^account' then 'sales'
      when p_department ~* 'customer|support|client|success' then 'customer'
      when p_department ~* 'security' then 'security'
      when p_department ~* '^design' then 'design'
      when p_department ~* 'product' then 'product'
      when p_department ~* 'professional services|consulting|solutions' then 'consulting'
      when p_department ~* '^data|analytics' then 'data'
      when p_department ~* 'people|^hr|human|talent|recruit|finance|legal|operations|admin|compliance|procurement|supply' then 'people_ops'
      when p_department ~* 'engineering|technology|software|development|r&d|platform|infrastructure' then 'engineering'
      else null
    end,
    'other'
  )
$$;

create or replace function public.infer_job_level(p_title text, p_stored text default null)
returns text
language sql
immutable
as $$
  select coalesce(
    case
      when p_title ~* '\m(director|vp|vice president|chief|cto|ceo|head of)\M' then 'executive'
      when p_title ~* '\m(principal|distinguished|architect|lead|engineering manager|software (development )?manager|manager,? (of )?(software )?engineering)\M'
        or p_title ~* '\mstaff(?=(\s+\w+){0,2}\s+(engineer|scientist|developer|designer))' then 'lead'
      when p_title ~* '\m(senior|sr)\M' then 'senior'
      when p_title ~* '\m(intern(ship)?|co-?op|apprentice|werkstudent)\M' then 'intern'
      when p_title ~* '\m(junior|jr|graduate|entry[ -]level|fresher|trainee|associate|new grad)\M' then 'entry'
      when substring(p_title from '(\d{1,2})\s*\+?\s*(?:years|yrs)') is not null then
        case
          when substring(p_title from '(\d{1,2})\s*\+?\s*(?:years|yrs)')::int >= 10 then 'lead'
          when substring(p_title from '(\d{1,2})\s*\+?\s*(?:years|yrs)')::int >= 6 then 'senior'
          when substring(p_title from '(\d{1,2})\s*\+?\s*(?:years|yrs)')::int >= 3 then 'mid'
          else null
        end
      else null
    end,
    case when p_stored in ('intern', 'entry', 'mid', 'senior', 'lead', 'executive') then p_stored end,
    'mid'
  )
$$;

create or replace function public.is_fresher_job(p_title text, p_level text)
returns boolean
language sql
immutable
as $$
  select p_level in ('intern', 'entry')
    or coalesce(p_title ~* '\m(fresher|freshers|new grad(uate)?|campus|trainee|early career)\M', false)
    or coalesce(p_title ~* '\m0\s*(-|to)\s*[12]\+?\s*years?\M', false)
$$;

alter table public.company_jobs
  add column if not exists role_category text check (role_category is null or role_category in (
    'engineering', 'backend', 'frontend', 'fullstack', 'mobile', 'devops', 'data', 'ml_ai', 'security', 'qa', 'hardware',
    'eng_management', 'product', 'design', 'sales', 'marketing', 'customer', 'people_ops', 'consulting', 'other'
  )),
  add column if not exists role_level text check (role_level is null or role_level in ('intern', 'entry', 'mid', 'senior', 'lead', 'executive')),
  add column if not exists is_fresher boolean not null default false;

create or replace function public.set_job_role_fields()
returns trigger
language plpgsql
as $$
begin
  new.role_category := public.classify_job_category(new.title, new.department);
  new.role_level := public.infer_job_level(new.title, new.experience_level);
  new.is_fresher := public.is_fresher_job(new.title, new.role_level);
  return new;
end;
$$;

drop trigger if exists trg_set_job_role_fields on public.company_jobs;
create trigger trg_set_job_role_fields
  before insert or update of title, department, experience_level on public.company_jobs
  for each row execute function public.set_job_role_fields();

-- Classify the jobs that already exist; the trigger fires here too and writes the same values.
update public.company_jobs
set role_category = public.classify_job_category(title, department),
    role_level = public.infer_job_level(title, experience_level),
    is_fresher = public.is_fresher_job(title, public.infer_job_level(title, experience_level));

create index if not exists company_jobs_facets_idx
  on public.company_jobs (listing_id)
  include (role_category, role_level, workplace_type, is_fresher)
  where is_active;

-- Faceted counts for the explorer: every group is counted with the other groups' filters applied, so a chip's number
-- is what the person would get by choosing it. Scope is the roles of companies pinned in the hub, matching the map.
create or replace function public.tech_atlas_job_facets(
  p_city_terms text[] default null,
  p_country text default null,
  p_levels text[] default '{}',
  p_workplaces text[] default '{}',
  p_categories text[] default '{}',
  p_freshers boolean default false
)
returns jsonb
language sql
stable
as $$
  with scoped as materialized (
    select j.listing_id, j.role_level, j.workplace_type, j.role_category, j.is_fresher
    from public.company_jobs j
    join public.listings l on l.id = j.listing_id
    where j.is_active
      and l.status = 'published'
      and l.company_type is not null
      and l.latitude is not null
      and l.longitude is not null
      and (p_country is null or l.country_code = upper(p_country))
      and (
        p_city_terms is null
        or cardinality(p_city_terms) = 0
        or l.city ilike any (array(select '%' || t || '%' from unnest(p_city_terms) as t))
      )
  ),
  by_level as (
    select role_level as k, count(*) as n from scoped
    where (cardinality(p_workplaces) = 0 or workplace_type = any (p_workplaces))
      and (cardinality(p_categories) = 0 or role_category = any (p_categories))
      and (not p_freshers or is_fresher)
    group by 1
  ),
  by_workplace as (
    select workplace_type as k, count(*) as n from scoped
    where (cardinality(p_levels) = 0 or role_level = any (p_levels))
      and (cardinality(p_categories) = 0 or role_category = any (p_categories))
      and (not p_freshers or is_fresher)
    group by 1
  ),
  by_category as (
    select role_category as k, count(*) as n from scoped
    where (cardinality(p_levels) = 0 or role_level = any (p_levels))
      and (cardinality(p_workplaces) = 0 or workplace_type = any (p_workplaces))
      and (not p_freshers or is_fresher)
    group by 1
  ),
  fresher_roles as (
    select count(*) as n from scoped
    where is_fresher
      and (cardinality(p_levels) = 0 or role_level = any (p_levels))
      and (cardinality(p_workplaces) = 0 or workplace_type = any (p_workplaces))
      and (cardinality(p_categories) = 0 or role_category = any (p_categories))
  ),
  matched as (
    select listing_id, count(*) as n from scoped
    where (cardinality(p_levels) = 0 or role_level = any (p_levels))
      and (cardinality(p_workplaces) = 0 or workplace_type = any (p_workplaces))
      and (cardinality(p_categories) = 0 or role_category = any (p_categories))
      and (not p_freshers or is_fresher)
    group by 1
  )
  select jsonb_build_object(
    'levels', coalesce((select jsonb_object_agg(k, n) from by_level), '{}'::jsonb),
    'workplaces', coalesce((select jsonb_object_agg(k, n) from by_workplace), '{}'::jsonb),
    'categories', coalesce((select jsonb_object_agg(k, n) from by_category), '{}'::jsonb),
    'freshers', (select n from fresher_roles),
    'roles', coalesce((select sum(n) from matched), 0),
    'companies', coalesce((select jsonb_agg(jsonb_build_array(listing_id, n)) from matched), '[]'::jsonb)
  )
$$;

grant execute on function public.tech_atlas_job_facets(text[], text, text[], text[], text[], boolean) to anon, authenticated, service_role;
