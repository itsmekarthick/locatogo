"use client";

import { useState } from "react";
import type { PlaceWeather, WeatherType } from "@/lib/services/weather";

type Props = {
  weather: PlaceWeather;
  locality?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateWeather?: (type: WeatherType | null) => void;
  currentSimulated?: WeatherType | null;
};

export function WeatherForecastModal({
  weather,
  locality,
  isOpen,
  onClose,
  onSimulateWeather,
  currentSimulated,
}: Props) {
  const [activeTab, setActiveTab] = useState<"hourly" | "daily">("hourly");

  if (!isOpen) return null;

  const currentType = currentSimulated || weather.weatherType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient Background */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-blue-100">
            <span>📍</span>
            <span>{locality || "Local Area"} Weather Forecast & Prediction</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">{weather.temperature}°C</span>
                <span className="text-3xl">{weather.weatherIcon}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-blue-100">{weather.weatherDescription}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-right text-xs">
              <div className="rounded-xl bg-white/10 px-2.5 py-1.5 backdrop-blur-xs">
                <span className="text-blue-200 block text-[10px]">HUMIDITY</span>
                <span className="font-bold">{weather.humidity}%</span>
              </div>
              <div className="rounded-xl bg-white/10 px-2.5 py-1.5 backdrop-blur-xs">
                <span className="text-blue-200 block text-[10px]">WIND</span>
                <span className="font-bold">{weather.windSpeed} km/h</span>
              </div>
              <div className="col-span-2 rounded-xl bg-white/10 px-2.5 py-1.5 backdrop-blur-xs text-left">
                <span className="text-blue-200 block text-[10px]">AIR QUALITY INDEX (AQI)</span>
                <span className="font-bold">
                  {weather.aqi} · {weather.aqiStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Atmospheric Animation Controls */}
          {onSimulateWeather && (
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-2 text-xs">
              <span className="text-blue-200 font-semibold shrink-0">✨ Atmosphere FX:</span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(
                  [
                    { label: "Auto", value: null },
                    { label: "🌧️ Rain", value: "rain" },
                    { label: "⚡ Storm", value: "thunderstorm" },
                    { label: "☀️ Clear", value: "clear" },
                    { label: "☁️ Clouds", value: "clouds" },
                  ] as const
                ).map((mode) => {
                  const isActive = currentSimulated === mode.value;
                  return (
                    <button
                      key={mode.label}
                      onClick={() => onSimulateWeather(mode.value)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-white text-gray-950 shadow-xs"
                          : "bg-white/15 text-blue-100 hover:bg-white/25"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Forecast Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-6 pt-3">
          <button
            onClick={() => setActiveTab("hourly")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "hourly"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            ⏰ 24-Hour Timeline
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "daily"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            📅 5-Day Prediction
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 24-HOUR HOURLY FORECAST */}
          {activeTab === "hourly" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">Hourly temperature and precipitation probability:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {weather.hourlyForecast.slice(0, 12).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/60 p-2.5 text-center hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-gray-500">{item.hourLabel}</span>
                    <span className="my-1.5 text-xl">{item.icon}</span>
                    <span className="text-xs font-bold text-gray-900">{item.temp}°C</span>
                    {item.rainChance > 0 ? (
                      <span className="mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full">
                        💧{item.rainChance}%
                      </span>
                    ) : (
                      <span className="mt-1 text-[10px] text-gray-400">0%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 5-DAY DAILY FORECAST */}
          {activeTab === "daily" && (
            <div className="space-y-2.5">
              <p className="text-xs text-gray-500 font-medium">Upcoming 5-day weather conditions & rain prediction:</p>
              {weather.dailyForecast.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-blue-50/40 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{day.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">{day.dayName}</span>
                      <span className="text-[11px] text-gray-500">{day.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    {day.rainChance > 0 && (
                      <div className="text-left">
                        <span className="text-[10px] text-gray-400 block uppercase">Rain Chance</span>
                        <span className="text-xs font-bold text-blue-600">💧 {day.rainChance}%</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">High / Low</span>
                      <span className="text-xs font-bold text-gray-900">
                        {day.maxTemp}° / <span className="text-gray-500 font-normal">{day.minTemp}°C</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <span>Data provided by Open-Meteo & Copernicus</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-950 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

