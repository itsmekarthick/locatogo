"use client";

import { useState, useMemo } from "react";
import { ListingPreview } from "@/components/listing-preview";
import { OpeningHoursEditor } from "@/components/opening-hours-editor";
import { AdminDuplicateMergeModal, type DuplicateListingItem } from "@/components/admin-duplicate-merge-modal";

type ListingData = {
  id: string;
  domain_id: string;
  category_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  address_line_1: string;
  address_line_2: string | null;
  locality: string | null;
  city: string | null;
  administrative_area: string | null;
  country_code: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  verification_status: string;
  is_featured: boolean;
};

type Hour = {
  day_of_week: number;
  is_closed: boolean;
  is_24_hours: boolean;
  open_time: string;
  close_time: string;
};

type SocialLink = { platform: string; url: string };
type MediaItem = { id: string; media_type: string; mime_type: string | null; file_size: number | null; alt_text: string | null; public_url: string | null };
type AuditEntry = { action: string; created_at: string };
type Domain = { id: string; name: string; slug: string };
type Category = { id: string; name: string };

type Props = {
  listing: ListingData;
  domains: Domain[];
  categories: Category[];
  hours: Hour[];
  links: SocialLink[];
  media: MediaItem[];
  audit: AuditEntry[];
  duplicateCount: number;
  duplicates?: DuplicateListingItem[];
  updateAction: (formData: FormData) => Promise<void>;
  saveHoursAction: (formData: FormData) => Promise<void>;
  saveSocialLinkAction: (formData: FormData) => Promise<void>;
  uploadMediaAction: (formData: FormData) => Promise<void>;
};

const tabs = [
  { id: "basic", label: "Basic Info", icon: "📝" },
  { id: "location", label: "Location", icon: "📍" },
  { id: "contact", label: "Contact", icon: "📞" },
  { id: "hours", label: "Hours", icon: "🕐" },
  { id: "media", label: "Media", icon: "📷" },
  { id: "links", label: "Links", icon: "🔗" },
  { id: "publishing", label: "Publishing", icon: "🚀" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ListingEditForm({
  listing,
  domains,
  categories,
  hours,
  links,
  media,
  audit,
  duplicateCount,
  duplicates = [],
  updateAction,
  saveHoursAction,
  saveSocialLinkAction,
  uploadMediaAction,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [showPreview, setShowPreview] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Track form values for live preview
  const [title, setTitle] = useState(listing.title);
  const [slug, setSlug] = useState(listing.slug);
  const [shortDesc, setShortDesc] = useState(listing.short_description ?? "");
  const [phone, setPhone] = useState(listing.phone ?? "");
  const [website, setWebsite] = useState(listing.website ?? "");
  const [email, setEmail] = useState(listing.email ?? "");
  const [locality, setLocality] = useState(listing.locality ?? "");
  const [city, setCity] = useState(listing.city ?? "");
  const [adminArea, setAdminArea] = useState(listing.administrative_area ?? "");
  const [status, setStatus] = useState(listing.status);
  const [isFeatured, setIsFeatured] = useState(listing.is_featured);
  const [verificationStatus, setVerificationStatus] = useState(listing.verification_status);

  const categoryName = useMemo(() => {
    const cat = categories.find((c) => c.id === listing.category_id);
    return cat?.name ?? "";
  }, [categories, listing.category_id]);

  const previewData = useMemo(() => ({
    title,
    slug,
    shortDescription: shortDesc,
    category: categoryName,
    locality,
    city,
    state: adminArea,
    phone,
    website,
    email,
    status,
    isFeatured,
    verificationStatus,
  }), [title, slug, shortDesc, categoryName, locality, city, adminArea, phone, website, email, status, isFeatured, verificationStatus]);

  const domain = domains.find((d) => d.id === listing.domain_id);

  const inputClass = "mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none transition-colors";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]";
  const labelMutedClass = "block text-xs font-medium text-[var(--foreground)]";

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-ui ${
                activeTab === tab.id
                  ? "bg-[var(--foreground)] text-[var(--paper)] shadow-sm"
                  : "text-[var(--ink-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-ui ${
            showPreview
              ? "bg-[var(--coral)] text-white"
              : "border border-[var(--line)] text-[var(--ink-muted)] hover:bg-[var(--background)]"
          }`}
        >
          👁️ {showPreview ? "Hide" : "Preview"}
        </button>
      </div>

      {/* Main content: form + preview side by side */}
      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        {/* Form Panel */}
        <div className="space-y-6">
          {/* BASIC INFO TAB */}
          {activeTab === "basic" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Basic Information</h3>
              <form action={updateAction} className="mt-4 space-y-5">
                <input type="hidden" name="listingId" value={listing.id} />
                {/* Hidden fields for unchanged values */}
                <input type="hidden" name="addressLine1" value={listing.address_line_1} />
                <input type="hidden" name="locality" value={locality} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="administrativeArea" value={adminArea} />
                <input type="hidden" name="postalCode" value={listing.postal_code ?? ""} />
                <input type="hidden" name="latitude" value={listing.latitude ?? ""} />
                <input type="hidden" name="longitude" value={listing.longitude ?? ""} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="website" value={website} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="verificationStatus" value={verificationStatus} />
                {isFeatured && <input type="hidden" name="isFeatured" value="on" />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Place Title <span className="text-[var(--coral)]">*</span></label>
                    <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>URL Slug <span className="text-[var(--coral)]">*</span></label>
                    <input name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Category <span className="text-[var(--coral)]">*</span></label>
                    <select name="categoryId" required defaultValue={listing.category_id} className={`${inputClass} bg-[var(--background)]`}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Directory Domain / City Atlas <span className="text-[var(--coral)]">*</span></label>
                    <select name="domainId" required defaultValue={listing.domain_id} className={`${inputClass} bg-[var(--background)]`}>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} (/{d.slug})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelMutedClass}>Short Description</label>
                  <textarea name="shortDescription" rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelMutedClass}>Full Description</label>
                  <textarea name="description" rows={4} defaultValue={listing.description ?? ""} className={inputClass} />
                </div>

                <div className="flex justify-end pt-2">
                  <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-ui">
                    Save Basic Info
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* LOCATION TAB */}
          {activeTab === "location" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Location & Coordinates</h3>
              <form action={updateAction} className="mt-4 space-y-5">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="domainId" value={listing.domain_id} />
                <input type="hidden" name="title" value={title} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="categoryId" value={listing.category_id} />
                <input type="hidden" name="shortDescription" value={shortDesc} />
                <input type="hidden" name="description" value={listing.description ?? ""} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="website" value={website} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="verificationStatus" value={verificationStatus} />
                {isFeatured && <input type="hidden" name="isFeatured" value="on" />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Street Address <span className="text-[var(--coral)]">*</span></label>
                    <input name="addressLine1" required defaultValue={listing.address_line_1} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelMutedClass}>Locality / Area</label>
                    <input name="locality" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. Chandapura" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelMutedClass}>City</label>
                    <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bangalore" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelMutedClass}>State / Province</label>
                    <input name="administrativeArea" value={adminArea} onChange={(e) => setAdminArea(e.target.value)} placeholder="e.g. Karnataka" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelMutedClass}>Postal Code</label>
                    <input name="postalCode" defaultValue={listing.postal_code ?? ""} className={inputClass} />
                  </div>
                </div>

                <div className="border-t border-[var(--line)] pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">GPS Coordinates</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Latitude</label>
                      <input name="latitude" type="number" step="any" defaultValue={listing.latitude ?? ""} className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                      <label className={labelClass}>Longitude</label>
                      <input name="longitude" type="number" step="any" defaultValue={listing.longitude ?? ""} className={`${inputClass} font-mono`} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-ui">
                    Save Location
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* CONTACT TAB */}
          {activeTab === "contact" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Contact Information</h3>
              <form action={updateAction} className="mt-4 space-y-5">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="domainId" value={listing.domain_id} />
                <input type="hidden" name="title" value={title} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="categoryId" value={listing.category_id} />
                <input type="hidden" name="shortDescription" value={shortDesc} />
                <input type="hidden" name="description" value={listing.description ?? ""} />
                <input type="hidden" name="addressLine1" value={listing.address_line_1} />
                <input type="hidden" name="locality" value={locality} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="administrativeArea" value={adminArea} />
                <input type="hidden" name="postalCode" value={listing.postal_code ?? ""} />
                <input type="hidden" name="latitude" value={listing.latitude ?? ""} />
                <input type="hidden" name="longitude" value={listing.longitude ?? ""} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="verificationStatus" value={verificationStatus} />
                {isFeatured && <input type="hidden" name="isFeatured" value="on" />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Website</label>
                    <input name="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-ui">
                    Save Contact Info
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* HOURS TAB */}
          {activeTab === "hours" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <OpeningHoursEditor
                listingId={listing.id}
                initialHours={hours}
                saveAction={saveHoursAction}
              />
            </section>
          )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Photo Gallery & Media</h3>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{media.length} files attached</p>

              {/* Existing media grid */}
              {media.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {media.map((m) => (
                    <div key={m.id} className="group relative rounded-xl border border-[var(--line)] bg-[var(--background)] p-3 overflow-hidden">
                      {m.public_url && m.mime_type?.startsWith("image/") ? (
                        <img src={m.public_url} alt={m.alt_text ?? ""} className="h-20 w-full rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-lg bg-[var(--line)]">
                          <span className="text-xl">📄</span>
                        </div>
                      )}
                      <p className="mt-2 truncate text-[10px] font-semibold text-[var(--foreground)] capitalize">{m.media_type}</p>
                      {m.alt_text && <p className="truncate text-[9px] text-[var(--ink-muted)]">{m.alt_text}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload form */}
              <form action={uploadMediaAction} className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
                <input type="hidden" name="listingId" value={listing.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="mediaType" className={`${inputClass} bg-[var(--background)]`}>
                    <option value="gallery">Gallery Photo</option>
                    <option value="cover">Hero Cover</option>
                    <option value="logo">Brand Logo</option>
                    <option value="document">PDF / Menu</option>
                  </select>
                  <input name="altText" placeholder="Image description (alt text)" className={inputClass} />
                </div>
                <input
                  name="file"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4"
                  className="w-full text-xs text-[var(--ink-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--paper)]"
                />
                <div className="flex justify-end">
                  <button className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--paper)]">
                    Upload
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* LINKS TAB */}
          {activeTab === "links" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Social & Web Links</h3>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{links.length} links attached</p>

              {/* Existing links */}
              {links.length > 0 && (
                <div className="mt-4 space-y-2">
                  {links.map((link) => (
                    <div key={link.platform} className="flex items-center justify-between rounded-xl bg-[var(--background)] px-4 py-2.5">
                      <span className="text-xs font-bold capitalize">{link.platform}</span>
                      <span className="truncate max-w-[200px] text-xs text-[var(--ink-muted)] font-mono">{link.url}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add link form */}
              <form action={saveSocialLinkAction} className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                <input type="hidden" name="listingId" value={listing.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="platform" required className={`${inputClass} bg-[var(--background)]`}>
                    <option value="">Select platform...</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="x">X (Twitter)</option>
                    <option value="tiktok">TikTok</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="menu">Menu / Catalog</option>
                    <option value="other">Other</option>
                  </select>
                  <input name="url" required type="url" placeholder="https://..." className={inputClass} />
                </div>
                <div className="flex justify-end">
                  <button className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--paper)]">
                    Attach Link
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* PUBLISHING TAB */}
          {activeTab === "publishing" && (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Publishing & Curation</h3>
              <form action={updateAction} className="mt-4 space-y-5">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="domainId" value={listing.domain_id} />
                <input type="hidden" name="title" value={title} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="categoryId" value={listing.category_id} />
                <input type="hidden" name="shortDescription" value={shortDesc} />
                <input type="hidden" name="description" value={listing.description ?? ""} />
                <input type="hidden" name="addressLine1" value={listing.address_line_1} />
                <input type="hidden" name="locality" value={locality} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="administrativeArea" value={adminArea} />
                <input type="hidden" name="postalCode" value={listing.postal_code ?? ""} />
                <input type="hidden" name="latitude" value={listing.latitude ?? ""} />
                <input type="hidden" name="longitude" value={listing.longitude ?? ""} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="website" value={website} />
                <input type="hidden" name="email" value={email} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Publication Status</label>
                    <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} bg-[var(--background)]`}>
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Verification</label>
                    <select name="verificationStatus" value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)} className={`${inputClass} bg-[var(--background)]`}>
                      <option value="verified">✓ Verified</option>
                      <option value="unverified">Unverified</option>
                      <option value="pending">Pending Verification</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold">⭐ Featured Place</span>
                </label>

                {/* Duplicate detection */}
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>🔍</span>
                        <span>Duplicate Detection</span>
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">
                        {duplicateCount > 0
                          ? `⚠️ ${duplicateCount} potential duplicate listing(s) detected with matching title/phone.`
                          : "✓ No duplicates found in this directory."}
                      </p>
                    </div>
                    {duplicates && duplicates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsMergeModalOpen(true)}
                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
                      >
                        Review & Merge 🤝
                      </button>
                    )}
                  </div>
                </div>

                {/* Side-by-side Merge Modal */}
                {duplicates && duplicates.length > 0 && (
                  <AdminDuplicateMergeModal
                    primaryListing={listing}
                    duplicates={duplicates}
                    isOpen={isMergeModalOpen}
                    onClose={() => setIsMergeModalOpen(false)}
                  />
                )}

                {/* Audit trail */}
                {audit.length > 0 && (
                  <div className="border-t border-[var(--line)] pt-4">
                    <p className="text-xs font-bold text-[var(--foreground)]">Recent Audit Events</p>
                    <div className="mt-2 space-y-1.5">
                      {audit.slice(0, 5).map((event, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="capitalize text-[var(--ink-muted)]">{event.action.replace(/_/g, " ")}</span>
                          <span className="font-mono text-[10px] text-[var(--ink-faint)]">
                            {new Date(event.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-ui">
                    Save Publishing Settings
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="hidden lg:block sticky top-24 self-start">
            <ListingPreview data={previewData} />
          </div>
        )}
      </div>
    </div>
  );
}
