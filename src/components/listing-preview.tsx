"use client";

type PreviewData = {
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  locality: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  email: string;
  status: string;
  isFeatured: boolean;
  verificationStatus: string;
};

export function ListingPreview({ data }: { data: PreviewData }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-xs overflow-hidden">
      {/* Preview Header */}
      <div className="border-b border-[var(--line)] bg-[var(--background)] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-mono text-[var(--ink-faint)]">
            locatogo.com/listing/{data.slug || "preview"}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">Live Preview</span>
      </div>

      {/* Preview Content */}
      <div className="p-5">
        {/* Cover placeholder */}
        <div className="h-24 rounded-xl bg-gradient-to-br from-[var(--line)] to-[var(--background)] flex items-center justify-center">
          <span className="text-2xl">🗺️</span>
        </div>

        {/* Title & badges */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {data.isFeatured && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                ⭐ Featured
              </span>
            )}
            {data.verificationStatus === "verified" && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                ✓ Verified
              </span>
            )}
            <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[9px] font-semibold text-[var(--ink-muted)] capitalize">
              {data.status.replace("_", " ")}
            </span>
          </div>

          <h3 className="mt-2 font-display text-xl font-bold text-[var(--foreground)] leading-tight">
            {data.title || "Untitled Listing"}
          </h3>

          {data.category && (
            <p className="mt-1 text-[11px] font-semibold text-[var(--coral)]">{data.category}</p>
          )}
        </div>

        {/* Location */}
        {(data.locality || data.city || data.state) && (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            📍 {[data.locality, data.city, data.state].filter(Boolean).join(", ")}
          </p>
        )}

        {/* Description */}
        {data.shortDescription && (
          <p className="mt-3 text-xs leading-5 text-[var(--ink-muted)] line-clamp-3">
            {data.shortDescription}
          </p>
        )}

        {/* Contact info */}
        <div className="mt-4 space-y-1.5">
          {data.phone && (
            <div className="flex items-center gap-2 text-xs text-[var(--foreground)]">
              <span className="text-sm">📞</span>
              <span className="font-medium">{data.phone}</span>
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-2 text-xs text-[var(--foreground)]">
              <span className="text-sm">🌐</span>
              <span className="font-medium truncate">{data.website}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-2 text-xs text-[var(--foreground)]">
              <span className="text-sm">✉️</span>
              <span className="font-medium">{data.email}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-xl bg-[var(--foreground)] py-2 text-center text-xs font-bold text-[var(--paper)]">
            Get Directions
          </div>
          <div className="flex-1 rounded-xl border border-[var(--line)] py-2 text-center text-xs font-bold text-[var(--foreground)]">
            Contact
          </div>
        </div>
      </div>
    </div>
  );
}
