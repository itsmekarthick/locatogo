# Architecture

## Product boundary

locatogo is a strict multi-tenant SaaS. Platform data owns tenants; tenants own domains/directories; domains own categories, listings, custom fields, media, moderation, advertising, payments, and analytics. Every tenant-scoped row must resolve to `tenant_id`, directly or through a checked parent relationship.

## Runtime

The application will use Next.js App Router with server components by default. Route handlers and server actions are the boundary for mutations. Repository functions own data access, services own business workflows, and permission helpers own authorization decisions. Supabase is the persistence and authentication boundary; browser code receives only publishable configuration.

Authentication uses Supabase Auth cookies through `@supabase/ssr`. `proxy.ts` refreshes the session on requests, while server components/actions call `getUser()` and resolve the first active tenant membership. This context is a temporary MVP selection rule; future multi-workspace selection must remain server-authorized.

## Global foundations

Persist timestamps as UTC. Store ISO 3166 country codes, IANA time zones, ISO 4217 currency codes, locale/language codes, international phone data, and Unicode text. Address data is intentionally flexible rather than country-specific. Locale formatting and translation resources are established before public content expands. RTL-compatible layout uses logical CSS properties.

## Provider abstractions

Map tiles, geocoding, payments, storage delivery, notifications, and analytics integrations are represented by interfaces so vendors can change without changing product workflows. Leaflet is the initial map UI. Stripe and Razorpay fit behind one payment contract.

## Phases

0. Project setup, documentation, visual direction, and environment contract.
1. Database, Auth, tenant membership, RLS, and basic layouts.
2. Admin shell, domains, categories, and listing CRUD.
3. Custom fields, media, hours, social links, duplicate detection, audit, and export.
4. Public directory, search, filters, Leaflet map, and SEO pages.
5. Submissions, moderation, claims, verification, and notifications.
6. CSV import, geocoding, asynchronous jobs, and duplicate review.
7. Advertising, listing upgrades, payments, webhooks, and commissions.
8. Platform administration, plans, billing, and analytics.
9. Globalization, SEO, security, performance, and production hardening.

## Design handoff

The repository includes a local Stitch MCP configuration, but the current agent tool surface exposes no callable Stitch design operation. The intended mock direction is therefore recorded here for implementation: an original map-first directory UI with a warm off-white canvas, ink typography, saffron and sea-green accents, compact editorial listing cards, a split map/list desktop view, and a mobile list/map switcher. This is a design brief, not fake implemented functionality. A future Stitch export should be treated as visual input and reconciled with these architectural constraints.

## Decisions

- Directory configuration is data, not code: geography, language, currency, time zone, categories, custom fields, branding, and SEO belong to tenant/domain configuration.
- Listings use archived status for ordinary deletion paths so history and references remain intact.
- Cross-tenant integrity is enforced through composite foreign keys/checks where practical and RLS policies everywhere tenant data is exposed.
- MVP analytics uses an append-only event model with lightweight aggregation rather than a separate warehouse.
