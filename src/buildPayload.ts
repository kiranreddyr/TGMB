import type { CityWeather } from "./openMeteoClient.js";
import { computeMeltScore, explainScore, MELT_SCORE_FORMULA_VERSION } from "./scoreEngine.js";
import { describeWeatherCode } from "./weatherCode.js";

export interface CityPayload {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  population: number;
  current: {
    time: string;
    score: number;
    band: string;
    apparentTemperature: number;
    reason: string;
    stale: boolean;
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
  const cities: CityPayload[] = weather.map(({ city, current, forward, daily, stale }) => {
    const result = computeMeltScore(current.inputs);
    return {
      id: slugify(city.name, city.country),
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      population: city.population,
      current: {
        time: current.time,
        score: result.score,
        band: result.band,
        apparentTemperature: Math.round(current.inputs.apparentTemperature * 10) / 10,
        reason: explainScore(current.inputs, result),
        stale,
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
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    formulaVersion: MELT_SCORE_FORMULA_VERSION,
    cityCount: cities.length,
    cities,
  };
}
