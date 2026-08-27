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
6. Start Mapora with `npm run dev` and open `http://localhost:3000/auth/signup`.

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is required only for signed payment webhook reconciliation and must never be prefixed with `NEXT_PUBLIC_`.

## Option B: Local Supabase

Local Supabase requires Docker Desktop with its Linux engine running. After installing Docker Desktop:

```powershell
supabase start
supabase db reset
supabase test db
```

The local endpoints are:

- API: `http://localhost:54321`
- Studio: `http://localhost:54323`
- Inbucket email UI: `http://localhost:54324`

For local app development, set:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=use-the-anon-key-from-supabase-start
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Current machine status

The Supabase CLI is installed, but Docker is not available in the current environment. Therefore migrations and pgTAP RLS tests cannot run locally until Docker Desktop is installed and started. The application source still passes its TypeScript, lint, and production-build checks.
