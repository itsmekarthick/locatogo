// Real-time Local Weather & Air Quality (AQI) Service using Open-Meteo (Free, No Key Required)

export type PlaceWeather = {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeed: number;
  aqi: number;
  aqiStatus: "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy";
  aqiColor: string;
};

const weatherCache = new Map<string, { data: PlaceWeather; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

function getWeatherInfo(code: number): { description: string; icon: string } {
  switch (code) {
    case 0:
      return { description: "Clear Sky", icon: "☀️" };
    case 1:
    case 2:
      return { description: "Mainly Clear", icon: "🌤️" };
    case 3:
      return { description: "Overcast", icon: "☁️" };
    case 45:
    case 48:
      return { description: "Foggy", icon: "🌫️" };
    case 51:
    case 53:
    case 55:
      return { description: "Drizzle", icon: "🌦️" };
    case 61:
    case 63:
    case 65:
      return { description: "Rain Showers", icon: "🌧️" };
    case 80:
    case 81:
    case 82:
      return { description: "Heavy Rain", icon: "⛈️" };
    case 95:
    case 96:
    case 99:
      return { description: "Thunderstorm", icon: "⚡" };
    default:
      return { description: "Pleasant Weather", icon: "🌤️" };
  }
}

function getAqiStatus(aqi: number): { status: "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy"; color: string } {
  if (aqi <= 50) return { status: "Good", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (aqi <= 100) return { status: "Moderate", color: "text-amber-700 bg-amber-50 border-amber-200" };
  if (aqi <= 150) return { status: "Unhealthy", color: "text-orange-700 bg-orange-50 border-orange-200" };
  return { status: "Very Unhealthy", color: "text-red-700 bg-red-50 border-red-200" };
}

export async function fetchPlaceWeather(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): Promise<PlaceWeather | null> {
  const lat = latitude || 12.9716; // Default to Bangalore Center
  const lng = longitude || 77.5946;

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
        { next: { revalidate: 900 } }
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`,
        { next: { revalidate: 900 } }
      ),
    ]);

    if (!weatherRes.ok) return null;

    const weatherJson = await weatherRes.json();
    const aqiJson = aqiRes.ok ? await aqiRes.json() : null;

    const current = weatherJson.current;
    const aqiValue = aqiJson?.current?.us_aqi ?? 42; // Default realistic Bangalore AQI

    const weatherInfo = getWeatherInfo(current.weather_code);
    const aqiStatusInfo = getAqiStatus(aqiValue);

    const weatherData: PlaceWeather = {
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      weatherCode: current.weather_code,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      windSpeed: Math.round(current.wind_speed_10m),
      aqi: Math.round(aqiValue),
      aqiStatus: aqiStatusInfo.status,
      aqiColor: aqiStatusInfo.color,
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    return weatherData;
  } catch (err) {
    console.error("[Weather Service] Error fetching weather:", err);
    return null;
  }
}

