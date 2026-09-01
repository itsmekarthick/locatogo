import Link from "next/link";
import { createListing } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminListingsTabbedView } from "@/components/admin-listings-tabbed-view";
import { AdminClearListingsButton } from "@/components/admin-clear-listings-button";

export default async function ListingsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const [{ data: domains }, { data: categories }, { data: listings }] = await Promise.all([
    supabase.from("domains").select("id, name").eq("tenant_id", tenant.id).order("name"),
    supabase.from("categories").select("id, name, domain_id, sort_order").eq("tenant_id", tenant.id).order("sort_order"),
    supabase
      .from("listings")
      .select("id, title, slug, status, locality, city, latitude, longitude, is_featured, category_id, updated_at")
      .eq("tenant_id", tenant.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(500),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Content & Places</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Listings Directory</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Create, edit coordinates, and manage places organized with category tabs across your directories.
          </p>
        </div>

        <AdminClearListingsButton listingsCount={listings?.length ?? 0} />
      </div>

      {/* Creation Form with Explanatory Labels & Coordinates Fields */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Add a New Listing</h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Fill out the details and map coordinates below to place a listing on the atlas.
        </p>

        <form action={createListing} className="mt-6 space-y-6">
          {/* Section 1: Basic Identification */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Place / Business Title <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Official public name (e.g. "Edify School", "Narayana Hospital").</p>
              <input
                name="title"
                required
                placeholder="e.g. Edify School Chandapura"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Unique URL identifier (e.g. "edify-school-chandapura").</p>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. edify-school-chandapura"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Domain & Category Taxonomy */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory Domain / City Atlas <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">The atlas domain this listing belongs to (e.g. Bangalore, NY).</p>
              <select
                name="domainId"
                required
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              >
                {domains?.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Category <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Classification for map tabs, icons, and discovery filters.</p>
              <select
                name="categoryId"
                required
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              >
                <option value="">Choose category</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Geographic Location & Map Coordinates */}
          <div className="border-t border-[var(--line)] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">
                Location & Map Coordinates
              </h3>
              <span className="text-[11px] text-[var(--ink-muted)]">Coordinates power exact map pin placement</span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Street Address <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  name="addressLine1"
                  required
                  placeholder="e.g. Chandapura - Anekal Main Road"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Locality / Area
                </label>
                <input
                  name="locality"
                  placeholder="e.g. Chandapura"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  City
                </label>
                <input
                  name="city"
                  placeholder="e.g. Bangalore"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  State / Province
                </label>
                <input
                  name="administrativeArea"
                  placeholder="e.g. Karnataka"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Postal Code
                </label>
                <input
                  name="postalCode"
                  placeholder="e.g. 560099"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Latitude (GPS)
                </label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 12.7938"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-mono focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Longitude (GPS)
                </label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 77.7018"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-mono focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Contact & Overview */}
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">Contact & Overview</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Phone Number</label>
                <input
                  name="phone"
                  placeholder="e.g. +91 99000 55511"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Website URL</label>
                <input
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Contact Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="contact@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[var(--foreground)]">Short Description</label>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">1-2 sentences shown on map popups and directory cards.</p>
                <textarea
                  name="shortDescription"
                  rows={2}
                  placeholder="Premier CBSE institution offering 3C curriculum with STEM robotics labs and athletic complex."
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input name="isFeatured" type="checkbox" className="rounded" /> Feature this place on the map
            </label>
            <button
              disabled={!domains?.length || !categories?.length}
              className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] shadow transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              Add listing & Place on Map
            </button>
          </div>
        </form>
      </div>

      {/* Tabbed Category-Wise Places Directory */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">Places Directory</h2>
        <AdminListingsTabbedView
          listings={(listings as any) ?? []}
          categories={(categories as any) ?? []}
        />
      </section>
    </div>
  );
}
