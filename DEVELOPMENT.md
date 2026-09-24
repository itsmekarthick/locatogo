# Development

## Prerequisites

Node.js LTS, npm, and a Supabase project or local Supabase CLI environment. Copy `.env.example` to `.env.local` when it exists and keep secrets out of source control.

Initialize local database tooling with `supabase init`, start the stack with `supabase start`, then run `supabase test db` for the RLS suite.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for Cloud linking, local Docker setup, Auth redirect configuration, and environment variables.

## Workflow

1. Read the PRD and current phase documentation.
2. Make a small, scoped change.
3. Add/update a migration for schema work.
4. Add focused tests.
5. Run typecheck, lint, and tests.
6. Update documentation and report the exact next phase.

## Phase 0 visual direction

Use the Stitch plugin configuration already present in `.agents/plugins/stitch`. The current agent surface cannot invoke Stitch directly, so mock output is not being fabricated. The implementation brief is an original, map-first global directory experience with restrained editorial typography, high-contrast data states, responsive split-view behavior, and no country-specific assumptions.

CSV imports currently process bounded uploads within an authenticated server action. The geocoding provider is intentionally unconfigured; add a queue/worker and compliant provider before enabling large imports in production.

## Automated US company sync

Use `sync:us-companies` to import a JSON or CSV company feed and immediately sync each company's supported ATS jobs. The feed is external to the repository, so new companies can be added without a code change or migration.

By default the script fetches the current public Remote In Tech company directory, keeps records with known US office locations, and imports them. Set `US_COMPANIES_SOURCE` only when using another HTTPS URL or local file path. `US_COMPANIES_LIMIT` can cap a run while testing. Each custom row must include `name` and `city`, plus `website` or `careers_url`; optional fields include `slug`, `state`, `address_line_1`, `locality`, `latitude`, `longitude`, `company_type`, `funding_stage`, and `short_description`.

```powershell
$env:US_COMPANIES_LIMIT = "50"
npm run sync:us-companies
```

The importer validates input, upserts listings by domain and slug, and fetches jobs from Greenhouse, Lever, Ashby, SmartRecruiters, or supported career-page JSON-LD sources. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and use a trusted HTTPS feed in scheduled automation.

Public SEO routes are generated at `/sitemap.xml` and `/robots.txt`. Set `NEXT_PUBLIC_APP_URL` to the canonical deployment URL so metadata and sitemap links are correct.
