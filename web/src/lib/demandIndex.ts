import type { CityPayload } from "./payload";

/**
 * "Estimated cone buyers today" — an illustrative demand index, not a
 * sales forecast. It combines real data (population, Melt Score, day
 * type, and — where the source covers this country — real age-structure
 * data) with named assumptions only where no public data exists. Every
 * factor is listed in buildDemandIndexBreakdown() and shown in the UI,
 * marked real or assumed — the point is to demonstrate what a
 * weather+population index could look like, never to claim it's fully
 * validated.
 */

// Fallback when a country's real age structure isn't available (World
// Bank doesn't track Svalbard or Taiwan as separate economies, etc.).
// Assumption, not sourced demographic data.
const FALLBACK_AGE_RELEVANT_FRACTION = 0.65;

// Of the age-relevant population, the share who'd actually buy on a
// PERFECT (100) Melt Score day — a ceiling, not everyone buys even in
// perfect weather. Assumption — no public dataset records this.
const PEAK_DAY_BUY_RATE = 0.12;

// How sharply propensity falls off as the Melt Score drops from 100.
// Below 1 = diminishing returns at the top end — going from 60 to 90
// changes behaviour more than going from 90 to 100 does. Assumption.
const PROPENSITY_CURVE_GAMMA = 0.7;

// Leisure-spend bumps over an ordinary weekday. Still assumptions — what's
// real is *which day is which*, sourced from actual calendars, not these
// multiplier sizes.
const WEEKEND_MULTIPLIER = 1.3;
const HOLIDAY_MULTIPLIER = 1.4;

export type DayType = "weekday" | "weekend" | "holiday";

export interface DemandFactor {
  label: string;
  value: string;
  note: string;
  sourced: boolean;
}

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

/** World Bank figure when this country is covered, else the flat fallback — never silently guessed as "sourced". */
function ageRelevantFractionFor(city: CityPayload): { fraction: number; sourced: boolean } {
  if (city.ageRelevantSharePercent != null) {
    return { fraction: city.ageRelevantSharePercent / 100, sourced: true };
  }
  return { fraction: FALLBACK_AGE_RELEVANT_FRACTION, sourced: false };
}

export function computeDemandIndex(city: CityPayload): number {
  const { fraction: ageFraction } = ageRelevantFractionFor(city);
  const dayType = getDayType(city);
  const propensity = PEAK_DAY_BUY_RATE * Math.pow(Math.max(0, city.current.score) / 100, PROPENSITY_CURVE_GAMMA);
  const dayMultiplier = dayType === "holiday" ? HOLIDAY_MULTIPLIER : dayType === "weekend" ? WEEKEND_MULTIPLIER : 1;
  return Math.round(city.population * ageFraction * propensity * dayMultiplier);
}

/** Per-city breakdown for the UI — each factor marked real (sourced) or assumed, so the two are never conflated. */
export function buildDemandIndexBreakdown(city: CityPayload): DemandFactor[] {
  const { fraction: ageFraction, sourced: ageSourced } = ageRelevantFractionFor(city);
  const dayType = getDayType(city);

  return [
    {
      label: "Age-relevant share of population",
      value: `${Math.round(ageFraction * 100)}%`,
      note: ageSourced
        ? `Real — World Bank, population ages 15–64, for ${city.country}.`
        : "Assumption — World Bank has no figure for this country, falling back to a flat estimate.",
      sourced: ageSourced,
    },
    {
      label: "Day type",
      value: dayType,
      note:
        dayType === "holiday"
          ? `Real — an actual public holiday${city.current.holidayName ? ` (${city.current.holidayName})` : ""}, from date.nager.at.`
          : city.current.isPublicHoliday === null
            ? "Real calendar date, but this country's holiday status is unknown — the API doesn't cover it, so this falls back to weekday/weekend rather than guessing."
            : "Real — the actual calendar date for this city, confirmed not a public holiday.",
      sourced: dayType !== "weekday" ? true : city.current.isPublicHoliday === false,
    },
    {
      label: "Peak-day buy rate",
      value: `${Math.round(PEAK_DAY_BUY_RATE * 100)}%`,
      note: "Assumption — share of the age-relevant population who'd buy on a perfect (100) Melt Score day. No public dataset records real ice-cream purchase behaviour.",
      sourced: false,
    },
    {
      label: "Propensity curve",
      value: `(score / 100) ^ ${PROPENSITY_CURVE_GAMMA}`,
      note: "Assumption — diminishing returns near the top of the score range, not calibrated against real behaviour data.",
      sourced: false,
    },
    {
      label: "Weekend / holiday multiplier size",
      value: `× ${WEEKEND_MULTIPLIER} / × ${HOLIDAY_MULTIPLIER}`,
      note: "Assumption — which day is a weekend or holiday is real (above), but how much more people buy on one is not sourced.",
      sourced: false,
    },
  ];
}
