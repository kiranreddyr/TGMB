/**
 * Melt Score engine.
 *
 * "How warm it feels, minus rain and wind, weighted by time of day."
 *
 * This formula is versioned deliberately (see PRD section 4, "Design
 * principles for the score"): if the weights ever change, historical
 * scores must be recomputed and the version shown alongside them.
 */

export const MELT_SCORE_FORMULA_VERSION = "1.0.0";

export interface WeatherInputs {
  apparentTemperature: number; // °C
  precipitation: number; // mm
  precipitationProbability: number; // 0-100
  windGusts10m: number; // km/h
  cloudCover: number; // 0-100
  isDay: 0 | 1;
  uvIndex: number; // currently unused in v1 scoring, captured for future use
}

export type MeltBand =
  | "Peak melt"
  | "Prime cone weather"
  | "Worth considering"
  | "Only if committed"
  | "Nobody is buying";

export interface MeltScoreResult {
  score: number;
  band: MeltBand;
  formulaVersion: string;
  breakdown: {
    base: number;
    rainFactor: number;
    windFactor: number;
    daypartFactor: number;
    clarityBonus: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** base = f(apparent_temperature) */
function computeBase(apparentTemp: number): number {
  if (apparentTemp < 8) return 0;
  if (apparentTemp <= 30) {
    return 100 * Math.pow((apparentTemp - 8) / 22, 1.3);
  }
  if (apparentTemp <= 36) return 100;
  if (apparentTemp <= 48) {
    // Linear fall from 100 at 36°C to 70 at 48°C.
    return 100 - ((apparentTemp - 36) / (48 - 36)) * 30;
  }
  return 70;
}

/** Precipitation and its probability suppress the score. Checked in order of severity. */
function computeRainFactor(precipitation: number, precipitationProbability: number): number {
  if (precipitation > 0.5) return 0.4;
  if (precipitationProbability > 60) return 0.65;
  if (precipitationProbability >= 30) return 0.85;
  return 1.0;
}

function computeWindFactor(windGusts10m: number): number {
  if (windGusts10m > 45) return 0.8;
  if (windGusts10m > 30) return 0.92;
  return 1.0;
}

function computeDaypartFactor(isDay: 0 | 1): number {
  return isDay === 1 ? 1.0 : 0.7;
}

function computeClarityBonus(cloudCover: number): number {
  if (cloudCover < 30) return 5;
  if (cloudCover > 85) return -5;
  return 0;
}

function bandFor(score: number): MeltBand {
  if (score >= 85) return "Peak melt";
  if (score >= 65) return "Prime cone weather";
  if (score >= 40) return "Worth considering";
  if (score >= 15) return "Only if committed";
  return "Nobody is buying";
}

export function computeMeltScore(inputs: WeatherInputs): MeltScoreResult {
  const base = computeBase(inputs.apparentTemperature);
  const rainFactor = computeRainFactor(inputs.precipitation, inputs.precipitationProbability);
  const windFactor = computeWindFactor(inputs.windGusts10m);
  const daypartFactor = computeDaypartFactor(inputs.isDay);
  const clarityBonus = computeClarityBonus(inputs.cloudCover);

  const rawScore = base * rainFactor * windFactor * daypartFactor + clarityBonus;
  const score = clamp(rawScore, 0, 100);

  return {
    score: Math.round(score * 10) / 10,
    band: bandFor(score),
    formulaVersion: MELT_SCORE_FORMULA_VERSION,
    breakdown: { base, rainFactor, windFactor, daypartFactor, clarityBonus },
  };
}

/** One-line plain-English reason, as required by F3 (city detail card). */
export function explainScore(inputs: WeatherInputs, result: MeltScoreResult): string {
  const tempPart = `${Math.round(inputs.apparentTemperature)}°C`;
  const skyPart =
    inputs.precipitation > 0.5 || inputs.precipitationProbability > 60
      ? "rain around"
      : inputs.cloudCover < 30
        ? "clear"
        : inputs.cloudCover > 85
          ? "overcast"
          : "partly cloudy";
  const windPart = inputs.windGusts10m > 30 ? ", gusty" : "";
  const timePart = inputs.isDay === 1 ? "" : ", but it's night";

  return `${tempPart} and ${skyPart}${windPart}${timePart}.`;
}
