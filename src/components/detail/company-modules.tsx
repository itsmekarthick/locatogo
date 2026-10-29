import { Suspense } from "react";
import { ModuleBoundary, ModuleError } from "@/components/detail/module-boundary";
import { ModuleCard, ModuleSkeleton } from "@/components/detail/module-card";
import { PlaceReviews } from "@/components/place-reviews-section";
import { PlaceWeatherBadge } from "@/components/place-weather-badge";
import { CloudIcon } from "@/components/ui/icons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPlaceWeather } from "@/lib/services/weather";

async function reviewsClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return await createSupabaseServerClient();
  }
}

async function ReviewsContent({ listingId }: { listingId: string }) {
  const supabase = await reviewsClient();
  const { data, error } = await supabase
    .from("place_reviews")
    .select("id, user_id, rating, body, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  // Rendering the fallback here, rather than throwing, keeps static regeneration healthy.
  if (error) return <ModuleError title="Reviews" />;
  return <PlaceReviews id="reviews" listingId={listingId} initialReviews={data ?? []} />;
}

/** Community reviews with a skeleton while loading and an inline fallback if the query fails. */
export function CompanyReviews({ listingId }: { listingId: string }) {
  return (
    <ModuleBoundary title="Reviews">
      <Suspense fallback={<ModuleSkeleton lines={3} />}>
        <ReviewsContent listingId={listingId} />
      </Suspense>
    </ModuleBoundary>
  );
}

async function WeatherContent({ latitude, longitude, locality }: { latitude: number; longitude: number; locality?: string | null }) {
  const weather = await fetchPlaceWeather(latitude, longitude);

  if (!weather) {
    return (
      <ModuleCard id="weather" icon={<CloudIcon />} title="Weather" description="Conditions aren't available right now">
        <p className="text-sm text-fg-muted">The weather service didn&apos;t respond. It refreshes automatically, so check back shortly.</p>
      </ModuleCard>
    );
  }

  return <PlaceWeatherBadge id="weather" weather={weather} locality={locality} />;
}

export function CompanyWeather({ latitude, longitude, locality }: { latitude: number; longitude: number; locality?: string | null }) {
  return (
    <ModuleBoundary title="Weather">
      <Suspense fallback={<ModuleSkeleton lines={2} />}>
        <WeatherContent latitude={latitude} longitude={longitude} locality={locality} />
      </Suspense>
    </ModuleBoundary>
  );
}
