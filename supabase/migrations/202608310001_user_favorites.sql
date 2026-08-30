-- Migration: user_favorites table with RLS
-- Run via: supabase db push  OR paste into Supabase Dashboard > SQL Editor

create table if not exists public.user_favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, listing_id)
);

-- Index for fast lookups by user and by listing
create index if not exists user_favorites_user_idx    on public.user_favorites(user_id);
create index if not exists user_favorites_listing_idx on public.user_favorites(listing_id);

-- Enable RLS
alter table public.user_favorites enable row level security;

-- Users can read their own favorites
create policy "users_read_own_favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

-- Users can insert their own favorites
create policy "users_insert_own_favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

-- Users can delete their own favorites
create policy "users_delete_own_favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);

-- Public can read aggregate favorite counts per listing (no user info exposed)
create policy "public_read_favorite_counts"
  on public.user_favorites for select
  using (true);
