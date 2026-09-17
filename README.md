# LocaToGo

LocaToGo is a global, multi-tenant directory and interactive map SaaS platform. Tenants can create configurable directories for industries, communities, cities, regions, countries, or global audiences.

## Status

Phase 9 is in progress: public submissions, moderation, claims, CSV imports, advertising/payment foundations, platform analytics, configurable plans, public SEO metadata, sitemap, robots, locale-aware formatters, configurable maps, and browser security headers are implemented. Provider checkout, rate limiting, observability, and full production hardening remain.

## Planned stack

- Next.js App Router and TypeScript
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Tailwind CSS and shadcn/ui
- Leaflet with provider abstractions for maps and geocoding
- Zod validation
- Stripe/Razorpay-compatible payment abstraction
- Vercel-compatible deployment

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup, [ARCHITECTURE.md](ARCHITECTURE.md) for system decisions, and [TESTING.md](TESTING.md) for verification commands.

Never place Supabase service-role credentials in browser code. All tenant-scoped mutations require server-side authorization and database RLS.
