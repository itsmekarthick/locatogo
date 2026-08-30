-- Migration: place_reviews table with RLS
-- Run via: supabase db push  OR paste into Supabase Dashboard > SQL Editor

create table if not exists public.place_reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      smallint not null check (rating >= 1 and rating <= 5),
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, listing_id)  -- one review per user per listing
);

-- Indexes
create index if not exists place_reviews_listing_idx on public.place_reviews(listing_id);
create index if not exists place_reviews_user_idx    on public.place_reviews(user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger place_reviews_updated_at
  before update on public.place_reviews
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.place_reviews enable row level security;

-- Public can read all approved reviews
create policy "public_read_reviews"
  on public.place_reviews for select
  using (true);

-- Authenticated users can insert their own review
create policy "users_insert_own_review"
  on public.place_reviews for insert
  with check (auth.uid() = user_id);

-- Users can update their own review
create policy "users_update_own_review"
  on public.place_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own review
create policy "users_delete_own_review"
  on public.place_reviews for delete
  using (auth.uid() = user_id);
