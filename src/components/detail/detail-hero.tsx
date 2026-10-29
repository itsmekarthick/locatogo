import Image from "next/image";
import type { ReactNode } from "react";
import "@/components/detail/detail.css";

// A flat neutral swatch; the real photo replaces it as soon as it decodes.
export const BLUR_PLACEHOLDER = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><rect width="8" height="5" fill="#94a3b8"/></svg>',
).toString("base64")}`;

export type DetailCover = { src: string; alt: string; caption?: string | null };

type DetailHeroProps = {
  cover?: DetailCover | null;
  /** Rendered over the cover, under the scrim, e.g. a weather atmosphere effect. */
  coverOverlay?: ReactNode;
  /** Top-right control on the cover. */
  coverAction?: ReactNode;
  avatar: ReactNode;
  title: string;
  /** Chips shown above the name. */
  chips?: ReactNode;
  /** Location and fact row under the name. */
  meta?: ReactNode;
  summary?: string | null;
  children?: ReactNode;
};

export function DetailHero({ cover, coverOverlay, coverAction, avatar, title, chips, meta, summary, children }: DetailHeroProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="relative isolate h-44 overflow-hidden rounded-3xl border border-line bg-surface-2 sm:h-60 lg:h-72">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            priority
            // Photo hosts vary (Places, Wikimedia, storage), so they bypass the optimizer and keep the blur placeholder.
            unoptimized
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="dt-cover-img object-cover"
          />
        ) : (
          <div aria-hidden="true" className="dt-cover-mesh absolute inset-0" />
        )}
        {coverOverlay}
        {cover && <div aria-hidden="true" className="dt-scrim pointer-events-none absolute inset-0" />}
        {cover?.caption && (
          <span className="absolute bottom-3 right-4 max-w-[60%] truncate rounded-full bg-[var(--glass)] px-3 py-1 text-xs font-medium text-fg backdrop-blur-md">
            {cover.caption}
          </span>
        )}
        {coverAction && <div className="absolute right-3 top-3">{coverAction}</div>}
      </div>

      <div className="relative px-1 sm:px-6">
        <div className="-mt-10 flex items-end sm:-mt-12">
          <div className="rounded-2xl bg-surface-0 p-1 elev-md">{avatar}</div>
        </div>

        <div className="mt-4">
          {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
          <h1 className="mt-3 text-balance font-display text-[clamp(1.875rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-fg">
            {title}
          </h1>
          {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">{meta}</div>}
          {summary && <p className="mt-4 max-w-[65ch] text-pretty text-base leading-relaxed text-fg-muted">{summary}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
