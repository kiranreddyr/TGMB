/**
 * Real per-country age structure, to replace the demand index's flat
 * "65% of any population is age-relevant" assumption with an actual
 * sourced figure per country. Source: World Bank Open Data, indicator
 * SP.POP.1564.TO.ZS ("Population ages 15-64, % of total population"),
 * free and keyless.
 *
 * Coverage is real but not universal — of the ~120 countries in our city
 * list, everything resolves except Svalbard and Taiwan (neither tracked
 * as a separate economy by the World Bank). Missing countries are
 * recorded as null, never silently defaulted — the demand index falls
 * back to the flat assumption only when the real figure is unavailable.
 */

const WORLD_BANK_ENDPOINT = "https://api.worldbank.org/v2/country";
const INDICATOR = "SP.POP.1564.TO.ZS";

interface WorldBankObservation {
  value: number | null;
  date: string;
}

/** Per-country share of population aged 15-64, as a percentage (0-100), or null if unavailable. */
export type AgeStructureByCountry = Map<string, number | null>;

export async function fetchAgeStructure(countryCodes: string[]): Promise<AgeStructureByCountry> {
  const unique = [...new Set(countryCodes)];
  const results: AgeStructureByCountry = new Map();

  await Promise.all(
    unique.map(async (code) => {
      try {
        const url = `${WORLD_BANK_ENDPOINT}/${code}/indicator/${INDICATOR}?format=json&mrnev=1`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Age-structure request failed for ${code}: ${res.status} ${res.statusText}`);
          results.set(code, null);
          return;
        }
        const body = (await res.json()) as [unknown, WorldBankObservation[] | null];
        const observation = body[1]?.[0];
        results.set(code, observation?.value ?? null);
      } catch (err) {
        console.warn(`Age-structure request errored for ${code}:`, err instanceof Error ? err.message : err);
        results.set(code, null);
      }
    }),
  );

  return results;
}
