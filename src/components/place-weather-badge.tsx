"use client";

import { useState } from "react";
import type { PlaceWeather, WeatherType } from "@/lib/services/weather";
import { WeatherForecastModal } from "@/components/weather-forecast-modal";

type Props = {
  weather: PlaceWeather | null;
  locality?: string | null;
  compact?: boolean;
  onSimulateWeather?: (type: WeatherType | null) => void;
  currentSimulated?: WeatherType | null;
};

export function PlaceWeatherBadge({
  weather,
  locality,
  compact = false,
  onSimulateWeather,
  currentSimulated,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!weather) return null;

  const isRain =
    weather.weatherType === "rain" ||
    weather.weatherType === "drizzle" ||
    weather.weatherType === "thunderstorm";

  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          title="Click to view 5-Day Prediction & Hourly Timeline"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs backdrop-blur-xs hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer group"
        >
          <span>{weather.weatherIcon}</span>
          <span>{weather.temperature}°C</span>
          <span className="text-gray-300">|</span>
          <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${weather.aqiColor}`}>
            AQI {weather.aqi} · {weather.aqiStatus}
          </span>
          {isRain && (
            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-bold text-blue-600 animate-pulse">
              🌧️ Rain
            </span>
          )}
          <span className="text-gray-400 group-hover:text-blue-600 text-[10px]">↗</span>
        </button>

        <WeatherForecastModal
          weather={weather}
          locality={locality}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSimulateWeather={onSimulateWeather}
          currentSimulated={currentSimulated}
        />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="rounded-2xl border border-gray-200/90 bg-gradient-to-br from-blue-50/50 via-white to-gray-50/50 p-4 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{weather.weatherIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">{weather.temperature}°C</span>
                <span className="text-xs font-medium text-gray-500">{weather.weatherDescription}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {locality ? `${locality}, Atmosphere` : "Local Atmosphere"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${weather.aqiColor}`}>
              AQI {weather.aqi} · {weather.aqiStatus}
            </span>
            <span className="block text-[10px] text-blue-600 font-semibold mt-0.5 group-hover:underline">
              View 5-Day Forecast ↗
            </span>
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

      <WeatherForecastModal
        weather={weather}
        locality={locality}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSimulateWeather={onSimulateWeather}
        currentSimulated={currentSimulated}
      />
    </>
  );
}
