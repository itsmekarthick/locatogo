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

## Role matches

Signed-in tech users get open roles ranked against their resume inside the dashboard (`/dashboard?view=matches`; the old `/matches` route redirects there). Migration `202610310001_job_matches.sql` adds the structured profile columns on `tech_profiles` (`headline`, `experience_level`, `years_experience`, `education`, `work_history`, `resume_parsed_at`) and two tables, `job_matches` (the top 50 per user) and `match_runs` (the latest run per user). Both tables use row level security limited to the owner (`user_id = auth.uid()`); every write uses the signed-in client, never the service role. For the local stack apply it with `node_modules\.bin\supabase.cmd migration up --local`.

- **Single-page dashboard:** `src/app/dashboard/dashboard-shell.tsx` switches the Overview, Matches, Profile and Activity views client-side. The view lives in `?view=` and is updated with `history.pushState`, so nothing reloads, back works, and every view keeps its state. Panels are server-rendered once and hidden, not unmounted. Old `#matches`, `#resume`, `#profile` and `#saved` links are mapped to views, and `?view=matches&step=upload` opens the resume step.
- **Wizard:** `matches/matches-experience.tsx` runs Resume, Review, Match and Results without leaving the page. `POST /api/parse-resume` reads the resume, the Review step (`confirm-profile.tsx`) lets the person correct headline, level, years, hub and skills through `POST /api/matches/profile` (Zod validated), and the scan then runs. A stale or missing run starts when the Matches view is opened, not when the dashboard loads.
- **Resume parsing:** `POST /api/parse-resume` asks Gemini for one JSON object (skills, headline, level, years, recent roles, education). `src/lib/matching/resume-schema.ts` validates it with Zod, drops malformed items, and falls back to years of experience when the level is missing or invalid. It tries `GEMINI_RESUME_MODEL` (default `gemini-3.8-flash`) and then `gemini-3.5-flash-lite` when the first is overloaded.
- **Scoring:** `src/lib/matching/score.ts` is deterministic and unit tested (`npx tsx src/lib/matching/score.test.ts`). Score = 35% skills named in the title or team, 25% role family (`families.ts`), 25% level fit, 15% location. A role's level comes from its title (`levelFromTitle`: principal, senior, intern, "8+ years") before the stored level, because stored levels default to mid. Jobs have no descriptions yet, so only title, team, level, workplace type and location are scored; roles with no skill hit and no role-family overlap are dropped.
- **Run flow:** `POST /api/matches/run` streams newline-delimited JSON events (`start`, `read`, `shortlist`, `pins`, `rank`, `notes`, `done`, `error`), so every count shown is real. The run counts open roles in the user's hub plus remote roles, reads the newest 5,000 in 1,000-row pages, scores them in memory, keeps the top 50, and replaces the user's saved matches. A 15 second cooldown returns 429 unless the profile changed since the last run.
- **Scan scene:** `matches/match-scan.tsx` plays the run events through a queue that holds each stage for a minimum time (read 2.2s, shortlist 2.8s, rank 2.8s, explain until the notes finish typing, reveal 2.2s) on its own clock, so **Pause** really stops it and **Skip** removes the holds; the server itself finishes in about three seconds. Everything shown is real: sampled role titles scroll by while reading, shortlisted roles draw as a ring and skills as bars grown to their real hit counts, the top five show each score as the four weighted parts that add up to it, and the real fit and gap notes are typed out one role at a time. `atlas-map.tsx` draws the hub from listing coordinates (company headquarters): a heat-dot grid lights by how many strong matches sit nearby, pins wave out from the person, routes draw to the top matches, hovering a pin or a ranked row highlights the other, and the map zooms to the best match at the end. Pins are the densest cluster of companies with matching roles, capped at 60. Motion is opacity, transform and `stroke-dashoffset` only (`matches.css`) and degrades to a static, still-readable scene under reduced motion. Opening a wizard step scrolls it to the top of the viewport, and on desktop the scan is sized to fit the viewport height (the story column scrolls inside it). Company logos come from the cached `/api/company-logo` route through `CompanyBrandAvatar`: the ranked rows, notes, best-match card and top map pins show initials first and a logo only after it has loaded, and the top logos are warmed in the background (`useLogoWarmup`) so nothing waits on them. The run log sits in a footer strip across the bottom, and on a short desktop window the stage drops its extras (`.scan-short-hide`) so the left column never needs its own scrollbar.
- **Notes:** Gemini writes short fit and gap notes for the top 10 only (`notes.ts`, model from `GEMINI_MATCH_MODEL`, default `gemini-3.5-flash-lite`). The prompt forbids claims beyond the title, team, level and location. Any failure keeps the rule-based notes, and `notes_source` records which was used.
- **Staleness:** `match_runs.profile_hash` hashes the scored profile fields plus `SCORING_VERSION`. The Matches view re-runs when the hash differs or the last run is older than 24 hours.
## Explorer filters

Migration `202611010001_job_role_facets.sql` adds `role_category`, `role_level` and `is_fresher` to `company_jobs`. They are filled by SQL functions (`classify_job_category`, `infer_job_level`, `is_fresher_job`) from the title and department through a `BEFORE INSERT OR UPDATE` trigger, so every ingestion path is classified without code changes, and existing rows were backfilled. Stored `experience_level` defaults to mid for almost every job, so the level comes from the title first (principal, senior, intern, "8+ years"); a manager title is not a level. The SQL tests are in `supabase/tests/job_role_facets.sql` (pgTAP; run with `supabase test db`).

- **Counts:** `tech_atlas_job_facets` returns role counts per level, work mode and role type with every other group's filters applied, so a chip's number is what choosing it would give, plus the companies that match and how many roles each has. Scope is the roles of companies pinned in the hub (their listing city matches `hubCityTerms` in `src/lib/constants/tech-hubs.ts`, which the company list route uses too). `GET /api/tech-atlas/facets` validates the query with Zod and caches for five minutes.
- **Vocabulary:** `src/lib/jobs/taxonomy.ts` holds the level, work mode and role type ids and labels shared by the database check constraints, the API and the UI.
- **Explorer:** `useJobFacets` fetches counts for the current hub and filters (debounced, aborted when superseded, cached, previous answer kept while loading). With any role filter on, a company stays on the map and in the list only if it has at least one matching role, and its role count shows the matching roles. Filters live in the URL as `level`, `work`, `role` and `freshers`; the old `workplace` parameter is still read. The Freshers switch sits in the header on large screens and in the filters sheet everywhere.
- **Freshers:** intern and entry roles, plus titles that say fresher, graduate, trainee, campus or 0-2 years.

## Landing page

The marketing landing page (`src/app/page.tsx`, revalidated hourly) has no hand-typed numbers. `loadLandingLive` in `src/lib/landing/data.ts` reads everything the page shows in one pass: global and per-hub role counts through `tech_atlas_job_facets`, the top companies of six hubs, roles posted in the last 24 hours and seven days, a few real fresher roles from tech role types (one per company, emoji stripped from company names), and a sample match. The sample match runs the same `rankJobs` scorer as a real resume (a fixed machine learning profile in Bengaluru, scored against up to 5,000 open Bengaluru and remote roles) and is labelled "Sample profile" in the UI.

- **Hero (`components/landing/hero-preview.tsx`):** a tilted browser frame with three auto-advancing scenes, Explore (a tour of three hubs with their real top companies on a dotted world map), Filter (level and role-type counts, then the Freshers switch turns on and the count and roles change) and Match (sample profile, scan sweep, ranked roles with score bars and a fit note). The tabs are real buttons; clicking one jumps to it and restarts its progress bar.
- **Dotted map:** `world-dots.ts` is generated by `node scripts/landing/generate-world-dots.mjs <ne_110m_land.geojson>` from Natural Earth 110m land (public domain) and drawn by `WorldDots` as one static path of dots; `lib/landing/map.ts` projects hub coordinates onto it. The feature card reuses it.
- **Performance rules:** all choreography is CSS inside the active scene (`.lp-scene[data-active="true"]` in `landing-effects.css`), so hidden scenes cost nothing, and elements rest in their final state so reduced motion shows the finished scene. Only transform, opacity and `stroke-dashoffset` animate. Scroll parallax, the pointer spotlight and pause state (`data-run`: off screen, keyboard focus or hidden tab; hovering does not pause) are written straight to the DOM from one effect, never through React state; the spotlight variable sits on a leaf element so pointer moves do not restyle the scenes. Scenes are memoized and mounted one at a time when the browser is idle. The tab progress bar's `animationend` advances the scene, so pausing the animation pauses the tour. The scenes' grids use explicit `grid-cols-1` so long truncated titles cannot widen the page on small screens.
- **Inspiration:** ideas were audited from 21st.dev, reactbits.dev and ui.aceternity.com (world map with arcs, container-scroll tilt, glowing cards, dotted backgrounds). Their WebGL and Motion-based pieces were not adopted; everything here is original CSS and SVG with no new dependency.

## Theme toggle

Every top bar renders `ThemeToggle` (`src/components/theme-toggle.tsx`) next to the account menu. Each mounted toggle registers itself, and `GlobalThemeToggle` in the root layout floats in the top-right corner only on screens where none is mounted (not-found pages, claim pages, and so on), so the theme can always be switched without opening a menu. When adding a new header, include `<ThemeToggle />` beside `<UserProfileMenu />`.

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
