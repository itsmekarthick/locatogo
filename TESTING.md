# Testing

## Test layers

- Unit: validation, permission decisions, slug rules, status transitions, duplicate signals, and commission calculations.
- Integration: repositories and server workflows against Supabase test data.
- RLS: cross-tenant read/write/delete isolation, including payments and audit logs.
- E2E: signup, domain/category/listing creation, publication, public discovery, submission, moderation, claim, import, and featured purchase.

Each phase adds focused tests for the code it introduces. A phase is not complete until type checking, linting, and its relevant tests pass.

The Phase 1/2 pgTAP suite is at `supabase/tests/rls_phase1_phase2.sql`. It exercises table presence plus tenant A read/update/delete isolation. Run it with `supabase test db` after starting the local Supabase stack. In this environment the command is currently blocked because the local Postgres service is not running.

Phase 3 verification should additionally cover child-record isolation, private storage paths, audit insert behavior, upload rejection for unsupported MIME/size, duplicate candidates, and CSV escaping.

## Dummy
