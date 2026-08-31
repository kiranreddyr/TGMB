/**
 * "Estimated cone buyers today" — an illustrative demand index, not a
 * sales forecast. It combines real data (population, Melt Score, day of
 * week) with named assumptions where no real data exists. Every
 * assumption is listed in DEMAND_INDEX_ASSUMPTIONS and shown in the UI —
 * the point is to demonstrate what a weather+population index could look
 * like, never to claim it's validated or sourced.
 */

// Rough share of a city's population in an age range that plausibly buys
// ice cream on their own initiative. Assumption, not sourced demographic data.
const AGE_RELEVANT_FRACTION = 0.65;

// Of that age-relevant population, the share who'd actually buy on a
// PERFECT (100) Melt Score day — a ceiling, not everyone buys even in
// perfect weather. Assumption.
const PEAK_DAY_BUY_RATE = 0.12;

// How sharply propensity falls off as the Melt Score drops from 100.
// Below 1 = diminishing returns at the top end — going from 60 to 90
// changes behaviour more than going from 90 to 100 does.
const PROPENSITY_CURVE_GAMMA = 0.7;

// Weekend leisure-spend bump over an ordinary weekday. Assumption.
const WEEKEND_MULTIPLIER = 1.3;

export const DEMAND_INDEX_ASSUMPTIONS: Array<{ label: string; value: string; note: string }> = [
  {
    label: "Age-relevant share of population",
    value: `${Math.round(AGE_RELEVANT_FRACTION * 100)}%`,
    note: "Assumption — not sourced demographic data.",
  },
  {
    label: "Peak-day buy rate",
    value: `${Math.round(PEAK_DAY_BUY_RATE * 100)}%`,
    note: "Assumption — share of the age-relevant population who'd buy on a perfect (100) Melt Score day.",
  },
  {
    label: "Propensity curve",
    value: `(score / 100) ^ ${PROPENSITY_CURVE_GAMMA}`,
    note: "Diminishing returns near the top of the score range, not a straight line.",
  },
  {
    label: "Weekend multiplier",
    value: `× ${WEEKEND_MULTIPLIER}`,
    note: "Assumption — leisure-spend bump on Saturdays and Sundays.",
  },
];

/** Weekday from an already-localized "YYYY-MM-DDTHH:mm" string — reads the calendar date directly, no timezone re-interpretation. */
export function isWeekendAt(localTimeIso: string): boolean {
  const datePart = localTimeIso.split("T")[0] ?? "";
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return false;
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

export function computeDemandIndex(population: number, meltScore: number, isWeekend: boolean): number {
  const propensity = PEAK_DAY_BUY_RATE * Math.pow(Math.max(0, meltScore) / 100, PROPENSITY_CURVE_GAMMA);
  const dayMultiplier = isWeekend ? WEEKEND_MULTIPLIER : 1;
  return Math.round(population * AGE_RELEVANT_FRACTION * propensity * dayMultiplier);
}
