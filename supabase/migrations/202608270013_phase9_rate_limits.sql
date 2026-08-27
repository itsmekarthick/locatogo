create table public.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null default timezone('utc', now()),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.consume_rate_limit(target_key text, window_seconds integer, max_requests integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_bucket public.rate_limit_buckets;
  now_value timestamptz := timezone('utc', now());
begin
  if length(trim(target_key)) < 1 or window_seconds < 1 or max_requests < 1 then return false; end if;
  insert into public.rate_limit_buckets (bucket_key, window_started_at, request_count)
  values (target_key, now_value, 1)
  on conflict (bucket_key) do update set
    window_started_at = case when now_value - rate_limit_buckets.window_started_at >= make_interval(secs => window_seconds) then now_value else rate_limit_buckets.window_started_at end,
    request_count = case when now_value - rate_limit_buckets.window_started_at >= make_interval(secs => window_seconds) then 1 else rate_limit_buckets.request_count + 1 end
  returning * into current_bucket;
  return current_bucket.request_count <= max_requests;
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated;
