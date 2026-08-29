"use client";

import type { PlaceWeather } from "@/lib/services/weather";

type Props = {
  weather: PlaceWeather | null;
  locality?: string | null;
  compact?: boolean;
};

export function PlaceWeatherBadge({ weather, locality, compact = false }: Props) {
  if (!weather) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs backdrop-blur-xs">
        <span>{weather.weatherIcon}</span>
        <span>{weather.temperature}°C</span>
        <span className="text-gray-300">|</span>
        <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${weather.aqiColor}`}>
          AQI {weather.aqi} · {weather.aqiStatus}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-linear-to-br from-blue-50/50 via-white to-gray-50/50 p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weather.weatherIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">{weather.temperature}°C</span>
              <span className="text-xs font-medium text-gray-500">{weather.weatherDescription}</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {locality ? `${locality}, Bangalore` : "Bangalore Atmosphere"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${weather.aqiColor}`}>
            AQI {weather.aqi} · {weather.aqiStatus}
          </span>
          <p className="text-[10px] text-gray-400 mt-0.5">Air Quality Index</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5 text-[11px] text-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">💧 Humidity:</span>
          <span className="font-semibold text-gray-800">{weather.humidity}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">💨 Wind Speed:</span>
          <span className="font-semibold text-gray-800">{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

