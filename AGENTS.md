# Agent Rules

- Read the PRD before changing product behavior.
- Work in the documented phase order and leave each phase runnable.
- Represent every schema change with a Supabase migration.
- Preserve strict tenant isolation with RLS; never trust a client-supplied tenant ID.
- Keep service-role credentials server-only.
- Validate all external input with Zod or an equivalent server-side schema.
- Authorize every mutation on the server and centralize permission checks.
- Use UTC for persisted timestamps, ISO country codes, IANA time zones, explicit currencies, and Unicode-safe fields.
- Keep map, geocoding, payment, storage, and notification providers behind interfaces.
- Add focused unit, integration, RLS, and E2E coverage for new behavior.
- Record important administrative mutations in append-only audit logs.
- Prefer server components; use client components only for required interaction.
- Do not add mock production behavior or silently simplify the PRD.
- Update the relevant documentation when architecture or behavior changes.
- Do not commit changes unless explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
