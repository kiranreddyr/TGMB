import type { CityWeather } from "./openMeteoClient.js";
import { computeMeltScore, explainScore, MELT_SCORE_FORMULA_VERSION } from "./scoreEngine.js";
import { describeWeatherCode } from "./weatherCode.js";
import { holidayOn, type HolidaysByCountry } from "./holidaysClient.js";
import type { AgeStructureByCountry } from "./ageStructureClient.js";

export interface CityPayload {
  id: string;
  /** City-name-only slug for /city/[slug] permalinks — safe because all 213 tracked city names are currently unique; buildPayload throws if that ever stops being true. */
  slug: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  population: number;
  /** % of this country's population aged 15-64 (World Bank), or null when that country isn't covered — falls back to a flat assumption, never guessed. */
  ageRelevantSharePercent: number | null;
  current: {
    time: string;
    score: number;
    band: string;
    apparentTemperature: number;
    reason: string;
    stale: boolean;
    /** true/false when this country's public holidays are covered by the API, null when unknown — never guessed. */
    isPublicHoliday: boolean | null;
    holidayName: string | null;
  };
  /** Basic hourly forecast for the next hours, starting at `current.time`. */
  forward: Array<{
    time: string;
    score: number;
    apparentTemperature: number;
    precipitationProbability: number;
  }>;
  /** Basic daily outlook, starting today. */
  daily: Array<{
    date: string;
    condition: string;
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbabilityMax: number;
  }>;
  /** First hour in the next 7 days scoring "Peak melt" (>=85) — null if none this week. */
  nextPeakWindow: { time: string; score: number } | null;
  /** 1-indexed rank by current score among all tracked cities, hottest first — ties share a rank. */
  rank: number;
}

export interface MeltPayload {
  generatedAt: string;
  formulaVersion: string;
  cityCount: number;
  cities: CityPayload[];
}

export function slugify(name: string, country: string): string {
  return `${name}-${country}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function citySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPayload(
  weather: CityWeather[],
  holidays: HolidaysByCountry = new Map(),
  ageStructure: AgeStructureByCountry = new Map(),
): MeltPayload {
  const cities: CityPayload[] = weather.map(({ city, current, forward, daily, nextPeakWindow, stale }) => {
    const result = computeMeltScore(current.inputs);
    const countryHolidays = holidays.get(city.countryCode) ?? null;
    const todayLocalDate = current.time.split("T")[0] ?? "";
    const matchedHoliday = countryHolidays ? holidayOn(countryHolidays, todayLocalDate) : null;
    return {
      id: slugify(city.name, city.country),
      slug: citySlug(city.name),
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      population: city.population,
      ageRelevantSharePercent: ageStructure.get(city.countryCode) ?? null,
      current: {
        time: current.time,
        score: result.score,
        band: result.band,
        apparentTemperature: Math.round(current.inputs.apparentTemperature * 10) / 10,
        reason: explainScore(current.inputs, result),
        stale,
        isPublicHoliday: countryHolidays === null ? null : !!matchedHoliday,
        holidayName: matchedHoliday?.name ?? null,
      },
      forward: forward.map((point) => ({
        time: point.time,
        score: Math.round(computeMeltScore(point.inputs).score),
        apparentTemperature: Math.round(point.inputs.apparentTemperature * 10) / 10,
        precipitationProbability: point.inputs.precipitationProbability,
      })),
      daily: daily.map((day) => ({
        date: day.date,
        condition: describeWeatherCode(day.weatherCode),
        temperatureMax: Math.round(day.temperatureMax * 10) / 10,
        temperatureMin: Math.round(day.temperatureMin * 10) / 10,
        precipitationProbabilityMax: day.precipitationProbabilityMax,
      })),
      nextPeakWindow: nextPeakWindow ? { time: nextPeakWindow.time, score: Math.round(nextPeakWindow.score) } : null,
      rank: 0, // filled in below, once every city's score is known
    };
  });

  // Competition ranking (ties share a rank, the next distinct score skips
  // ahead) over the just-built array, so `rank` doesn't depend on the
  // input order of `weather`.
  const byScoreDesc = [...cities].sort((a, b) => b.current.score - a.current.score);
  let rank = 0;
  let lastScore: number | null = null;
  byScoreDesc.forEach((city, i) => {
    if (city.current.score !== lastScore) {
      rank = i + 1;
      lastScore = city.current.score;
    }
    city.rank = rank;
  });

  const seenSlugs = new Set<string>();
  for (const city of cities) {
    if (seenSlugs.has(city.slug)) {
      throw new Error(
        `City slug collision: "${city.slug}" (from "${city.name}") is no longer unique — /city/${city.slug} permalinks require unique city names.`,
      );
    }
    seenSlugs.add(city.slug);
  }

  return {
    generatedAt: new Date().toISOString(),
    formulaVersion: MELT_SCORE_FORMULA_VERSION,
    cityCount: cities.length,
    cities,
  };
}
