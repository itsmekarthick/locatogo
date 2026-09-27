-- Migration to automatically sync active_jobs_count on listings table

-- Function to recount and update active_jobs_count for a given listing
CREATE OR REPLACE FUNCTION public.sync_listing_jobs_count()
RETURNS TRIGGER AS $$
DECLARE
  target_listing_id uuid;
BEGIN
  -- Determine which listing_id we need to update
  IF (TG_OP = 'DELETE') THEN
    target_listing_id := OLD.listing_id;
  ELSE
    target_listing_id := NEW.listing_id;
  END IF;

  -- Update the active_jobs_count on the listings table
  IF target_listing_id IS NOT NULL THEN
    UPDATE public.listings
    SET active_jobs_count = (
      SELECT count(*)
      FROM public.company_jobs
      WHERE listing_id = target_listing_id
        AND is_active = true
    )
    WHERE id = target_listing_id;
  END IF;

  -- If the listing_id was changed during an UPDATE, update the old one too
  IF (TG_OP = 'UPDATE' AND OLD.listing_id IS NOT NULL AND OLD.listing_id != NEW.listing_id) THEN
    UPDATE public.listings
    SET active_jobs_count = (
      SELECT count(*)
      FROM public.company_jobs
      WHERE listing_id = OLD.listing_id
        AND is_active = true
    )
    WHERE id = OLD.listing_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_sync_listing_jobs_count ON public.company_jobs;

-- Create the trigger on company_jobs
CREATE TRIGGER trg_sync_listing_jobs_count
AFTER INSERT OR UPDATE OF is_active, listing_id OR DELETE
ON public.company_jobs
FOR EACH ROW
EXECUTE FUNCTION public.sync_listing_jobs_count();

-- Optional: Run a one-time backfill to fix all existing counts immediately
UPDATE public.listings l
SET active_jobs_count = (
  SELECT count(*)
  FROM public.company_jobs cj
  WHERE cj.listing_id = l.id
    AND cj.is_active = true
);
