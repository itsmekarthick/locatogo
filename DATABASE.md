# Database

## Migration policy

All schema changes live in `supabase/migrations` and are applied in order. Production schema is never edited manually. Seed data is separate from migrations and must not weaken RLS.

## Phase 1 and Phase 2 model

The foundation introduces profiles, tenants, tenant memberships, domains, and the global reference/configuration tables needed before listings: countries, currencies, and language/time-zone configuration. Phase 2 adds tenant-scoped categories and listings, same-domain composite foreign keys, lifecycle and verification enums, and manager/owner RLS policies. Later phases add media, custom fields, claims, imports, payments, analytics, and append-only audit logs.

Phase 3 adds custom fields and typed listing attributes, private listing media, opening hours, social links, and append-only listing audit logs. Phase 3 storage paths begin with the trusted tenant UUID and are protected by Supabase Storage policies. Listing child tables use composite foreign keys back to the tenant-owned listing.

## Integrity rules

- A domain belongs to exactly one tenant.
- A membership belongs to exactly one tenant and authenticated user.
- Slugs are unique within their owning scope.
- Tenant membership is checked by database functions/policies, not only UI state.
- Reference data uses explicit codes and remains Unicode-safe.
- Administrative audit rows are insert-only for normal application roles.

## RLS test contract

Tests must prove tenant A cannot read, update, or delete tenant B data and cannot read tenant B payments or audit logs. Platform-admin cross-tenant operations use a server-only path with explicit authorization and audit coverage.
