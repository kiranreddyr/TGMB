import { readFile } from "node:fs/promises";
import type { City } from "./types.js";

/** Minimal CSV parser — good enough for our own unquoted, comma-only city list. */
export async function loadCities(csvPath: string): Promise<City[]> {
  const raw = await readFile(csvPath, "utf-8");
  const lines = raw.trim().split("\n").filter((line) => line.trim().length > 0);
  const [header, ...rows] = lines;
  if (!header) return [];
  const columns = header.split(",").map((c) => c.trim());

  return rows.map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const record = Object.fromEntries(columns.map((col, i) => [col, cells[i]]));
    return {
      name: record.name ?? "",
      country: record.country ?? "",
      lat: Number(record.lat),
      lon: Number(record.lon),
      timezone: record.timezone ?? "UTC",
    };
  });
}
