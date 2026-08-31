/**
 * The hourly job (PRD section 7, "Architecture"): fetch -> score -> single
 * static JSON payload. Designed to be invoked by a scheduler (GitHub Actions
 * cron in v1) with no state beyond the output file it writes.
 *
 * The frontend must never call Open-Meteo directly — it reads this one file.
 */
import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCities } from "./loadCities.js";
import { fetchWeatherForCities } from "./openMeteoClient.js";
import { fetchHolidays } from "./holidaysClient.js";
import { fetchAgeStructure } from "./ageStructureClient.js";
import { buildPayload } from "./buildPayload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CITIES_CSV = path.join(__dirname, "..", "data", "cities.csv");
const OUTPUT_DIR = path.join(__dirname, "..", "data", "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "melt-payload.json");

/** Target from PRD section 7: under 500 KB gzipped for ~200 cities with 48h forward series. */
const PAYLOAD_SIZE_BUDGET_BYTES = 500 * 1024;

async function main() {
  const cities = await loadCities(CITIES_CSV);
  console.log(`Loaded ${cities.length} cities from ${CITIES_CSV}`);

  const started = Date.now();
  const weather = await fetchWeatherForCities(cities);
  console.log(`Fetched weather for ${weather.length} cities in ${Date.now() - started}ms`);

  const staleCities = weather.filter((w) => w.stale);
  if (staleCities.length > 0) {
    console.warn(
      `${staleCities.length} cities served with a fallback hour (no exact "now" match): ` +
        staleCities.map((w) => w.city.name).join(", "),
    );
  }

  const holidayStarted = Date.now();
  const countryCodes = cities.map((c) => c.countryCode).filter(Boolean);
  const holidays = await fetchHolidays(countryCodes, new Date().getFullYear());
  const uncovered = [...holidays.entries()].filter(([, list]) => list === null).length;
  console.log(
    `Fetched public holidays for ${holidays.size} countries in ${Date.now() - holidayStarted}ms ` +
      `(${uncovered} not covered by the API — treated as unknown, not "no holiday")`,
  );

  const ageStructureStarted = Date.now();
  const ageStructure = await fetchAgeStructure(countryCodes);
  const ageUncovered = [...ageStructure.values()].filter((v) => v === null).length;
  console.log(
    `Fetched age-structure data for ${ageStructure.size} countries in ${Date.now() - ageStructureStarted}ms ` +
      `(${ageUncovered} not covered — falls back to the flat assumption)`,
  );

  const payload = buildPayload(weather, holidays, ageStructure);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const json = JSON.stringify(payload);
  await writeFile(OUTPUT_FILE, json, "utf-8");

  const rawBytes = Buffer.byteLength(json, "utf-8");
  const gzipBytes = gzipSync(json).length;
  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(`Payload size: ${(rawBytes / 1024).toFixed(1)} KB raw, ${(gzipBytes / 1024).toFixed(1)} KB gzipped`);

  if (gzipBytes > PAYLOAD_SIZE_BUDGET_BYTES) {
    console.warn(
      `Payload exceeds the ${(PAYLOAD_SIZE_BUDGET_BYTES / 1024).toFixed(0)} KB gzipped budget from the PRD. ` +
        "Consider splitting into a light payload + lazy-loaded detail payload (PRD section 7).",
    );
  }
}

main().catch((err) => {
  console.error("Hourly job failed:", err);
  process.exitCode = 1;
});
