-- Make tech_profiles the canonical professional profile record.
ALTER TABLE public.tech_profiles
  ADD COLUMN IF NOT EXISTS preferred_location text,
  ADD COLUMN IF NOT EXISTS resume_storage_path text;

-- Preserve legacy profile values for environments where they were populated.
INSERT INTO public.tech_profiles (
  id,
  skills,
  preferred_location,
  resume_storage_path,
  updated_at
)
SELECT
  legacy.id,
  COALESCE(
    ARRAY(
      SELECT jsonb_array_elements_text(legacy.skills)
      WHERE jsonb_typeof(legacy.skills) = 'array'
    ),
    ARRAY[]::text[]
  ),
  legacy.preferred_location,
  CASE
    WHEN legacy.resume_url LIKE legacy.id::text || '/%' THEN legacy.resume_url
    WHEN legacy.resume_url LIKE '%/resumes/%' THEN regexp_replace(legacy.resume_url, '^.*/resumes/', '')
    ELSE NULL
  END,
  timezone('utc', now())
FROM public.user_profiles AS legacy
ON CONFLICT (id) DO UPDATE
SET
  skills = CASE
    WHEN cardinality(public.tech_profiles.skills) > 0 THEN public.tech_profiles.skills
    ELSE EXCLUDED.skills
  END,
  preferred_location = COALESCE(public.tech_profiles.preferred_location, EXCLUDED.preferred_location),
  resume_storage_path = COALESCE(public.tech_profiles.resume_storage_path, EXCLUDED.resume_storage_path),
  updated_at = EXCLUDED.updated_at;

-- Allow a signed-in submitter to view their own submission history.
DROP POLICY IF EXISTS submissions_self_read ON public.listing_submissions;
CREATE POLICY submissions_self_read ON public.listing_submissions
  FOR SELECT TO authenticated
  USING (submitted_by_user_id = auth.uid());