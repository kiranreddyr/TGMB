/**
 * Public holidays, per country, for the demand index's day-type factor
 * (PRD-adjacent feature — see the Demand Index section). Source:
 * date.nager.at, free and keyless, no non-commercial restriction stated.
 *
 * Coverage is real but partial — as of writing, roughly 100 of the ~120
 * countries in our city list have data; notably India, Pakistan, Thailand,
 * and several Gulf/Central Asian countries return no data. A missing
 * country is recorded as "unknown", never silently treated as "not a
 * holiday" — the demand index falls back to its weekday/weekend factor
 * when holiday status is unknown, rather than guessing.
 */

const HOLIDAYS_ENDPOINT = "https://date.nager.at/api/v3/PublicHolidays";

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

/** Per-country holiday list for a year, or null if this country isn't covered by the API. */
export type HolidaysByCountry = Map<string, Holiday[] | null>;

export async function fetchHolidays(countryCodes: string[], year: number): Promise<HolidaysByCountry> {
  const unique = [...new Set(countryCodes)];
  const results: HolidaysByCountry = new Map();

  await Promise.all(
    unique.map(async (code) => {
      try {
        const res = await fetch(`${HOLIDAYS_ENDPOINT}/${year}/${code}`);
        if (res.status === 204) {
          results.set(code, null); // no data for this country — not "no holidays"
          return;
        }
        if (!res.ok) {
          console.warn(`Holidays request failed for ${code}: ${res.status} ${res.statusText}`);
          results.set(code, null);
          return;
        }
        const body = (await res.json()) as Array<{ date: string; name: string }>;
        results.set(
          code,
          body.map((h) => ({ date: h.date, name: h.name })),
        );
      } catch (err) {
        console.warn(`Holidays request errored for ${code}:`, err instanceof Error ? err.message : err);
        results.set(code, null);
      }
    }),
  );

  return results;
}

/** Looks up whether `localDate` (YYYY-MM-DD, already resolved to the city's own timezone) is a holiday. */
export function holidayOn(holidays: Holiday[] | null | undefined, localDate: string): Holiday | null {
  if (!holidays) return null;
  return holidays.find((h) => h.date === localDate) ?? null;
}
