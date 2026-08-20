import type { CityWeather } from "./openMeteoClient.js";
import { computeMeltScore, explainScore, MELT_SCORE_FORMULA_VERSION } from "./scoreEngine.js";

export interface CityPayload {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  current: {
    time: string;
    score: number;
    band: string;
    apparentTemperature: number;
    reason: string;
    stale: boolean;
  };
  /** Melt Score for each of the next hours, starting at `current.time`, one entry per hour. */
  forward: number[];
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

export function buildPayload(weather: CityWeather[]): MeltPayload {
  const cities: CityPayload[] = weather.map(({ city, current, forward, stale }) => {
    const result = computeMeltScore(current.inputs);
    return {
      id: slugify(city.name, city.country),
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      current: {
        time: current.time,
        score: result.score,
        band: result.band,
        apparentTemperature: Math.round(current.inputs.apparentTemperature * 10) / 10,
        reason: explainScore(current.inputs, result),
        stale,
      },
      forward: forward.map((point) => Math.round(computeMeltScore(point.inputs).score)),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    formulaVersion: MELT_SCORE_FORMULA_VERSION,
    cityCount: cities.length,
    cities,
  };
}
