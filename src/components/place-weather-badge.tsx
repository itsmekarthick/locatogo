"use client";

import { useState } from "react";
import { ModuleCard } from "@/components/detail/module-card";
import { WeatherForecastModal } from "@/components/weather-forecast-modal";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRightIcon,
  BoltIcon,
  CloudIcon,
  CloudRainIcon,
  DropletIcon,
  SnowflakeIcon,
  SunIcon,
  WindIcon,
} from "@/components/ui/icons";
import type { PlaceWeather, WeatherType } from "@/lib/services/weather";
import { cn } from "@/lib/utils/cn";

type Props = {
  weather: PlaceWeather | null;
  locality?: string | null;
  compact?: boolean;
  /** Anchor id for the section nav (full card only). */
  id?: string;
  onSimulateWeather?: (type: WeatherType | null) => void;
  currentSimulated?: WeatherType | null;
};

export function WeatherGlyph({ type, className }: { type: WeatherType; className?: string }) {
  switch (type) {
    case "rain":
    case "drizzle":
      return <CloudRainIcon className={className} />;
    case "thunderstorm":
      return <BoltIcon className={className} />;
    case "snow":
      return <SnowflakeIcon className={className} />;
    case "clouds":
    case "fog":
      return <CloudIcon className={className} />;
    default:
      return <SunIcon className={className} />;
  }
}

function aqiVariant(aqi: number): BadgeVariant {
  if (aqi <= 50) return "success";
  if (aqi <= 100) return "warning";
  return "danger";
}

export function PlaceWeatherBadge({ weather, locality, compact = false, id, onSimulateWeather, currentSimulated }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!weather) return null;

  const modal = (
    <WeatherForecastModal
      weather={weather}
      locality={locality}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSimulateWeather={onSimulateWeather}
      currentSimulated={currentSimulated}
    />
  );

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="5-day forecast and hourly timeline"
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface-1 px-3 text-sm font-medium text-fg transition-ui hover:bg-surface-3 motion-safe:active:scale-[0.98] pointer-coarse:h-11"
        >
          <WeatherGlyph type={weather.weatherType} className="size-4 text-accent-text" />
          <span>{weather.temperature}°C</span>
          <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
          <Badge variant={aqiVariant(weather.aqi)} size="sm">
            <span className="max-sm:hidden">AQI {weather.aqi} · {weather.aqiStatus}</span>
            <span className="sm:hidden">AQI {weather.aqi}</span>
          </Badge>
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <ModuleCard
        id={id}
        icon={<WeatherGlyph type={weather.weatherType} />}
        title="Weather"
        description={locality ? `Around ${locality}` : "Local conditions"}
        action={
          <Badge variant={aqiVariant(weather.aqi)} size="sm">
            AQI {weather.aqi} · {weather.aqiStatus}
          </Badge>
        }
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-fg">{weather.temperature}°C</p>
            <p className="mt-1 text-sm capitalize text-fg-muted">{weather.weatherDescription}</p>
          </div>
          <WeatherGlyph type={weather.weatherType} className={cn("size-12 text-accent-text opacity-80")} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
          <div className="flex items-center gap-2">
            <DropletIcon className="size-4 text-fg-subtle" />
            <dt className="text-fg-muted">Humidity</dt>
            <dd className="ml-auto font-medium text-fg">{weather.humidity}%</dd>
          </div>
          <div className="flex items-center gap-2">
            <WindIcon className="size-4 text-fg-subtle" />
            <dt className="text-fg-muted">Wind</dt>
            <dd className="ml-auto font-medium text-fg">{weather.windSpeed} km/h</dd>
          </div>
        </dl>

        <Button
          variant="secondary"
          size="sm"
          fullWidth
          className="mt-4"
          trailingIcon={<ArrowUpRightIcon className="size-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          5-day forecast
        </Button>
      </ModuleCard>
      {modal}
    </>
  );
}
