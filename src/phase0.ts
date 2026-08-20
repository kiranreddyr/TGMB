/**
 * Phase 0 spike (PRD section 12 & 14).
 *
 * Fetch ~10 cities, compute Melt Scores, print a table. The whole point is
 * to eyeball whether the formula produces intuitively correct results
 * across a wide latitude spread before a single line of frontend code gets
 * written. If Reykjavik in August and Dubai in January both look right,
 * the model holds.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadCities } from "./loadCities.js";
import { fetchWeatherForCities } from "./openMeteoClient.js";
import { computeMeltScore, explainScore, MELT_SCORE_FORMULA_VERSION } from "./scoreEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CITIES_CSV = path.join(__dirname, "..", "data", "cities-sample.csv");

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value + " ".repeat(width - value.length);
}

async function main() {
  const cities = await loadCities(CITIES_CSV);
  console.log(`Loaded ${cities.length} cities from ${CITIES_CSV}`);
  console.log(`Melt Score formula version: ${MELT_SCORE_FORMULA_VERSION}\n`);

  const weather = await fetchWeatherForCities(cities);

  const rows = weather
    .map(({ city, localTime, inputs }) => {
      const result = computeMeltScore(inputs);
      const reason = explainScore(inputs, result);
      return { city, localTime, inputs, result, reason };
    })
    .sort((a, b) => b.city.lat - a.city.lat); // north to south, so the latitude gradient is visible at a glance

  const headers = ["City", "Lat", "Local time", "Feels like", "Score", "Band", "Reason"];
  const widths = [14, 6, 18, 11, 7, 20, 40];

  console.log(headers.map((h, i) => pad(h, widths[i]!)).join(" "));
  console.log(widths.map((w) => "-".repeat(w)).join(" "));

  for (const row of rows) {
    const cells = [
      `${row.city.name}, ${row.city.country}`,
      row.city.lat.toFixed(1),
      row.localTime,
      `${row.inputs.apparentTemperature.toFixed(1)}°C`,
      row.result.score.toFixed(1),
      row.result.band,
      row.reason,
    ];
    console.log(cells.map((c, i) => pad(String(c), widths[i]!)).join(" "));
  }

  console.log(
    "\nSanity check: does the score gradient track intuition across latitudes? " +
      "(polar/winter cities low, dry warm-afternoon cities high, rain/wind/night suppressed)",
  );
}

main().catch((err) => {
  console.error("Phase 0 spike failed:", err);
  process.exitCode = 1;
});
