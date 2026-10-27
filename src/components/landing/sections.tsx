import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar, Badge, buttonVariants, Card } from "@/components/ui";
import { ArrowRightIcon, MapPinIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/landing/reveal";
import { APP_URL } from "@/lib/constants/app-url";
import { GLOBAL_COUNTRIES, GLOBAL_TECH_HUBS } from "@/lib/constants/tech-hubs";

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent-text">{eyebrow}</p>
        <h2 className="mt-3 font-display text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-fg">
          {title}
        </h2>
        {description && <p className="mt-4 max-w-[60ch] text-base text-fg-muted">{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}

export function HubsByCountry() {
  const countries = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").flatMap((country) => {
    const hub = GLOBAL_TECH_HUBS.find((candidate) => candidate.id === country.defaultHubId);
    return hub ? [{ country, hub }] : [];
  });

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Global company directory"
          title="Explore tech companies by country"
          description="Start with a leading technology hub in each country, then browse companies, startups and live roles on the map."
          action={
            <a href={APP_URL} className={buttonVariants({ variant: "secondary" })}>
              Open global atlas
              <ArrowRightIcon className="size-4" />
            </a>
          }
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map(({ country, hub }, index) => (
            <Reveal key={country.code} index={index % 4}>
              <Link
                href={`/hub/${country.code.toLowerCase()}/${hub.id}`}
                className="focus-ring group block rounded-2xl"
              >
                <Card interactive padding="sm" className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3 font-mono text-xs text-fg-muted">
                    {country.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-fg">{hub.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-fg-muted">{country.name}</p>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 group-hover:translate-x-0.5" />
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export type FeaturedPlace = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  locality: string | null;
  city: string | null;
  verification_status: string | null;
  active_jobs_count: number | null;
};

export function FeaturedCompanies({ places }: { places: FeaturedPlace[] }) {
  if (places.length === 0) return null;

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Company profiles"
          title="Companies worth knowing"
          description="Understand a team before you apply, partner or visit: stage, location, stack and open roles in one place."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, index) => (
            <Reveal key={place.id} index={index % 3}>
              <Link href={`/company/${place.slug}`} className="focus-ring group block h-full rounded-2xl">
                <Card interactive className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Avatar name={place.title} size="lg" />
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {place.verification_status === "verified" && <Badge variant="success">Verified</Badge>}
                        {place.active_jobs_count ? (
                          <Badge variant="accent">{place.active_jobs_count === 1 ? "1 role" : `${place.active_jobs_count} roles`}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-fg">{place.title}</h3>
                    {(place.locality || place.city) && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-subtle">
                        <MapPinIcon className="size-4" />
                        {[place.locality, place.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {place.short_description && (
                      <p className="mt-3 line-clamp-2 text-sm text-fg-muted">{place.short_description}</p>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-accent-text">
                    View profile
                    <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export type StoryItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  author_name: string | null;
  reading_time_minutes: number | null;
};

export function Stories({ stories }: { stories: StoryItem[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tech ecosystem guides"
          title="Stories from the ecosystem"
          description="Guides and perspectives on technology hubs, company ecosystems and the people building what comes next."
          action={
            <Link href="/blog" className={buttonVariants({ variant: "secondary" })}>
              Read all stories
              <ArrowRightIcon className="size-4" />
            </Link>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <Reveal key={story.id} index={index}>
              <Link href={`/blog/${story.slug}`} className="focus-ring group block h-full rounded-2xl">
                <Card interactive padding="none" className="flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-3">
                    {story.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- remote hosts are not configured for next/image
                      <img
                        src={story.cover_image_url}
                        alt=""
                        width={640}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 ease-emphasized group-hover:scale-[1.03]"
                      />
                    )}
                    {story.category && (
                      <Badge className="absolute left-3 top-3 bg-surface-2/90 backdrop-blur-sm">{story.category}</Badge>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                    <div>
                      <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-fg">
                        {story.title}
                      </h3>
                      {story.excerpt && <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{story.excerpt}</p>}
                    </div>
                    <p className="text-sm text-fg-subtle">
                      {[story.author_name && `By ${story.author_name}`, story.reading_time_minutes && `${story.reading_time_minutes} min read`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
      <Reveal className="mx-auto max-w-7xl">
        <div className="lp-grain lp-static relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface-1 px-6 py-16 text-center elev-lg sm:px-12 sm:py-24">
          <div aria-hidden="true" className="lp-mesh -z-10">
            <div className="lp-blob lp-blob-a" />
            <div className="lp-blob lp-blob-b" />
          </div>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,4.4vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-fg">
            Ready to explore the{" "}
            <span className="bg-gradient-to-r from-accent-600 via-accent-500 to-accent-400 bg-clip-text text-transparent dark:from-accent-300 dark:via-accent-400 dark:to-accent-500">
              global tech ecosystem
            </span>
            ?
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-base text-fg-muted sm:text-lg">
            Start with a city, sector or company and follow the signal from discovery to a live opportunity.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={APP_URL} className={buttonVariants({ size: "lg" })}>
              Explore Tech Atlas
              <ArrowRightIcon className="size-4" />
            </a>
            <Link href="/auth/signup" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Add a company
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
