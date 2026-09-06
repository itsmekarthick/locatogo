-- Listing audit snapshots are disabled to prevent bulk data from consuming storage.
-- Keep the table for compatibility with existing admin queries and historical cleanup.
drop trigger if exists listings_audit_trigger on public.listings;

revoke insert, update, delete on public.listing_audit_logs from authenticated;
