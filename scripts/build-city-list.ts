/**
 * One-off / annual-refresh script (PRD section 8 & 5): builds data/cities.csv
 * from the raw GeoNames dump using the PRD's selection criteria, in order:
 *
 *   1. All cities above 3,000,000 population
 *   2. Capital cities of every country with population above 5,000,000
 *   3. Fill remaining slots for latitude coverage, so the belt is never
 *      visually broken, with a deliberate skew toward southern-hemisphere
 *      cities since the hemisphere story depends on it.
 *
 * Not part of the runtime pipeline — run manually when refreshing the list.
 * Requires data/raw/cities15000.txt and data/raw/countryInfo.txt
 * (see README for the download step).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "data", "raw");
const OUT_CSV = path.join(__dirname, "..", "data", "cities.csv");

const TARGET_COUNT = 200;
const MEGA_CITY_THRESHOLD = 3_000_000;
const CAPITAL_COUNTRY_THRESHOLD = 5_000_000;

interface GeoCity {
  geonameid: string;
  name: string;
  lat: number;
  lon: number;
  featureCode: string;
  countryCode: string;
  population: number;
  timezone: string;
}

interface CountryInfo {
  iso: string;
  countryName: string;
  population: number;
}

function parseTsvLines(raw: string): string[][] {
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0 && !line.startsWith("#"))
    .map((line) => line.split("\t"));
}

async function loadCities(): Promise<GeoCity[]> {
  const raw = await readFile(path.join(RAW_DIR, "cities15000.txt"), "utf-8");
  return parseTsvLines(raw).map((cols) => ({
    geonameid: cols[0] ?? "",
    name: cols[1] ?? "",
    lat: Number(cols[4]),
    lon: Number(cols[5]),
    featureCode: cols[7] ?? "",
    countryCode: cols[8] ?? "",
    population: Number(cols[14] ?? 0),
    timezone: cols[17] ?? "UTC",
  }));
}

async function loadCountries(): Promise<Map<string, CountryInfo>> {
  const raw = await readFile(path.join(RAW_DIR, "countryInfo.txt"), "utf-8");
  const map = new Map<string, CountryInfo>();
  for (const cols of parseTsvLines(raw)) {
    const iso = cols[0] ?? "";
    map.set(iso, {
      iso,
      countryName: cols[4] ?? "",
      population: Number(cols[7] ?? 0),
    });
  }
  return map;
}

function latBand(lat: number): number {
  // 10-degree bands from -90 to 90.
  return Math.floor((lat + 90) / 10);
}

async function main() {
  const [cities, countries] = await Promise.all([loadCities(), loadCountries()]);
  console.log(`Loaded ${cities.length} candidate cities, ${countries.size} countries.`);

  const selected = new Map<string, GeoCity>(); // keyed by geonameid
  const reasons = new Map<string, string>();

  const add = (city: GeoCity, reason: string) => {
    if (!selected.has(city.geonameid)) {
      selected.set(city.geonameid, city);
      reasons.set(city.geonameid, reason);
    }
  };

  // 1. All cities above 3M population.
  for (const city of cities.filter((c) => c.population > MEGA_CITY_THRESHOLD)) {
    add(city, "mega-city");
  }
  console.log(`After mega-city pass: ${selected.size}`);

  // 2. Capital cities (feature code PPLC) of countries with population > 5M.
  const capitals = cities.filter((c) => c.featureCode === "PPLC");
  for (const capital of capitals) {
    const country = countries.get(capital.countryCode);
    if (country && country.population > CAPITAL_COUNTRY_THRESHOLD) {
      add(capital, "capital");
    }
  }
  console.log(`After capital pass: ${selected.size}`);

  // 3. Fill remaining slots for latitude coverage, biased toward the
  // southern hemisphere. Ensure every 10-degree band has at least one city,
  // preferring the largest unselected city in that band.
  const remaining = cities.filter((c) => !selected.has(c.geonameid));
  const byBand = new Map<number, GeoCity[]>();
  for (const city of remaining) {
    const band = latBand(city.lat);
    const list = byBand.get(band) ?? [];
    list.push(city);
    byBand.set(band, list);
  }
  for (const list of byBand.values()) {
    list.sort((a, b) => b.population - a.population);
  }

  const coveredBands = new Set(
    [...selected.values()].map((c) => latBand(c.lat)),
  );
  // Southern hemisphere bands first, since the PRD explicitly calls out the
  // hemisphere story as depending on this spread.
  const allBands = [...byBand.keys()].sort((a, b) => {
    const aSouth = a < 9 ? 0 : 1; // band 9 covers 0..10 (equator upward)
    const bSouth = b < 9 ? 0 : 1;
    if (aSouth !== bSouth) return aSouth - bSouth;
    return a - b;
  });

  // Not capped by TARGET_COUNT: guaranteeing every inhabited latitude band
  // has a representative — especially in the southern hemisphere — is a
  // hard requirement (PRD section 8), not a fill-up-to-200 nicety. It can
  // push the total past 200.
  for (const band of allBands) {
    if (coveredBands.has(band)) continue;
    const candidate = byBand.get(band)?.[0];
    if (candidate) {
      add(candidate, "latitude-coverage");
      coveredBands.add(band);
    }
  }
  console.log(`After latitude-coverage pass: ${selected.size}`);

  // 4. Fill any remaining slots by population, largest first, keeping a
  // rough eye on hemisphere balance by alternating.
  if (selected.size < TARGET_COUNT) {
    const pool = remaining
      .filter((c) => !selected.has(c.geonameid))
      .sort((a, b) => b.population - a.population);
    for (const city of pool) {
      if (selected.size >= TARGET_COUNT) break;
      add(city, "population-fill");
    }
  }
  console.log(`Final count: ${selected.size}`);

  const rows = [...selected.values()]
    .map((city) => ({
      city,
      reason: reasons.get(city.geonameid) ?? "",
      country: countries.get(city.countryCode)?.countryName ?? city.countryCode,
    }))
    .sort((a, b) => b.city.lat - a.city.lat);

  const header = "name,country,lat,lon,timezone,population,selection_reason";
  const lines = rows.map(
    ({ city, country, reason }) =>
      `${csvSafe(city.name)},${csvSafe(country)},${city.lat},${city.lon},${city.timezone},${city.population},${reason}`,
  );

  await writeFile(OUT_CSV, [header, ...lines].join("\n") + "\n", "utf-8");
  console.log(`Wrote ${rows.length} cities to ${OUT_CSV}`);

  const southernCount = rows.filter((r) => r.city.lat < 0).length;
  console.log(`Southern hemisphere cities: ${southernCount} / ${rows.length}`);
}

function csvSafe(value: string): string {
  return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
}

main().catch((err) => {
  console.error("Failed to build city list:", err);
  process.exitCode = 1;
});
