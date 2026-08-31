// Mirrors src/buildPayload.ts in the repo root pipeline. Kept as a separate
// copy since web/ is its own npm project (no shared workspace in v1) — if
// the payload shape changes, update both.

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

export const BAND_COLORS: Record<string, string> = {
  "Peak melt": "#FFC94A",
  "Prime cone weather": "#FF9F45",
  "Worth considering": "#F5E6C8",
  "Only if committed": "#6E8CA8",
  "Nobody is buying": "#1B2A4A",
};

/** Score bands, hottest first — single source of truth for the legend, the leaderboard, and point/heatmap coloring. */
export const SCORE_BANDS = [
  { band: "Peak melt", min: 85, max: 100, color: BAND_COLORS["Peak melt"]!, description: "Hot, dry, clear — perfect cone weather." },
  { band: "Prime cone weather", min: 65, max: 84, color: BAND_COLORS["Prime cone weather"]!, description: "Warm and pleasant, minor drag from cloud, wind, or rain." },
  { band: "Worth considering", min: 40, max: 64, color: BAND_COLORS["Worth considering"]!, description: "Mild — decent, not a slam dunk." },
  { band: "Only if committed", min: 15, max: 39, color: BAND_COLORS["Only if committed"]!, description: "Cool, wet, or windy — needs real motivation." },
  { band: "Nobody is buying", min: 0, max: 14, color: BAND_COLORS["Nobody is buying"]!, description: "Cold, dark, or stormy." },
] as const;

export function colorForScore(score: number): string {
  if (score >= 85) return BAND_COLORS["Peak melt"]!;
  if (score >= 65) return BAND_COLORS["Prime cone weather"]!;
  if (score >= 40) return BAND_COLORS["Worth considering"]!;
  if (score >= 15) return BAND_COLORS["Only if committed"]!;
  return BAND_COLORS["Nobody is buying"]!;
}

const HEAT_STOPS: Array<{ t: number; rgb: [number, number, number] }> = [
  { t: 0, rgb: [27, 42, 74] }, // deep blue — nobody is buying
  { t: 0.3, rgb: [110, 140, 168] }, // cool grey-blue — only if committed
  { t: 0.55, rgb: [245, 230, 200] }, // soft cream — worth considering
  { t: 0.78, rgb: [255, 159, 69] }, // warm amber — prime cone weather
  { t: 1, rgb: [255, 201, 74] }, // hot gold — peak melt
];

/**
 * Colour for the heatmap "belt" layer. `t` is the density-normalised weight
 * three-globe's KDE produces (0-1), not a raw score — this just needs to
 * read as a smooth cold-to-hot gradient. Opacity fades out at low density so
 * low-score regions don't paint the globe in a flat colour wash.
 */
export function meltHeatColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  let lower = HEAT_STOPS[0]!;
  let upper = HEAT_STOPS[HEAT_STOPS.length - 1]!;
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const a = HEAT_STOPS[i]!;
    const b = HEAT_STOPS[i + 1]!;
    if (clamped >= a.t && clamped <= b.t) {
      lower = a;
      upper = b;
      break;
    }
  }
  const span = upper.t - lower.t || 1;
  const localT = (clamped - lower.t) / span;
  const rgb = lower.rgb.map((channel, i) => Math.round(channel + (upper.rgb[i]! - channel) * localT));
  const opacity = Math.cbrt(clamped);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity.toFixed(3)})`;
}

/** Basepath-aware asset URL — fetch() doesn't auto-prepend Next's basePath. */
export function assetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
