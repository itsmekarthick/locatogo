-- Disable auto-provisioning of workspaces for all new users.
-- All new signups (via SSO or email) will now default to the 'tech_user' role and get a tech_profile.
-- No tenant or directory will be created for them.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_role public.platform_role;
begin
  -- Resolve display name from metadata or email
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  -- Determine role (default to tech_user if not explicitly provided)
  begin
    v_role := coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'platform_role'), ''),
      'tech_user'
    )::public.platform_role;
  exception
    when others then
      v_role := 'tech_user'::public.platform_role;
  end;

  -- Insert profile with the determined role
  insert into public.profiles (id, display_name, platform_role)
  values (new.id, v_display_name, v_role)
  on conflict (id) do update set 
    display_name = excluded.display_name,
    platform_role = excluded.platform_role;

  -- Ensure they have a tech_profile (even if they are just a user, no harm in having the table row ready)
  insert into public.tech_profiles (id) values (new.id) on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Catch any potential errors so the user is still created in auth.users
    raise warning 'Error in handle_new_user for %: %', new.id, SQLERRM;
    return new;
end;
$$;
