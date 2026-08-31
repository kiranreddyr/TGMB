import type { CityPayload } from "./payload";

/**
 * "Estimated cone buyers today" — an illustrative demand index, not a
 * sales forecast. It combines real data (population, Melt Score, day
 * type — weekday, weekend, or an actual public holiday where known) with
 * named assumptions where no real data exists. Every assumption is
 * listed in DEMAND_INDEX_ASSUMPTIONS and shown in the UI — the point is
 * to demonstrate what a weather+population index could look like, never
 * to claim it's validated or sourced.
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

// Leisure-spend bumps over an ordinary weekday. Still assumptions — what's
// real is *which day is which*, sourced from actual calendars, not these
// multiplier sizes.
const WEEKEND_MULTIPLIER = 1.3;
const HOLIDAY_MULTIPLIER = 1.4;

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
    label: "Weekend / holiday multiplier",
    value: `× ${WEEKEND_MULTIPLIER} / × ${HOLIDAY_MULTIPLIER}`,
    note: "Assumption for the multiplier size — but which day is a weekend or an actual public holiday is real calendar data, not guessed, where the holiday API covers that country.",
  },
];

export type DayType = "weekday" | "weekend" | "holiday";

/** Weekday from an already-localized "YYYY-MM-DDTHH:mm" string — reads the calendar date directly, no timezone re-interpretation. */
function isWeekendAt(localTimeIso: string): boolean {
  const datePart = localTimeIso.split("T")[0] ?? "";
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return false;
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

/**
 * Real public holiday (when the source API covers this country) takes
 * priority over the weekend check; when holiday status is unknown for
 * this country, falls back to weekday/weekend rather than guessing.
 */
export function getDayType(city: CityPayload): DayType {
  if (city.current.isPublicHoliday) return "holiday";
  if (isWeekendAt(city.current.time)) return "weekend";
  return "weekday";
}

export function computeDemandIndex(population: number, meltScore: number, dayType: DayType): number {
  const propensity = PEAK_DAY_BUY_RATE * Math.pow(Math.max(0, meltScore) / 100, PROPENSITY_CURVE_GAMMA);
  const dayMultiplier = dayType === "holiday" ? HOLIDAY_MULTIPLIER : dayType === "weekend" ? WEEKEND_MULTIPLIER : 1;
  return Math.round(population * AGE_RELEVANT_FRACTION * propensity * dayMultiplier);
}
