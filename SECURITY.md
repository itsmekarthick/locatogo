# Security

## Non-negotiable controls

- Supabase RLS is enabled for tenant-scoped tables.
- Service-role credentials are server-only and never shipped to the browser.
- Authentication uses Supabase Auth with secure session handling.
- Authorization is checked server-side for every mutation.
- Client-supplied tenant IDs, roles, ownership, coordinates, prices, and status transitions are not trusted.
- Uploads validate MIME type, size, ownership, and storage path.
- Public submissions are rate-limited and receive anti-spam protection.
- Payment webhooks verify provider signatures before processing.
- Important changes create append-only audit records.
- Production responses include baseline content-type, framing, referrer, permissions, and content-security headers.
- User-facing errors are sanitized; detailed failures go to server-side logging.

Security-sensitive work requires unit/integration coverage plus explicit RLS tests before a phase is considered complete. Rate limiting and anti-spam controls for public submissions remain deployment work and must be enabled before production traffic.
