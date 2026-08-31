import { readFileSync } from "node:fs";
import path from "node:path";
import type { MeltPayload } from "./payload";

/**
 * Reads the synced payload directly off disk for static generation
 * (generateStaticParams / generateMetadata / server components) — these
 * run at build time, before there's any server to fetch() from, and
 * `npm run sync-web-data` has already copied the file into public/ by the
 * time `next build` runs (see the deploy workflow).
 */
export function loadPayloadAtBuildTime(): MeltPayload | null {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "melt-payload.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as MeltPayload;
  } catch {
    return null;
  }
}
