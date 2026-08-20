import type { City } from "./types.js";
import type { WeatherInputs } from "./scoreEngine.js";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const HOURLY_VARS = [
  "apparent_temperature",
  "precipitation",
  "precipitation_probability",
  "wind_gusts_10m",
  "cloud_cover",
  "is_day",
  "uv_index",
] as const;

interface OpenMeteoHourlyResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    apparent_temperature: number[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_gusts_10m: number[];
    cloud_cover: number[];
    is_day: (0 | 1)[];
    uv_index: number[];
  };
}

export interface CityWeather {
  city: City;
  localTime: string;
  inputs: WeatherInputs;
}

/**
 * Fetches hourly forecast for many cities in a single batched request, per
 * PRD section 5 ("Batching efficiency"): comma-separated lat/lon lists,
 * never one request per city.
 */
export async function fetchWeatherForCities(cities: City[]): Promise<CityWeather[]> {
  if (cities.length === 0) return [];

  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", cities.map((c) => c.lat).join(","));
  url.searchParams.set("longitude", cities.map((c) => c.lon).join(","));
  url.searchParams.set("hourly", HOURLY_VARS.join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as OpenMeteoHourlyResponse | OpenMeteoHourlyResponse[];
  const perCity = Array.isArray(body) ? body : [body];

  if (perCity.length !== cities.length) {
    throw new Error(
      `Open-Meteo returned ${perCity.length} results for ${cities.length} cities — response shape mismatch.`,
    );
  }

  return cities.map((city, i) => toCityWeather(city, perCity[i]!));
}

function toCityWeather(city: City, data: OpenMeteoHourlyResponse): CityWeather {
  const nowKey = localHourKey(new Date(), data.timezone);
  let index = data.hourly.time.indexOf(nowKey);
  if (index === -1) {
    // Fall back to the closest available hour rather than failing outright —
    // matches the PRD's "serve last known good, don't break" posture (section 9).
    index = data.hourly.time.length - 1;
  }

  const at = <T>(arr: T[]): T => {
    const v = arr[index];
    if (v === undefined) throw new Error(`Missing hourly value at index ${index} for ${city.name}`);
    return v;
  };

  return {
    city,
    localTime: data.hourly.time[index] ?? nowKey,
    inputs: {
      apparentTemperature: at(data.hourly.apparent_temperature),
      precipitation: at(data.hourly.precipitation),
      precipitationProbability: at(data.hourly.precipitation_probability),
      windGusts10m: at(data.hourly.wind_gusts_10m),
      cloudCover: at(data.hourly.cloud_cover),
      isDay: at(data.hourly.is_day),
      uvIndex: at(data.hourly.uv_index),
    },
  };
}

/**
 * Builds a "YYYY-MM-DDTHH:00" key matching Open-Meteo's hourly.time format,
 * resolved via the location's real IANA timezone rather than manual offset
 * math (PRD section 9 is explicit about this).
 */
function localHourKey(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:00`;
}
