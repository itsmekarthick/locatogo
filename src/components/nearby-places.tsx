import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

interface NearbyPlace {
  id: string;
  title: string;
  slug: string;
  locality: string | null;
  latitude: number;
  longitude: number;
  category_name?: string;
}

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
}

export async function NearbyPlaces({
  listingId,
  categoryId,
  latitude,
  longitude,
  radiusKm = 5,
}: Props) {
  if (!categoryId) return null;

  const supabase = await createSupabaseServerClient();

  const { data: candidates } = await supabase
    .from("listings")
    .select(
      "id, title, slug, locality, latitude, longitude, categories:categories!listings_category_id_domain_id_fkey(name)"
    )
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("id", listingId)
    .limit(50);

  if (!candidates || candidates.length === 0) return null;

  const nearby = candidates
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      ...p,
      distKm: haversineKm(latitude, longitude, p.latitude, p.longitude),
      category_name: Array.isArray(p.categories)
        ? p.categories[0]?.name
        : (p.categories as { name?: string } | null)?.name,
    }))
    .filter((p) => p.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 5);

  if (nearby.length === 0) return null;

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-5">Nearby Places</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {nearby.map((place) => (
          <Link
            key={place.id}
            href={`/listing/${place.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <span className="text-2xl shrink-0">📍</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-[#e26a4f] transition-colors line-clamp-1">
                {place.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {place.locality ?? ""} · {place.distKm.toFixed(1)} km away
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
