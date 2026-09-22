-- Add tech_user to platform_role enum
ALTER TYPE public.platform_role ADD VALUE IF NOT EXISTS 'tech_user';

-- Create tech_profiles table
CREATE TABLE IF NOT EXISTS public.tech_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  github_url text check (github_url ~ '^https?://(www\.)?github\.com/.*$'),
  linkedin_url text check (linkedin_url ~ '^https?://(www\.)?linkedin\.com/.*$'),
  portfolio_url text,
  skills text[] default '{}',
  bio text,
  resume_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.tech_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for tech_profiles
DROP POLICY IF EXISTS tech_profiles_self_read ON public.tech_profiles;
CREATE POLICY tech_profiles_self_read ON public.tech_profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS tech_profiles_self_update ON public.tech_profiles;
CREATE POLICY tech_profiles_self_update ON public.tech_profiles 
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  
DROP POLICY IF EXISTS tech_profiles_self_insert ON public.tech_profiles;
CREATE POLICY tech_profiles_self_insert ON public.tech_profiles 
  FOR INSERT WITH CHECK (id = auth.uid());

REVOKE ALL ON public.tech_profiles FROM anon;

-- Update trigger to set platform_role from metadata and create tech profile if needed
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  workspace_name text := nullif(trim(new.raw_user_meta_data ->> 'tenant_name'), '');
  workspace_slug text := nullif(trim(new.raw_user_meta_data ->> 'tenant_slug'), '');
  user_role text := new.raw_user_meta_data ->> 'platform_role';
begin
  insert into public.profiles (id, display_name, platform_role)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'display_name',
    case when user_role = 'tech_user' then 'tech_user'::public.platform_role else 'user'::public.platform_role end
  )
  on conflict (id) do nothing;

  if user_role = 'tech_user' then
    insert into public.tech_profiles (id) values (new.id) on conflict (id) do nothing;
  else
    if workspace_name is not null and workspace_slug is not null then
      insert into public.tenants (name, slug, owner_user_id)
      values (workspace_name, workspace_slug, new.id)
      returning id into new_tenant_id;

      insert into public.tenant_users (tenant_id, user_id, role)
      values (new_tenant_id, new.id, 'tenant_owner');
    end if;
  end if;

  return new;
end;
$$;
