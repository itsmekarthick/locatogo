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

## Motion system

Tokens and utilities live in `src/app/globals.css`; do not hard-code durations or curves.

- **Durations:** `--dur-instant` 120ms, `--dur-fast` 200ms, `--dur-base` 320ms, `--dur-slow` 500ms (the ceiling for UI feedback). **Easings:** `--ease-standard`, `--ease-emphasized`, `--ease-spring` (markers and toggles only).
- **Utilities:** `animate-fade-in`, `animate-fade-up`, `animate-scale-in`, `animate-slide-in-right`, `animate-pop`, `animate-shimmer`, plus `stagger` (set `--i` per child), `lift` (2px hover rise), `transition-ui` and `transition-flat` (same without `box-shadow`; use it on cards in long lists).
- **Rules:** animate `transform`, `opacity` and paint-only properties (`clip-path`, `stroke-dashoffset`) only, never layout properties or blur. Fade a pseudo-element overlay for hover shadows instead of transitioning `box-shadow`. Press and hover movement uses `motion-safe:`.
- **Reduced motion:** keyframes read `--motion-distance`, `--motion-scale-from`, `--motion-slide` and `--motion-pop-scale`, which are zeroed under `prefers-reduced-motion`, so entrances degrade to opacity fades. The same block restricts transitions to opacity and colour and stops ambient loops. Write new keyframes with those variables.
- **Navigation:** `src/app/template.tsx` wraps each route in React `<ViewTransition>`; `SkeletonExit` and `ContentEnter` (`src/components/page-transition.tsx`) crossfade a `loading.tsx` skeleton into its page. Browsers without the API get the `.route-shell` fade-up fallback.

## Automated US company sync

Use `sync:us-companies` to import a JSON or CSV company feed and immediately sync each company's supported ATS jobs. The feed is external to the repository, so new companies can be added without a code change or migration.

By default the script fetches the current public Remote In Tech company directory, keeps records with known US office locations, and imports them. Set `US_COMPANIES_SOURCE` only when using another HTTPS URL or local file path. `US_COMPANIES_LIMIT` can cap a run while testing. Each custom row must include `name` and `city`, plus `website` or `careers_url`; optional fields include `slug`, `state`, `address_line_1`, `locality`, `latitude`, `longitude`, `company_type`, `funding_stage`, and `short_description`.

```powershell
$env:US_COMPANIES_LIMIT = "50"
npm run sync:us-companies
```

The importer validates input, upserts listings by domain and slug, and fetches jobs from Greenhouse, Lever, Ashby, SmartRecruiters, or supported career-page JSON-LD sources. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and use a trusted HTTPS feed in scheduled automation.

Public SEO routes are generated at `/sitemap.xml` and `/robots.txt`. Set `NEXT_PUBLIC_APP_URL` to the canonical deployment URL so metadata and sitemap links are correct.
