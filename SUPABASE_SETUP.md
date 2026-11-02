# Supabase Setup

## Option A: Supabase Cloud

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. In **Project Settings > API**, copy the Project URL and the publishable/anon key.
3. Create `.env.local` in the repository root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=&copy; OpenStreetMap contributors
```

4. Apply the migrations from the repository. From PowerShell, authenticate with the Supabase CLI and link using your project reference:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

5. In **Authentication > URL Configuration**, set the site URL to `http://localhost:3000` and add `http://localhost:3000/**` to redirect URLs.
6. Start LocaToGo with `npm run dev` and open `http://localhost:3000/auth/signup`.

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is required only for signed payment webhook reconciliation and must never be prefixed with `NEXT_PUBLIC_`.

## Option B: Local Supabase

The local production-data snapshot is installed. Start Docker Desktop with its Linux engine running, then use:

```powershell
npm run dev:local
```

This starts Supabase, configures `.env.local` with local keys, and starts Next.js. The endpoints use non-default ports because Windows reserves the default Supabase range on this machine:

- App: `http://localhost:3000`
- API: `http://127.0.0.1:56321`
- Database: `postgresql://postgres:postgres@127.0.0.1:56322/postgres`
- Studio: `http://127.0.0.1:56323`
- Local Auth email inbox: `http://127.0.0.1:56324`

Email/password login is enabled; Google OAuth is not configured. Local test credentials are in `.local-supabase/login.txt`. The production account's password is unchanged. The original environment is backed up at `.local-supabase/cloud.env.local`. All files in `.local-supabase/` are ignored by Git and contain sensitive data.

The snapshot contains all 36 public tables plus Auth users and identities: 38,060 listings, 47,074 jobs, 1,298 company profiles, and 9 users. The two private cloud resume files could not be downloaded with the available MCP permissions; their database paths are preserved, but the files need to be reuploaded locally or copied with authenticated Storage access. Both private buckets exist locally. Browser connections to the configured loopback Supabase origin are permitted only in development; production CSP is unchanged.

Stop Next.js with Ctrl+C, then stop Supabase without deleting data:

```powershell
npm run local:stop
```

Do not use `supabase db reset` or `supabase stop --no-backup` for daily startup: they delete the local snapshot. Historical migrations depend on production tenants, so rebuilding a fresh database requires the snapshot-aware bootstrap in `scripts/local/supabase.mjs`, not a plain reset. The bootstrap records migrations in the local migration history without changing historical migration files.

To discard local test changes and restore the saved snapshot, stop the app, leave local Supabase running, and run `npm run local:restore`. This affects only the `supabase_db_locatogo` Docker container. It restores the original imported Auth password hashes too; regenerate the local test password with `node scripts/local/supabase.mjs login YOUR_IMPORTED_EMAIL` afterward. Refreshing from cloud requires a new read-only export; local changes never sync back automatically.

Application RLS and tenant memberships are preserved. The existing pgTAP suite currently fails before assertions because its profile fixtures reference missing Auth users. Gemini, maps, geocoding, and ATS providers remain external; their calls may still incur provider usage. Resend is disabled locally to prevent real emails to imported users. Scripts that explicitly load `.env` need a separate local configuration before running them.

## Public Page Caching

The landing and map pages use an anonymous Supabase client with five-minute Next.js fetch caching. Cookies, user sessions, and service-role credentials are not part of this cache. The landing page is prerendered with five-minute revalidation; the map still renders per request because its filters use search parameters. Successful OG images are cached for one hour in browsers and one day in shared caches. Instance-local data caches warm independently on Cloud Run; these changes do not introduce a shared Redis cache or change private dashboard reads.

## Production Auth Email Hook

An Auth log reporting `Secret provided: Yes` followed by `Secret mismatch` means the hook URL credential and Cloud Run configuration do not match. Deploy the current handler and align the credentials; changing a rejection response from 500 to 401 does not restore signup delivery.

Prefer signed hooks: set Cloud Run's server-only `SEND_EMAIL_HOOK_SECRET` to the signing secret supplied by Supabase, and configure the Send Email hook URL as `https://locatogo.com/api/auth/webhook` without a query secret. Keep `RESEND_API_KEY`, a verified `RESEND_FROM_EMAIL`, and the production Supabase URL configured on Cloud Run. The handler also supports the legacy `?secret=...` URL when its value exactly matches server-only `SUPABASE_WEBHOOK_SECRET`. Do not place either hook secret in a `NEXT_PUBLIC_` variable. Rotate query secrets exposed in access logs. This handler currently delivers signup confirmation emails only; other Auth email types need delivery support before relying on this hook for password recovery or invitations.
