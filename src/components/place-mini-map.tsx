"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapErrorBoundary } from "@/components/map-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { Tab, TabList, Tabs } from "@/components/ui/tabs";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import type { WeatherType } from "@/lib/services/weather";

const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => <Skeleton role="status" aria-label="Loading map" className="h-full w-full rounded-none" />,
  }
);

export function PlaceMiniMap({
  listing,
  weatherType = null,
}: {
  listing: PlaceListing & { latitude: number; longitude: number };
  weatherType?: WeatherType | null;
}) {
  const [mapPerspective, setMapPerspective] = useState<"street" | "satellite">("street");

  return (
    <div className="space-y-3">
      <Tabs variant="pill" value={mapPerspective} onValueChange={(next) => setMapPerspective(next as "street" | "satellite")}>
        <TabList aria-label="Map layer">
          <Tab value="street">Street</Tab>
          <Tab value="satellite">Satellite</Tab>
        </TabList>
      </Tabs>

      <div className="relative h-56 w-full overflow-hidden rounded-xl border border-line sm:h-64">
        <MapErrorBoundary fallbackText="The map couldn't load. The address and directions above still work.">
          <InteractiveLeafletCanvas
            key={`mini-map-${mapPerspective}`}
            locatedListings={[listing]}
            activePlaceId={listing.id}
            setActivePlaceId={() => {}}
            isFullscreen={false}
            // Atlas mode keeps the pin free of the placeholder rating tag.
            isTechAtlas
            initialPerspective={mapPerspective}
            weatherType={weatherType}
          />
        </MapErrorBoundary>
      </div>
    </div>
  );
}
