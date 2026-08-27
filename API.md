# API and Server Actions

Sensitive operations use Next.js server actions or route handlers. UI components do not contain scattered database queries.

## Conventions

- Authenticate before parsing resource input.
- Resolve tenant context from the trusted session/domain, never from an arbitrary form field.
- Validate with Zod on the server.
- Check centralized permissions before repository calls.
- Return typed success/error results without leaking database details.
- Write audit events for important mutations.

## Implemented operations

Auth: `login`, `signup`, and `logout`. Signup passes workspace metadata to the server-side Supabase auth trigger, which creates the profile, tenant, and owner membership.

Admin CRUD: `createDomain`, `createCategory`, `createListing`, and `archiveListing`. Each resolves the active tenant from the authenticated membership and validates inputs with Zod; no action accepts a tenant ID from the browser.

Phase 3: `createCustomField`, `saveSocialLink`, `saveHours`, `uploadListingMedia`, `findDuplicateListings`, and `GET /api/admin/listings/export` are tenant-scoped. Media uploads validate type/size, write to private storage, then persist metadata with cleanup if persistence fails.

## Planned operations

Listings: `createListing`, `updateListing`, `deleteListing`, `publishListing`, `approveListing`, `rejectListing`, `suspendListing`, `archiveListing`, `bulkUpdateListings`, `duplicateCheck`, `getListing`, `listListings`.

Domains/categories: create, update, delete, reorder, and directory configuration workflows.

Later modules add imports, claims, media, advertising, payments, analytics, and platform administration as defined by the PRD.
