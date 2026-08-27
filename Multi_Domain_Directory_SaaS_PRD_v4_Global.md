# Global Multi-Domain Interactive Map & Directory Engine
## Multi-Tenant Directory SaaS Platform

**Document Version:** 4.0 — Global Edition  
**Target Release:** Q3 2026  
**Status:** Build-ready specification for AI-assisted development  
**Primary Stack:** Next.js App Router + TypeScript + Supabase + Tailwind CSS + shadcn/ui  
**Maps:** Leaflet with configurable tile/geocoding provider  
**Authentication:** Supabase Auth  
**Storage:** Supabase Storage  
**Payments:** Stripe and/or Razorpay  
**Deployment:** Vercel  
**Primary Development Model:** AI-agent-assisted development using Claude Code, Cursor, or similar tools

---

# 1. Executive Summary

The platform is a global multi-tenant SaaS directory and interactive map engine that allows independent operators to launch branded directories for a niche, industry, city, region, country, continent, or global community without building their own directory software.

Examples:

- Bangalore Startup Directory
- New York Restaurant Map
- London FinTech Directory
- Japan Manufacturing Cluster
- European Healthcare Provider Directory
- Global Clean-Tech Company Map

Each tenant receives an isolated directory instance with its own:

- Domain/vertical
- Branding
- Categories
- Listings
- Map configuration
- Listing moderation
- Featured listings
- Advertising inventory
- Analytics
- Monetization
- Administrators

The product must support both self-service onboarding and administrator-controlled listing creation.

## Core Product Objective

Build a scalable, low-operating-cost multi-tenant platform with strict tenant data isolation, an excellent listing-management experience, SEO-friendly public directories, and transaction-based monetization.

The most important product improvement in v4.0 is the addition of a complete **Admin + Listing Management System** capable of handling individual listings, bulk imports, moderation, duplicate detection, media, custom attributes, publishing workflows, claims, audit history, and monetization controls.

---

# 2. Product Goals

## 2.1 Primary Goals

1. Allow a tenant to launch a directory quickly.
2. Allow tenant administrators to add and manage listings efficiently.
3. Allow administrators to import hundreds or thousands of listings.
4. Provide a public map + directory browsing experience.
5. Provide SEO-friendly listing detail pages.
6. Support business-owner claims and self-management.
7. Support featured listings and advertising.
8. Support tenant-specific custom fields.
9. Maintain strict multi-tenant isolation using Supabase RLS.
10. Provide platform-level administration and analytics.
11. Make the entire product straightforward for AI coding agents to implement.

## 2.2 Secondary Goals

- Custom domains
- White-labeling
- Advanced analytics
- Multi-language support
- Listing syndication
- Directory templates
- Advanced search
- Business-owner subscriptions

## 2.3 Non-Goals for MVP

The following should not block the MVP:

- Native mobile apps
- Complex CRM functionality
- Full accounting software
- Advanced AI recommendation engine
- Custom map rendering engine
- Marketplace between tenants

---

# 3. Personas

| Persona | Description | Primary Capabilities |
|---|---|---|
| Platform Admin | Operates the SaaS | Manage tenants, plans, platform settings, payments, platform analytics |
| Tenant Owner | Owns a directory | Manage domains, listings, categories, branding, ads, analytics |
| Tenant Staff Admin | Works for a tenant | Manage listings, moderation, categories, media |
| Business Owner | Owns a listing | Claim listing, edit permitted fields, purchase upgrades |
| Directory Browser | Public visitor | Search, filter, map, view listings |
| Sponsor/Advertiser | Pays for advertising | Purchase/view ad placements and performance |

---

# 4. Product Architecture

## 4.1 Multi-Tenant Model

The hierarchy is:

```text
Platform
  └── Tenant
       ├── Domain / Directory
       │    ├── Categories
       │    ├── Listings
       │    │    ├── Media
       │    │    ├── Contacts
       │    │    ├── Hours
       │    │    ├── Attributes
       │    │    └── Claims
       │    ├── Ad Slots
       │    └── Analytics
       └── Tenant Users
```

Every tenant-scoped resource must be resolvable back to a `tenant_id`.

## 4.2 Routing

Primary:

```text
{tenant-slug}.yourplatform.com
```

Public directory:

```text
{tenant-slug}.yourplatform.com/{domain-slug}
```

Listing:

```text
{tenant-slug}.yourplatform.com/{domain-slug}/listing/{listing-slug}
```

Admin:

```text
{tenant-slug}.yourplatform.com/admin
```

Platform admin:

```text
app.yourplatform.com/platform-admin
```

Custom domain support is a Phase 2 capability.

---



# 3A. Global-First Product Requirements

The platform must be designed as a global product from the first production release. India is one supported market, not the default data model.

## 3A.1 Geographic Scope

A directory may target:

- Global
- Continent
- Country
- State/province/region
- City/metro
- Custom geographic area

Geographic scope must be configurable and must not be mandatory for every directory.

Examples:

```text
Global AI Startup Directory
European Climate-Tech Map
United States Healthcare Directory
California Restaurant Map
London FinTech Directory
Bangalore Startup Map
```

## 3A.2 International Location Model

Listings must support:

- Country
- ISO 3166-1 country code
- Address line 1
- Address line 2
- Locality/neighborhood
- City
- Administrative area/state/province/region
- Postal/ZIP code
- Latitude
- Longitude
- Time zone

Do not assume Indian concepts such as state + PIN code are universally applicable.

## 3A.3 International Phone Numbers

Phone numbers must support international formatting.

Store country calling code and normalized phone number separately where practical.

The UI must format numbers according to the selected/known country.

## 3A.4 Currency

All monetary records must store:

```text
amount
currency
```

Do not hard-code INR or USD into business logic.

The platform should support configurable currencies such as:

- USD
- EUR
- GBP
- INR
- CAD
- AUD
- SGD
- JPY

Financial reporting may additionally use a configurable platform reporting currency.

## 3A.5 Time Zones

All timestamps must be stored consistently in UTC at the persistence layer.

Directories and listings may have an associated IANA time zone, for example:

```text
Asia/Kolkata
America/New_York
Europe/London
Asia/Tokyo
```

Use local time-zone conversion for:

- Opening hours
- Scheduled publishing
- Featured expiry
- Advertising campaigns
- Notifications
- Analytics

## 3A.6 Internationalization

The application must use an i18n architecture from the beginning.

English is the initial default language.

The architecture must allow additional languages without changing application business logic.

Potential launch/future languages:

- English
- Spanish
- French
- German
- Portuguese
- Hindi
- Japanese
- Arabic

All user-facing strings should come from translation resources rather than being embedded throughout components.

## 3A.7 Right-to-Left Support

The UI architecture should be compatible with RTL languages.

Arabic support may be enabled after the initial English launch, but layout decisions must not make RTL impossible.

## 3A.8 Address and Geocoding Abstraction

Implement a provider abstraction:

```text
GeocodingService
  geocode(address)
  reverseGeocode(latitude, longitude)
  autocomplete(query)
```

The application must not couple business logic directly to one geocoding vendor.

Potential providers:

- OpenStreetMap/Nominatim
- Mapbox
- MapTiler
- Other compliant providers

Provider credentials must remain server-side.

## 3A.9 Map Provider Abstraction

Implement:

```text
MapProvider
  getTileConfiguration()
  geocode()
  reverseGeocode()
  searchPlaces()
```

The tile/geocoding provider must be configurable by environment/platform settings.

This prevents the product from becoming permanently dependent on one vendor.

## 3A.10 Global Search and Geography

Public search must support combinations such as:

```text
AI startups in Berlin
Restaurants in Tokyo
Manufacturers in Germany
Healthcare providers near Toronto
FinTech companies in London
```

MVP may implement structured filters rather than natural-language search. The data model must not prevent later semantic search.


# 5. Roles and Permissions

## 5.1 Platform Admin

Can:

- Create/edit/suspend tenants
- View all tenants
- View all domains
- View all listings
- Manage plans
- Manage platform settings
- View platform-wide revenue
- View commissions
- View system health
- Impersonate tenant admin through a secure audited mechanism
- Manage platform-level categories/templates
- Manage payment configuration

## 5.2 Tenant Owner

Can:

- Manage their domains
- Manage tenant users
- Add/edit/delete listings
- Bulk import listings
- Moderate submissions
- Approve claims
- Manage categories
- Manage custom listing fields
- Manage branding
- Manage featured listings
- Manage advertisements
- View tenant analytics
- View tenant revenue
- Configure directory settings

## 5.3 Tenant Staff Admin

Configurable permissions:

- `listing.read`
- `listing.create`
- `listing.update`
- `listing.delete`
- `listing.publish`
- `listing.moderate`
- `listing.import`
- `category.manage`
- `claim.manage`
- `media.manage`
- `analytics.read`
- `ads.manage`

Tenant Owner can grant/revoke staff permissions.

## 5.4 Business Owner

Can:

- View owned listings
- Edit permitted listing fields
- Upload permitted media
- Request verification
- Request category changes
- Purchase listing upgrades
- View their upgrade history

Business owners cannot modify tenant configuration.

---


# 5A. Directory Builder

The platform's core SaaS value is that tenants can create and configure directories without changing application code.

## 5A.1 Create Directory Wizard

```text
Create Directory
  ↓
Basic Information
  ↓
Geographic Scope
  ↓
Categories
  ↓
Custom Fields
  ↓
Map Configuration
  ↓
Branding
  ↓
SEO
  ↓
Monetization
  ↓
Publish
```

## 5A.2 Directory Configuration

Tenant can configure:

- Directory name
- Slug
- Description
- Logo
- Favicon
- Geographic scope
- Default map center/zoom
- Categories
- Custom fields
- Listing limits
- Search/filter settings
- Branding
- SEO defaults
- Monetization
- Default language
- Supported languages
- Default currency
- Default time zone

## 5A.3 Directory Templates

Future templates may preconfigure:

- Categories
- Custom fields
- Listing attributes
- Search filters
- SEO defaults
- Branding suggestions

Example templates:

```text
Startup Directory
Restaurant Directory
Healthcare Directory
School Directory
Manufacturing Directory
Real Estate Directory
Events Directory
Custom Directory
```

# 5B. Global Directory Discovery

The platform itself may expose a public directory-of-directories.

Example:

```text
Discover Directories
  ├── By Country
  ├── By City
  ├── By Industry
  ├── By Category
  └── Global Directories
```

A directory can be:

- Publicly discoverable
- Unlisted
- Private

Public discovery can display:

- Directory name
- Description
- Geography
- Industry
- Listing count
- Language
- Featured status

This is a platform-level discovery layer and is separate from the tenant's own directory.


# 6. Admin Module

The Admin Module is a first-class product area, not merely a collection of CRUD pages.

## 6.1 Admin Navigation

```text
Dashboard

Listings
  ├── All Listings
  ├── Add Listing
  ├── Drafts
  ├── Pending Review
  ├── Published
  ├── Rejected
  ├── Suspended
  ├── Featured
  ├── Verified
  └── Import

Moderation
  ├── Submissions
  └── Claims

Categories

Custom Fields

Media

Domains

Advertising
  ├── Ad Slots
  ├── Campaigns
  └── Performance

Payments
  ├── Transactions
  └── Payouts

Analytics

Team

Activity Log

Settings
```

---

# 7. Admin Dashboard

The tenant dashboard must provide an operational summary.

## 7.1 KPI Cards

Display:

- Total Listings
- Published
- Draft
- Pending Review
- Rejected
- Suspended
- Featured
- Verified
- Unclaimed
- Claims Pending

## 7.2 Growth Metrics

Display:

- Listings added today
- Listings added this week
- Listings added this month
- Public submissions
- Claims
- Listing views
- Search activity
- Featured listing revenue
- Advertising revenue

## 7.3 Quick Actions

Buttons:

- Add Listing
- Import Listings
- Review Submissions
- Review Claims
- Add Category
- Create Ad Slot

## 7.4 Recent Activity

Show latest administrative activity with:

- User
- Action
- Entity
- Timestamp
- Result

---

# 8. Listing Management System

## 8.1 Listing Lifecycle

Use:

```text
draft
pending_review
approved
published
rejected
suspended
archived
```

Workflow:

```text
Create
  ↓
Draft
  ↓
Review
  ↓
Approved
  ↓
Published
  ↓
Suspended / Archived
```

Direct tenant-admin creation can bypass moderation and move directly to approved/published based on tenant settings.

## 8.2 Listing List

Admin listing table must support:

- Search
- Pagination
- Sorting
- Column selection
- Filters
- Bulk actions

Recommended columns:

- Checkbox
- Logo
- Business Name
- Category
- Location
- Status
- Verified
- Featured
- Claimed
- Views
- Updated
- Actions

## 8.3 Filters

Support:

- Status
- Category
- Sub-category
- Verified
- Featured
- Claimed
- Unclaimed
- Created date
- Updated date
- City
- Area
- Data completeness
- Owner

## 8.4 Bulk Actions

Admin can:

- Approve
- Reject
- Publish
- Unpublish
- Suspend
- Archive
- Delete
- Mark verified
- Remove verification
- Mark featured
- Remove featured
- Change category
- Change status
- Export selected

Destructive actions require confirmation.

---

# 9. Add/Edit Listing

The listing form should be divided into logical sections.

## 9.1 Basic Information

Required:

- Business/organization name
- Category
- Address

Optional:

- Short description
- Full description
- Sub-category
- Tags
- Business type
- Established year

## 9.2 Contact Information

- Phone
- Alternate phone
- Email
- Website
- WhatsApp
- Contact person

## 9.3 Location

- Address
- Area
- City
- State
- Country
- Postal code
- Latitude
- Longitude

Features:

- Address autocomplete
- Geocoding
- Map picker
- Drag marker
- Reverse geocoding where supported

Never trust arbitrary client-provided coordinates without validation.

## 9.4 Media

- Logo
- Cover image
- Gallery
- Documents
- Video URL

Media must be stored in Supabase Storage.

## 9.5 Social Links

Support configurable links such as:

- Facebook
- Instagram
- LinkedIn
- YouTube
- X
- TikTok

Do not hard-code the complete list into the database architecture.

## 9.6 Opening Hours

Support:

- Monday-Sunday
- Closed
- Open/close time
- Multiple intervals per day
- 24 hours
- Holiday overrides

## 9.7 SEO

Each listing can have:

- SEO title
- Meta description
- SEO slug
- Canonical URL
- Social image
- Index/noindex option

Defaults should be generated automatically from listing information.

## 9.8 Publishing

Admin can configure:

- Status
- Published/unpublished
- Featured
- Verified
- Priority
- Publish date
- Expiry date

---

# 10. Dynamic Custom Fields

This is a critical feature for a multi-domain directory.

Tenant admins can create fields for their domain.

Example: Restaurant:

```text
Cuisine
Price Range
Vegetarian
Delivery
Parking
Reservations
```

Example: Startup:

```text
Founded Year
Industry
Funding Stage
Employee Count
Funding Amount
Headquarters
```

Example: Manufacturer:

```text
Product Types
Manufacturing Capacity
Certifications
Export Markets
MOQ
```

## 10.1 Custom Field Types

Support:

- Text
- Long text
- Number
- Currency
- Boolean
- Date
- Select
- Multi-select
- URL
- Email
- Phone
- Image
- File

## 10.2 Custom Field Configuration

Each field should support:

- Label
- Internal key
- Description
- Field type
- Required
- Public visibility
- Searchable
- Filterable
- Sortable
- Display order
- Options
- Validation rules

---

# 11. Duplicate Detection

Duplicate detection should happen during:

- Manual creation
- Editing
- CSV import
- Public submission

Possible matching signals:

- Business name similarity
- Phone
- Website
- Email
- Address
- Geographic proximity

Admin sees:

```text
Possible duplicate found

ABC Engineering Pvt Ltd
2.3 km away
Same phone number

[View Existing] [Continue Anyway]
```

The system should never silently delete or merge records.

Future enhancement:

- Listing merge workflow
- Merge history
- Field-level conflict resolution

---

# 12. Bulk Import

Bulk import is required for practical directory seeding.

## 12.1 Import Wizard

```text
Step 1: Upload CSV
Step 2: Map Columns
Step 3: Validate
Step 4: Review
Step 5: Import
Step 6: Results
```

## 12.2 Supported Initial Columns

- Name
- Description
- Category
- Sub-category
- Address
- City
- State
- Country
- Postal code
- Website
- Phone
- Email
- Latitude
- Longitude

Custom fields should also be mappable.

## 12.3 Validation

Detect:

- Missing required fields
- Invalid URLs
- Invalid email
- Invalid phone
- Unknown category
- Duplicate
- Geocoding failure
- Unsupported field values

## 12.4 Import Results

Show:

- Total rows
- Successful
- Failed
- Duplicates
- Warnings

Allow:

**Download Error CSV**

## 12.5 Import Jobs

Large imports must be processed asynchronously.

Use an import job record:

```text
queued
processing
completed
completed_with_errors
failed
cancelled
```

Display progress.

---

# 13. Export

Tenant admins can export:

- All listings
- Filtered listings
- Selected listings

Formats:

- CSV initially
- JSON as optional API export

Export must respect tenant permissions and never expose another tenant's data.

---

# 14. Moderation

Public submissions enter:

```text
pending_review
```

Moderators can:

- Approve
- Reject
- Edit and approve
- Request changes
- Suspend

Rejection should support an optional reason.

Notifications may be sent to the submitter.

---

# 15. Listing Claims

Business owners can claim an existing unclaimed listing.

Workflow:

```text
Business Owner
   ↓
Request Claim
   ↓
Tenant Review
   ↓
Approve / Reject
   ↓
Owner Linked
```

Claim data should include:

- User
- Listing
- Submitted information
- Supporting information
- Status
- Reviewer
- Review timestamp
- Review note

---

# 16. Verification

Verification should be separate from approval.

Possible states:

```text
unverified
pending
verified
rejected
```

Verification can later support:

- Phone verification
- Email verification
- Website verification
- Business document verification
- Manual admin verification

For MVP, manual tenant-admin verification is sufficient.

---

# 17. Media Management

Create a reusable media system.

## 17.1 Media Types

- Logo
- Cover
- Gallery
- Document
- Video thumbnail

## 17.2 Requirements

- Upload
- Delete
- Reorder
- Set primary
- Alt text
- File metadata
- Storage path
- MIME type
- Size validation

Images should be optimized before public delivery where practical.

---

# 18. Activity and Audit Logs

Every important administrative mutation must create an audit event.

Examples:

- Listing created
- Listing edited
- Listing published
- Listing rejected
- Listing deleted
- Category changed
- Verification changed
- Featured status changed
- Claim approved
- Import started
- Import completed
- User permission changed

Audit record:

```text
id
tenant_id
actor_user_id
action
entity_type
entity_id
old_values
new_values
metadata
created_at
```

Audit logs should be append-only.

---

# 19. Public Directory

## 19.1 Landing Page

Display:

- Tenant branding
- Domain name
- Search
- Category navigation
- Featured listings
- Map
- Directory count
- Optional promotional banner

## 19.2 Map + Directory

Desktop:

```text
┌──────────────────────┬───────────────────────┐
│ Search + Filters     │                       │
│                      │                       │
│ Listing Cards        │       Map             │
│                      │                       │
│ Listing Cards        │                       │
└──────────────────────┴───────────────────────┘
```

Mobile:

- Search
- Filters
- List / Map tabs

## 19.3 Filters

At minimum:

- Category
- Sub-category
- Verified
- Featured
- Location
- Custom filter fields

## 19.4 Listing Card

Display:

- Logo/image
- Name
- Category
- Short description
- Location
- Verified badge
- Featured badge
- CTA

---

# 20. Listing Detail Page

Each listing gets a dedicated SSR page.

Include:

- Name
- Logo
- Cover image
- Gallery
- Description
- Category
- Address
- Map
- Contact information
- Website
- Social links
- Hours
- Custom attributes
- Verification status
- Claim button
- Featured indicator
- Related listings

SEO:

- Title
- Description
- Open Graph
- JSON-LD
- Canonical URL

---

# 21. Search

MVP search should support:

- Listing name
- Category
- Location
- Custom searchable fields

Search should tolerate basic spelling differences where the chosen database/search provider supports it.

Future:

- Full-text ranking
- Typo tolerance
- AI semantic search

---

# 22. Categories

Tenant admins can:

- Create
- Edit
- Delete
- Reorder
- Nest categories
- Assign listing counts

Category fields:

```text
id
domain_id
parent_category_id
name
slug
description
icon
image
sort_order
is_active
created_at
updated_at
```

Prevent deletion when active listings depend on a category unless reassignment is performed.

---

# 23. Branding

Each domain supports:

- Logo
- Favicon
- Primary color
- Secondary color
- Typography configuration where supported
- Header style
- Footer content
- Directory title
- Description
- Social links

Free tier retains platform branding.

Growth/Pro can progressively remove platform branding.

---

# 24. Advertising

Ad slot types:

- 24-hour flash banner
- 7-day header banner
- Featured pin
- Featured listing placement

Tenant controls:

- Slot price
- Availability
- Duration
- Campaign
- Sponsor
- Target URL
- Banner

Payment is processed through Stripe/Razorpay.

Platform commission is recorded at transaction time.

---

# 25. Listing Upgrades

Business owners may purchase:

- Featured
- Verified
- Priority

Each purchase creates a `listing_upgrade`.

The system must record:

- Price
- Commission
- Tenant payout
- Payment reference
- Start date
- End date
- Status

---

# 26. Analytics

## 26.1 Tenant Analytics

Track:

- Listing views
- Search impressions
- Map interactions
- Website clicks
- Phone clicks
- WhatsApp clicks
- Claim requests
- Listing submissions
- Featured impressions
- Ad impressions
- Ad clicks
- Revenue

## 26.2 Platform Analytics

Platform admin sees:

- Total tenants
- Active tenants
- Total domains
- Total listings
- Listings created
- Public traffic
- Transaction volume
- Gross revenue
- Platform commission
- Tenant payouts
- Add-on revenue
- Growth trends

---

# 27. Database Schema

## Core Tables


### countries

Reference data for supported countries.

```text
id
iso_code
iso3_code
name
native_name
phone_code
default_currency
default_timezone
is_active
```

### geographic_areas

Optional normalized geographic reference data.

```text
id
country_id
parent_area_id
type
name
code
latitude
longitude
```

Do not require this table for every address. It supports structured discovery where available.

### currencies

```text
code
name
symbol
decimal_digits
is_active
```

### directory_languages

```text
domain_id
language_code
is_default
is_enabled
```

### directory_settings

```text
domain_id
default_currency
default_timezone
default_language
supported_languages
geographic_scope_type
geographic_scope_json
settings_json
```

### tenants

```text
id
name
slug
owner_user_id
addon_plan_id
billing_customer_id
addon_status
custom_domain
status
created_at
updated_at
```

### tenant_users

```text
id
tenant_id
user_id
role
permissions_json
status
created_at
updated_at
```

### domains

```text
id
tenant_id
name
slug
logo_url
favicon_url
theme_config
description
default_lat
default_lng
default_zoom
status
created_at
updated_at
```

### categories

```text
id
domain_id
parent_category_id
name
slug
description
icon
image_url
sort_order
is_active
created_at
updated_at
```

### listings

```text
id
domain_id
category_id
owner_user_id
title
slug
short_description
description
address
area
city
state
country
postal_code
country_id
timezone
latitude
longitude
website
phone
email
whatsapp
status
verification_status
is_featured
priority
published_at
expires_at
created_at
updated_at
```

### listing_attributes

```text
id
listing_id
field_id
value_text
value_number
value_boolean
value_date
value_json
created_at
updated_at
```

### custom_fields

```text
id
domain_id
name
key
description
field_type
is_required
is_public
is_searchable
is_filterable
is_sortable
options_json
validation_json
sort_order
created_at
updated_at
```

### listing_media

```text
id
listing_id
type
storage_path
public_url
mime_type
file_size
alt_text
sort_order
is_primary
created_at
```

### listing_hours

```text
id
listing_id
day_of_week
is_closed
is_24_hours
open_time
close_time
sort_order
```

### listing_social_links

```text
id
listing_id
platform
url
```

### listing_claims

```text
id
listing_id
user_id
status
submitted_at
reviewed_at
reviewed_by
review_note
```

### listing_submissions

```text
id
domain_id
submitted_by_user_id
submitted_email
payload_json
status
review_note
reviewed_by
submitted_at
reviewed_at
```

### listing_audit_logs

```text
id
tenant_id
actor_user_id
action
entity_type
entity_id
old_values
new_values
metadata
created_at
```

### import_jobs

```text
id
tenant_id
domain_id
created_by
file_path
status
total_rows
processed_rows
success_count
failure_count
duplicate_count
error_file_path
started_at
completed_at
created_at
```

### ad_slots

```text
id
domain_id
listing_id
slot_type
sponsor_name
banner_url
target_url
start_date
end_date
status
price_paid
platform_commission_amount
tenant_payout_amount
payment_id
created_at
```

### ad_events

```text
id
ad_slot_id
event_type
occurred_at
metadata
```

### listing_upgrades

```text
id
listing_id
upgrade_type
price_paid
platform_commission_amount
tenant_payout_amount
start_date
end_date
payment_id
status
created_at
```

### payments

```text
id
tenant_id
type
amount
currency
gateway
gateway_ref
status
metadata
created_at
```

### users

Supabase Auth user plus application profile/role information.

---

# 28. Data Integrity Rules

1. Every tenant-scoped record must resolve to a tenant.
2. Domain must belong to tenant.
3. Category must belong to domain.
4. Listing must belong to domain.
5. Listing category must belong to the same domain.
6. Listing owner must have appropriate access.
7. Media must belong to a listing within the same tenant.
8. Claims must reference an existing listing.
9. Payments must reference a valid tenant where applicable.
10. Slugs must be unique within their relevant scope.
11. Deleted listings should preferably be soft-deleted/archived rather than immediately destroyed.
12. Audit records must not be editable through normal application APIs.

---

# 29. Supabase RLS

RLS is mandatory.

Tenant users can only access records belonging to their tenant.

Example conceptual rule:

```sql
tenant_id = auth.jwt() ->> 'tenant_id'
```

Do not expose Supabase service-role keys to browsers.

Platform admin operations requiring cross-tenant access must execute server-side.

RLS tests must explicitly verify:

```text
Tenant A cannot read Tenant B listings
Tenant A cannot update Tenant B listings
Tenant A cannot delete Tenant B listings
Tenant A cannot read Tenant B payments
Tenant A cannot read Tenant B audit logs
```

---

# 30. API / Server Action Requirements

Prefer Next.js server actions or route handlers for sensitive operations.

Required operations:

## Listings

```text
createListing
updateListing
deleteListing
publishListing
unpublishListing
approveListing
rejectListing
suspendListing
archiveListing
bulkUpdateListings
duplicateCheck
getListing
listListings
```

## Import

```text
createImportJob
validateImport
processImport
getImportStatus
downloadImportErrors
```

## Claims

```text
submitClaim
approveClaim
rejectClaim
```

## Categories

```text
createCategory
updateCategory
deleteCategory
reorderCategories
```

## Media

```text
createUploadUrl
saveMedia
deleteMedia
reorderMedia
```

All mutations must validate:

- Authentication
- Tenant membership
- Permission
- Input schema
- Resource ownership
- Domain ownership

Use a schema-validation library such as Zod.

---

# 31. Recommended Application Structure

```text
app/
  (public)/
    [domain]/
      page.tsx
      listing/[slug]/page.tsx

  admin/
    page.tsx
    listings/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      import/page.tsx
    categories/
    moderation/
    claims/
    custom-fields/
    media/
    domains/
    advertising/
    payments/
    analytics/
    team/
    activity/
    settings/

  platform-admin/
    tenants/
    plans/
    payments/
    analytics/
    settings/

components/
  admin/
  directory/
  listings/
  map/
  forms/
  tables/
  charts/

lib/
  auth/
  db/
  permissions/
  validation/
  geocoding/
  payments/
  storage/
  analytics/

supabase/
  migrations/
  seed/
  tests/
```

---

# 32. UI/UX Requirements

Use Tailwind CSS and shadcn/ui.

Admin UI should prioritize:

- Fast navigation
- Dense but readable data tables
- Clear status badges
- Keyboard-friendly forms
- Responsive layouts
- Confirmation dialogs for destructive actions
- Toast notifications
- Loading states
- Empty states
- Error states
- Skeleton loaders

Listing form should support autosave for drafts where practical.

Unsaved changes must be detected.

---

# 33. Validation

Required validation examples:

- Name cannot be blank.
- Slug must be URL-safe.
- Category must belong to current domain.
- Email must be valid.
- Website must be a valid URL.
- Coordinates must be valid ranges.
- Image size/type must be restricted.
- Required custom fields must be present.
- Duplicate warning must be displayed where applicable.

Server-side validation is mandatory even if client-side validation exists.

---

# 34. Notifications

MVP notifications:

- Listing submission received
- Listing approved
- Listing rejected
- Claim received
- Claim approved
- Claim rejected
- Import completed
- Import failed
- Payment successful

Email provider can be selected later.

In-app notification architecture should be designed so email/push channels can be added without redesigning business logic.

---

# 35. Security

Mandatory:

- Supabase RLS
- Server-side authorization
- Secure cookies/session handling
- CSRF protection where applicable
- Rate limiting
- Upload validation
- File type validation
- Payment webhook signature verification
- Input sanitization
- Audit logging
- No service keys client-side
- No trusting client-supplied tenant IDs

Public submission endpoints require rate limiting and anti-spam controls.

---

# 36. SEO

Every public domain:

- SSR
- Sitemap
- Robots configuration
- Canonical URLs
- Open Graph
- Structured data

Every listing:

```text
LocalBusiness
```

or a more appropriate schema type when the vertical supports one.

Category pages should also be indexable where valuable.

---

# 37. Performance

Targets:

- Initial public page load under 1.5 seconds where infrastructure and network conditions permit.
- Lazy-load map tiles.
- Optimize images.
- Paginate admin tables.
- Avoid loading thousands of listings into the browser.
- Use server-side filtering/pagination.
- Cache suitable public queries.
- Debounce search.
- Use background processing for bulk imports.

Map provider configuration must not be hard-coded.

---

# 38. Billing and Monetization

Initial model:

| Tier | Cost | Domains | Listings/Domain | Custom Domain | Branding | Commission |
|---|---:|---:|---:|---|---|---:|
| Free | $0 | 1 | 50 | No | Platform | 20% |
| Growth | Paid | 3 | 500 | No | Platform | 15% |
| Pro | Paid | Unlimited | Unlimited | Yes | White-label | 10% |

These are placeholders and must remain configurable.

Tenant subscription is optional.

Transaction commissions are the primary platform revenue mechanism.

---

# 39. Platform Admin

Platform Admin dashboard must include:

### Tenants

- Search
- Filter
- Create
- Suspend
- Reinstate
- View usage
- View billing

### Platform Metrics

- Tenants
- Active tenants
- Listings
- Domains
- Transactions
- Commission
- Add-on revenue
- Traffic

### Health

- Failed imports
- Failed payments
- Webhook failures
- Geocoding failures
- Storage usage
- Error rate

---

# 40. Platform Configuration

Platform Admin can configure:

- Default commission rate
- Plans
- Listing caps
- Domain caps
- Feature flags
- Map provider
- Geocoding provider
- Payment gateway
- Upload limits
- Reserved slugs
- Platform branding

---

# 41. Feature Flags

Introduce feature flags for gradual rollout.

Examples:

```text
custom_domains
advanced_analytics
listing_upgrades
ads
business_claims
bulk_import
custom_fields
white_label
```

Feature flags can exist at:

- Platform level
- Plan level
- Tenant level

---

# 42. Error Handling

Every feature must have:

- Loading state
- Empty state
- Validation errors
- Server errors
- Retry option where meaningful
- User-friendly messages
- Developer logging

Never expose internal database errors to end users.

---

# 43. Testing Strategy

## Unit Tests

Test:

- Validation
- Permission checks
- Slug generation
- Duplicate detection
- Commission calculation
- Status transitions

## Integration Tests

Test:

- Listing CRUD
- Imports
- Claims
- Payments
- Media
- Geocoding

## RLS Tests

Critical:

- Cross-tenant read denied
- Cross-tenant write denied
- Cross-tenant delete denied

## E2E Tests

Minimum journeys:

1. Tenant signup
2. Domain creation
3. Category creation
4. Admin listing creation
5. Listing publication
6. Public search
7. Listing detail
8. Public submission
9. Moderation
10. Claim
11. CSV import
12. Featured upgrade
13. Advertisement purchase

---

# 44. Seed Data

Development seed should create:

```text
1 platform admin
2 tenants
2 domains per tenant
Multiple categories
50+ listings
Several pending submissions
Several claims
Featured listings
Verified listings
Sample advertisements
Sample payments
```

Seed data must intentionally test tenant isolation.

---

# 45. AI-Agent Development Rules

This project is specifically intended to be built with AI coding agents.

The repository must contain:

```text
AGENTS.md
README.md
ARCHITECTURE.md
DATABASE.md
API.md
SECURITY.md
TESTING.md
```

## AI Development Rules

1. Never modify database schema without creating a migration.
2. Never bypass RLS for convenience.
3. Never expose secrets to client code.
4. Every new feature requires validation.
5. Every mutation requires authorization.
6. Every important mutation should create an audit event.
7. Reuse existing components before creating duplicates.
8. Do not duplicate business logic between server actions and API routes.
9. Keep domain-specific logic configurable.
10. Add tests for every security-sensitive feature.
11. Do not silently change existing behavior.
12. Update documentation when architecture changes.

AI agents should work in small, verifiable increments.

---

# 46. Recommended Development Sequence

## Phase 0 — Project Setup

- Repository
- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- ESLint
- Prettier
- Environment configuration
- Supabase connection
- CI


## Phase 0A — Global Foundations

Before feature development:

- Define country/currency/language/time-zone reference models.
- Establish UTC timestamp policy.
- Establish locale-aware formatting.
- Establish international address model.
- Establish phone normalization strategy.
- Establish map/geocoding provider interfaces.
- Establish currency/payment abstraction.
- Establish i18n resource structure.
- Establish Unicode-safe search and slug behavior.

## Phase 1 — Foundation

- Supabase schema
- Auth
- User profiles
- Tenant model
- Tenant membership
- RLS
- Subdomain middleware
- Basic layout

## Phase 2 — Admin Core

- Admin dashboard
- Domain management
- Category management
- Listing CRUD
- Listing status
- Permissions
- Audit logs

## Phase 3 — Advanced Listing Management

- Custom fields
- Media
- Hours
- Social links
- Duplicate detection
- Listing preview
- Bulk actions
- Export

## Phase 4 — Public Directory

- Map
- Search
- Filters
- Listing cards
- Detail pages
- SEO
- Responsive UI

## Phase 5 — Submission and Claims

- Public submissions
- Moderation
- Claims
- Verification
- Notifications

## Phase 6 — Bulk Import

- CSV upload
- Column mapping
- Validation
- Geocoding
- Background jobs
- Error reports

## Phase 7 — Monetization

- Ad slots
- Listing upgrades
- Payment integration
- Webhooks
- Commission calculations
- Revenue dashboards

## Phase 8 — Platform Admin

- Tenant management
- Plans
- Platform analytics
- Billing health
- System health

## Phase 9 — Hardening

- Security testing
- RLS tests
- E2E tests
- Performance optimization
- SEO validation
- Error monitoring
- Production deployment

---

# 47. MVP Definition of Done

The MVP is complete when a new tenant can:

```text
Signup
  ↓
Receive directory
  ↓
Create domain
  ↓
Create categories
  ↓
Add listings
  ↓
Import listings
  ↓
Publish listings
  ↓
See listings on map
  ↓
Search/filter listings
  ↓
Open SEO listing pages
  ↓
Receive public submissions
  ↓
Moderate submissions
  ↓
Approve claims
  ↓
Sell featured listings
```

And the platform admin can:

```text
Manage tenants
View platform metrics
Manage plans
View transactions
View commissions
Suspend tenants
Monitor system health
```

---


## 47A. Global MVP Definition

The MVP must work for at least multiple countries without code changes to the core listing model.

A tenant must be able to create, for example:

```text
United States Startup Directory
United Kingdom Restaurant Directory
India Manufacturing Directory
Japan Technology Directory
Global Climate-Tech Directory
```

The application must correctly handle each directory's:

- Country
- Address format
- Currency
- Time zone
- Language configuration
- Map location
- Listing data

# 48. Future Enhancements

## Phase 2+

- Custom domains
- White-labeling
- Multi-language support
- Directory templates
- AI-assisted listing generation
- AI duplicate detection
- AI category recommendation
- Semantic search
- Review/rating system
- Business-owner dashboards
- Listing subscriptions
- Lead generation
- CRM integration
- WhatsApp integration
- Google Business import
- External directory import
- Listing syndication
- API access
- Webhooks
- Mobile applications

---


## Global Expansion Enhancements

- Country-specific payment providers
- Local tax configuration
- VAT/GST/sales-tax support
- Regional privacy/compliance configuration
- Automatic locale detection
- Multi-language content management
- Translation assistance
- Global directory marketplace
- Cross-directory listing syndication
- International business verification
- Global SEO landing-page generator

# 49. Product Principles

The implementation should follow these principles:

### Admin First

A directory with no efficient administration becomes a data graveyard. Listing management must be fast and scalable.

### Global and Multi-Tenant by Design

Tenant isolation must exist at database, server, API, and UI levels. Country, language, currency, and geography must also be first-class configuration rather than assumptions.

### Configurable Over Hard-Coded

Domain-specific requirements should be represented through configuration and custom fields wherever possible.

### SEO by Default

Public listings should be designed as discoverable web pages, not only map popups.

### Monetization Without Blocking Adoption

Free onboarding remains frictionless. Revenue comes from successful transactions and optional upgrades.

### Automation Where It Saves Time

Bulk import, geocoding, duplicate detection, generated SEO metadata, and background jobs should reduce repetitive administrative work.

### AI-Agent Friendly

Architecture, database migrations, permissions, validation, tests, and documentation must be explicit enough for an AI coding agent to work safely.

---

# 50. Final Recommended Build Architecture

```text
                         ┌─────────────────────┐
                         │     Platform Admin   │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Multi-Tenant SaaS │
                         │       Platform      │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
      ┌──────▼──────┐       ┌───────▼──────┐       ┌──────▼──────┐
      │   Tenant A  │       │   Tenant B   │       │   Tenant C  │
      └──────┬──────┘       └───────┬──────┘       └──────┬──────┘
             │                      │                      │
       ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
       │  Domains  │          │  Domains  │          │  Domains  │
       └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
             │                      │                      │
       ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
       │ Categories│          │ Categories│          │ Categories│
       └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
             │                      │                      │
       ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
       │ Listings  │          │ Listings  │          │ Listings  │
       └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
             │                      │                      │
       ┌─────▼──────────────────────▼──────────────────────▼─────┐
       │              Supabase + PostgreSQL + RLS                │
       │ Auth │ Storage │ Database │ Realtime │ Edge Functions  │
       └─────────────────────────────────────────────────────────┘
```

This v4.0 Global Edition specification keeps the original PRD's multi-tenant, free-onboarding, map/directory, moderation, claims, advertising, listing upgrades, and optional add-on model, while expanding the administration and listing layer into something much more suitable for a real production application. The original architecture already establishes Next.js + Supabase/RLS and transaction-based monetization, which this version retains. fileciteturn0file0L4-L8

The roadmap also deliberately moves **core listing administration earlier**, because the original specification already identifies direct tenant-admin listing creation as the primary seeding mechanism. fileciteturn0file0L87-L93

