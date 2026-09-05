# Overture India Import

Apply `supabase/migrations/202609030010_overture_import_setup.sql` first. The migration performs the confirmed clean-slate listing wipe; the Python script never deletes listings.

## Setup

```powershell
python -m venv .venv-overture
.\.venv-overture\Scripts\Activate.ps1
python -m pip install -r scripts/overture/requirements.txt
pip install overturemaps
```

Download the pinned release and full India bounding box into the ignored local artifact:

```powershell
overturemaps download --release 2026-08-19.0 --type=place --bbox=68.0,6.5,97.5,35.5 -f geoparquet -o scripts/overture/india_places.parquet
```

Validate a sample without credentials:

```powershell
python scripts/overture/import_india.py scripts/overture/india_places.parquet --sample 1000 --dry-run --manifest scripts/overture/sample-manifest.json
```

For the real import, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the process environment. The service-role key is required and must never be committed or replaced with the anon key:

```powershell
python scripts/overture/import_india.py scripts/overture/india_places.parquet --manifest scripts/overture/india-manifest.json
```

Records are upserted in batches of 500 as `published` and `unverified`, with no owner and no featured flag. Deterministic domain/slug keys make reruns safe: existing Atlas records are updated rather than duplicated. Rejected rows are reported in the manifest. The migration is the explicit clean-slate operation.

To import into your own existing tenant/domain and associate records with your user, pass the existing slugs and your profile UUID:

```powershell
python scripts/overture/import_india.py scripts/overture/india_places.parquet `
	--tenant-slug your-workspace-slug `
	--domain-slug your-domain-slug `
	--owner-user-id your-user-uuid
```

To create a new domain under an existing tenant during the import, add `--create-domain --domain-name "India Places"`. The tenant must already exist. The owner UUID must be an existing `profiles.id`; it is stored in `listings.owner_user_id`.
