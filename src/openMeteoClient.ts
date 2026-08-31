import type { City } from "./types.js";
import type { WeatherInputs } from "./scoreEngine.js";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/** Cities per request. Open-Meteo batches lat/lon lists in one call, but we
 * chunk rather than send all ~200 in a single URL — per PRD section 5,
 * "a small number of requests, not 200," not "one request." */
const DEFAULT_BATCH_SIZE = 50;

/** 7 days of hourly + daily data: comfortably covers the 48h-forward hourly
 * slice (worst case, "now" at hour 23 of day 1, needs through hour 71) with
 * room to spare, and gives a full week for the daily outlook. Requesting
 * more hourly days than we use for `forward` costs the fetch job a slightly
 * larger response to parse — it does not affect the payload we publish,
 * since `forward` still only slices the first 48 hours. */
const FORECAST_DAYS = 7;
const FORWARD_HOURS = 48;

const HOURLY_VARS = [
  "apparent_temperature",
  "precipitation",
  "precipitation_probability",
  "wind_gusts_10m",
  "cloud_cover",
  "is_day",
  "uv_index",
] as const;

const DAILY_VARS = ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"] as const;

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
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export interface HourPoint {
  time: string;
  inputs: WeatherInputs;
}

export interface DayPoint {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
}

export interface CityWeather {
  city: City;
  current: HourPoint;
  /** Up to 48 hourly points starting at the current hour, for sparklines. */
  forward: HourPoint[];
  /** Up to 7 daily points starting today, for a basic multi-day outlook. */
  daily: DayPoint[];
  stale: boolean;
}

export interface FetchOptions {
  batchSize?: number;
}

/**
 * Fetches hourly forecast for many cities, batched per PRD section 5
 * ("Batching efficiency"): comma-separated lat/lon lists, chunked into a
 * small number of requests rather than one per city.
 */
export async function fetchWeatherForCities(
  cities: City[],
  options: FetchOptions = {},
): Promise<CityWeather[]> {
  if (cities.length === 0) return [];
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

  const results: CityWeather[] = [];
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    const batchResults = await fetchBatch(batch);
    results.push(...batchResults);
  }
  return results;
}

async function fetchBatch(cities: City[]): Promise<CityWeather[]> {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", cities.map((c) => c.lat).join(","));
  url.searchParams.set("longitude", cities.map((c) => c.lon).join(","));
  url.searchParams.set("hourly", HOURLY_VARS.join(","));
  url.searchParams.set("daily", DAILY_VARS.join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));

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
  const stale = index === -1;
  if (stale) {
    // Fall back to the closest available hour rather than failing outright —
    // matches the PRD's "serve last known good, don't break" posture (section 9).
    index = data.hourly.time.length - 1;
  }

  const pointAt = (i: number): HourPoint => ({
    time: data.hourly.time[i] ?? nowKey,
    inputs: {
      apparentTemperature: at(data.hourly.apparent_temperature, i, city.name),
      precipitation: at(data.hourly.precipitation, i, city.name),
      precipitationProbability: at(data.hourly.precipitation_probability, i, city.name),
      windGusts10m: at(data.hourly.wind_gusts_10m, i, city.name),
      cloudCover: at(data.hourly.cloud_cover, i, city.name),
      isDay: at(data.hourly.is_day, i, city.name),
      uvIndex: at(data.hourly.uv_index, i, city.name),
    },
  });

  const forwardEnd = Math.min(index + FORWARD_HOURS, data.hourly.time.length);
  const forward: HourPoint[] = [];
  for (let i = index; i < forwardEnd; i++) {
    forward.push(pointAt(i));
  }

  const daily: DayPoint[] = data.daily.time.map((date, i) => ({
    date,
    weatherCode: at(data.daily.weather_code, i, city.name),
    temperatureMax: at(data.daily.temperature_2m_max, i, city.name),
    temperatureMin: at(data.daily.temperature_2m_min, i, city.name),
    precipitationProbabilityMax: at(data.daily.precipitation_probability_max, i, city.name),
  }));

  return {
    city,
    current: pointAt(index),
    forward,
    daily,
    stale,
  };
}

function at<T>(arr: T[], index: number, cityName: string): T {
  const v = arr[index];
  if (v === undefined) throw new Error(`Missing hourly value at index ${index} for ${cityName}`);
  return v;
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
