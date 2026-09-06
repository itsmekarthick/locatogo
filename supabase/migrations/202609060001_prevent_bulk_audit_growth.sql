-- Prevent trusted service-role imports from creating one full JSON snapshot per listing.
-- Authenticated admin mutations continue to be recorded by the audit trigger.
create or replace function public.audit_listing_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  insert into public.listing_audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, old_values, new_values)
  values (
    coalesce(new.tenant_id, old.tenant_id),
    auth.uid(),
    case when tg_op = 'INSERT' then 'listing.created' when tg_op = 'UPDATE' then 'listing.updated' else 'listing.deleted' end,
    'listing',
    coalesce(new.id, old.id),
    to_jsonb(old),
    to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;
