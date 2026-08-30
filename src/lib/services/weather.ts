// Real-time Local Weather, Air Quality (AQI), & Forecast Prediction Service using Open-Meteo (Free, Zero Key Required)

export type HourlyForecastItem = {
  time: string;
  hourLabel: string;
  temp: number;
  rainChance: number; // 0-100%
  weatherCode: number;
  icon: string;
};

export type DailyForecastItem = {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  rainChance: number; // 0-100%
  weatherCode: number;
  icon: string;
  description: string;
};

export type WeatherType = "rain" | "drizzle" | "thunderstorm" | "clear" | "clouds" | "fog" | "snow";

export type PlaceWeather = {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  weatherType: WeatherType;
  windSpeed: number;
  aqi: number;
  aqiStatus: "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy";
  aqiColor: string;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
};

const weatherCache = new Map<string, { data: PlaceWeather; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export function getWeatherInfo(code: number): { description: string; icon: string; type: WeatherType } {
  switch (code) {
    case 0:
      return { description: "Clear Sky", icon: "☀️", type: "clear" };
    case 1:
    case 2:
      return { description: "Mainly Clear", icon: "🌤️", type: "clear" };
    case 3:
      return { description: "Overcast", icon: "☁️", type: "clouds" };
    case 45:
    case 48:
      return { description: "Foggy", icon: "🌫️", type: "fog" };
    case 51:
    case 53:
    case 55:
      return { description: "Drizzle", icon: "🌦️", type: "drizzle" };
    case 61:
    case 63:
    case 65:
      return { description: "Rain Showers", icon: "🌧️", type: "rain" };
    case 71:
    case 73:
    case 75:
      return { description: "Snow", icon: "🌨️", type: "snow" };
    case 80:
    case 81:
    case 82:
      return { description: "Heavy Rain", icon: "🌧️", type: "rain" };
    case 95:
    case 96:
    case 99:
      return { description: "Thunderstorm", icon: "⚡", type: "thunderstorm" };
    default:
      return { description: "Pleasant Weather", icon: "🌤️", type: "clear" };
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,rain,showers&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
        { next: { revalidate: 900 } }
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=auto`,
        { next: { revalidate: 900 } }
      ),
    ]);

    if (!weatherRes.ok) return null;

    const weatherJson = await weatherRes.json();
    const aqiJson = aqiRes.ok ? await aqiRes.json() : null;

    const current = weatherJson.current;
    const aqiValue = aqiJson?.current?.us_aqi ?? 42;

    const weatherInfo = getWeatherInfo(current.weather_code);
    const aqiStatusInfo = getAqiStatus(aqiValue);

    // Auto-detect if rain or showers are actively occurring
    let autoWeatherType: WeatherType = weatherInfo.type;
    const isActivelyRaining =
      (current.rain && current.rain > 0) ||
      (current.showers && current.showers > 0) ||
      (current.precipitation && current.precipitation > 0);

    if (isActivelyRaining && autoWeatherType !== "thunderstorm") {
      autoWeatherType = "rain";
    }

    // Extract next 24 hours forecast
    const hourlyForecast: HourlyForecastItem[] = [];
    if (weatherJson.hourly?.time) {
      const now = new Date();
      const currentHourIso = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
      let startIndex = weatherJson.hourly.time.findIndex((t: string) => t.startsWith(currentHourIso));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < startIndex + 24 && i < weatherJson.hourly.time.length; i++) {
        const rawTime = weatherJson.hourly.time[i];
        const dateObj = new Date(rawTime);
        const hourNum = dateObj.getHours();
        const ampm = hourNum >= 12 ? "PM" : "AM";
        const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        const code = weatherJson.hourly.weather_code[i] ?? 0;
        const info = getWeatherInfo(code);

        hourlyForecast.push({
          time: rawTime,
          hourLabel: i === startIndex ? "Now" : `${displayHour} ${ampm}`,
          temp: Math.round(weatherJson.hourly.temperature_2m[i] ?? 24),
          rainChance: Math.round(weatherJson.hourly.precipitation_probability[i] ?? 0),
          weatherCode: code,
          icon: info.icon,
        });
      }
    }

    // Extract 5-day daily forecast
    const dailyForecast: DailyForecastItem[] = [];
    if (weatherJson.daily?.time) {
      for (let i = 0; i < Math.min(6, weatherJson.daily.time.length); i++) {
        const rawDate = weatherJson.daily.time[i];
        const dateObj = new Date(rawDate);
        const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const code = weatherJson.daily.weather_code[i] ?? 0;
        const info = getWeatherInfo(code);

        dailyForecast.push({
          date: rawDate,
          dayName,
          maxTemp: Math.round(weatherJson.daily.temperature_2m_max[i] ?? 28),
          minTemp: Math.round(weatherJson.daily.temperature_2m_min[i] ?? 18),
          rainChance: Math.round(weatherJson.daily.precipitation_probability_max[i] ?? 0),
          weatherCode: code,
          icon: info.icon,
          description: info.description,
        });
      }
    }

    const weatherData: PlaceWeather = {
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      weatherCode: current.weather_code,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      weatherType: autoWeatherType,
      windSpeed: Math.round(current.wind_speed_10m),
      aqi: Math.round(aqiValue),
      aqiStatus: aqiStatusInfo.status,
      aqiColor: aqiStatusInfo.color,
      hourlyForecast,
      dailyForecast,
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    return weatherData;
  } catch (err) {
    console.error("[Weather Service] Error fetching weather:", err);
    return null;
  }
}
