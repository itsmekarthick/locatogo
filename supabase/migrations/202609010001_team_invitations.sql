-- Migration: team_invitations table with RLS
-- Run via: supabase db push OR paste into Supabase Dashboard > SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role public.tenant_role not null default 'tenant_staff',
  permissions_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists team_invitations_tenant_idx on public.team_invitations(tenant_id);
create index if not exists team_invitations_token_idx on public.team_invitations(token);
create index if not exists team_invitations_email_idx on public.team_invitations(email);

-- Enable RLS
alter table public.team_invitations enable row level security;

-- Tenant members can view their tenant's invitations
create policy "tenant_members_select_invitations"
  on public.team_invitations for select
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = team_invitations.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
    )
  );

-- Tenant owners & staff with team.manage can create invitations
create policy "tenant_admins_insert_invitations"
  on public.team_invitations for insert
  with check (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = team_invitations.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
        and (tenant_users.role = 'tenant_owner' or tenant_users.permissions_json->>'team.manage' = 'true')
    )
  );

-- Tenant admins can update invitations (e.g. revoke)
create policy "tenant_admins_update_invitations"
  on public.team_invitations for update
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = team_invitations.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
        and (tenant_users.role = 'tenant_owner' or tenant_users.permissions_json->>'team.manage' = 'true')
    )
  );

-- Tenant admins can delete invitations
create policy "tenant_admins_delete_invitations"
  on public.team_invitations for delete
  using (
    exists (
      select 1 from public.tenant_users
      where tenant_users.tenant_id = team_invitations.tenant_id
        and tenant_users.user_id = auth.uid()
        and tenant_users.status = 'active'
        and (tenant_users.role = 'tenant_owner' or tenant_users.permissions_json->>'team.manage' = 'true')
    )
  );
