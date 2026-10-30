import Link from "next/link";
import { ModuleCard } from "@/components/detail/module-card";
import { ModuleError } from "@/components/detail/module-boundary";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpRightIcon, MapPinIcon } from "@/components/ui/icons";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  listingId: string;
  categoryId: string | null;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  /** Anchor id for the section nav. */
  id?: string;
}

export async function NearbyPlaces({ listingId, categoryId, latitude, longitude, radiusKm = 5, id = "nearby" }: Props) {
  const header = { id, icon: <MapPinIcon />, title: "Nearby places", description: `Similar places within ${radiusKm} km` };

  if (!categoryId) {
    return (
      <ModuleCard {...header}>
        <EmptyState className="py-8" icon={<MapPinIcon />} title="Nothing to compare yet" description="This place isn't in a category, so we can't suggest similar ones." />
      </ModuleCard>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: candidates, error } = await supabase
    .from("listings")
    .select(
      "id, title, slug, locality, latitude, longitude, categories:categories!listings_category_id_fkey(name)"
    )
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("id", listingId)
    .limit(50);

  // Rendering the fallback instead of throwing keeps static regeneration healthy.
  if (error) return <ModuleError title="Nearby places" />;

  const nearby = (candidates ?? [])
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      ...p,
      distKm: haversineKm(latitude, longitude, p.latitude, p.longitude),
    }))
    .filter((p) => p.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 6);

  if (nearby.length === 0) {
    return (
      <ModuleCard {...header}>
        <EmptyState
          className="py-8"
          icon={<MapPinIcon />}
          title="No similar places nearby"
          description={`We couldn't find another listing like this within ${radiusKm} km.`}
        />
      </ModuleCard>
    );
  }

  return (
    <ModuleCard {...header}>
      <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {nearby.map((place) => (
          <li key={place.id}>
            <Link
              href={`/listing/${place.slug}`}
              className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5 lift hover:border-line-strong hover:bg-surface-3/50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-3 text-lg text-fg-muted">
                <MapPinIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{place.title}</span>
                <span className="block truncate text-xs text-fg-subtle">
                  {[place.locality, `${place.distKm.toFixed(1)} km away`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <ArrowUpRightIcon className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
            </Link>
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
