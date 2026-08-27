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

Public SEO routes are generated at `/sitemap.xml` and `/robots.txt`. Set `NEXT_PUBLIC_APP_URL` to the canonical deployment URL so metadata and sitemap links are correct.
