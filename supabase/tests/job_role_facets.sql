begin;

select plan(32);

-- Categories read from the title first, then fall back to the department.
select is(public.classify_job_category('Senior Backend Engineer, Growth', 'Engineering'), 'backend', 'backend engineer');
select is(public.classify_job_category('Senior Frontend Engineer', 'Engineering'), 'frontend', 'frontend engineer');
select is(public.classify_job_category('Full Stack Developer', null), 'fullstack', 'full stack developer');
select is(public.classify_job_category('iOS Engineer', null), 'mobile', 'mobile engineer');
select is(public.classify_job_category('Site Reliability Engineer', null), 'devops', 'site reliability');
select is(public.classify_job_category('Data Engineer 1 - Enterprise Technology Services', null), 'data', 'data engineer');
select is(public.classify_job_category('Sr. Applied AI/ML Scientist', null), 'ml_ai', 'applied ml scientist');
select is(public.classify_job_category('Security Engineer, Infrastructure Security', null), 'security', 'security engineer');
select is(public.classify_job_category('Software Development Engineer in Test', null), 'engineering', 'plain engineer stays general');
select is(public.classify_job_category('QA Engineer', null), 'qa', 'qa engineer');
select is(public.classify_job_category('Embedded Firmware Engineer', null), 'hardware', 'firmware');
select is(public.classify_job_category('Engineering Manager - Axion', null), 'eng_management', 'engineering manager');
select is(public.classify_job_category('Senior Product Manager - Enterprise AI', null), 'product', 'product manager beats the AI keyword');
select is(public.classify_job_category('Director of Product, Growth', null), 'product', 'director of product');
select is(public.classify_job_category('Lead UX Designer', null), 'design', 'designer');
select is(public.classify_job_category('AI Partnerships Manager', null), 'sales', 'partnerships beat the AI keyword');
select is(public.classify_job_category('Product Marketing Manager', null), 'marketing', 'product marketing is marketing');
select is(public.classify_job_category('Technical Recruiter', null), 'people_ops', 'recruiter');
select is(public.classify_job_category('Quant Trader', 'Engineering'), 'engineering', 'department fallback');
select is(public.classify_job_category('Quant Trader', null), 'other', 'unknown title');

-- Level comes from the title; a stored level only applies when the title is silent.
select is(public.infer_job_level('Principal Engineer, Data [ 8+ years ]', 'mid'), 'lead', 'principal');
select is(public.infer_job_level('Sr. Backend Engineer', 'mid'), 'senior', 'senior');
select is(public.infer_job_level('Software Engineer, 7+ years', 'mid'), 'senior', 'years requirement');
select is(public.infer_job_level('Product Manager, Growth', 'mid'), 'mid', 'manager is not a level');
select is(public.infer_job_level('Senior Director of Engineering', 'mid'), 'executive', 'director');
select is(public.infer_job_level('Software Engineer', 'entry'), 'entry', 'stored level when the title is silent');
select is(public.infer_job_level('Staff Accountant', null), 'mid', 'staff accountant is not staff level');

-- Fresher roles are interns, entry level, or say so in the title.
select is(public.is_fresher_job('Software Engineer Intern', 'intern'), true, 'intern is a fresher role');
select is(public.is_fresher_job('Graduate Software Engineer', 'entry'), true, 'graduate is a fresher role');
select is(public.is_fresher_job('Software Engineer (0-2 years)', 'mid'), true, 'zero to two years');
select is(public.is_fresher_job('Senior Software Engineer', 'senior'), false, 'senior is not a fresher role');

select ok(jsonb_typeof(public.tech_atlas_job_facets(array['bangalore'], null, '{}', '{}', '{}', false) -> 'companies') = 'array', 'facets return a company list');

select * from finish();

rollback;
