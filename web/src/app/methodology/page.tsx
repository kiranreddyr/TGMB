"use client";

import Link from "next/link";
import { SCORE_BANDS } from "@/lib/payload";
import { useMeltPayload } from "@/lib/useMeltPayload";
import styles from "./page.module.css";

const FORMULA_INPUTS = [
  { field: "apparent_temperature", role: "Primary driver — already accounts for humidity, wind and radiation" },
  { field: "precipitation", role: "Suppressor" },
  { field: "precipitation_probability", role: "Suppressor" },
  { field: "wind_gusts_10m", role: "Suppressor" },
  { field: "cloud_cover", role: "Minor bonus when clear, minor penalty when overcast" },
  { field: "is_day", role: "Time of day weighting" },
  { field: "uv_index", role: "Captured, not yet weighted in the v1 formula" },
];

const FORMULA_TEXT = `base = f(apparent_temperature)

  < 8°C     -> 0
  8-30°C    -> 100 * ((T - 8) / 22) ^ 1.3
  30-36°C   -> 100 (the plateau)
  36-48°C   -> falls from 100 to 70
  > 48°C    -> 70

rain_factor        wind_factor          daypart_factor
  >0.5mm  -> 0.40    >45km/h -> 0.80      is_day   -> 1.00
  >60%    -> 0.65    >30km/h -> 0.92      is_night -> 0.70
  30-60%  -> 0.85    else    -> 1.00
  else    -> 1.00

clarity_bonus: cloud_cover <30% -> +5, >85% -> -5

melt_score = clamp(0, 100,
  (base * rain_factor * wind_factor * daypart_factor) + clarity_bonus)`;

const DATA_SOURCES = [
  {
    name: "Open-Meteo",
    description: "Hourly forecast weather, global coverage, no key required for non-commercial use.",
    license: "CC BY 4.0",
    wide: false,
  },
  {
    name: "GeoNames",
    description: "cities15000 dataset — the static, annually refreshed city list.",
    license: "CC BY 4.0",
    wide: false,
  },
  {
    name: "Natural Earth",
    description: "Country and coastline geometry for the globe, at 1:110m.",
    license: "Public domain",
    wide: true,
  },
];

export default function MethodologyPage() {
  const { payload } = useMeltPayload();
  const formulaVersion = payload?.formulaVersion ?? "1.0.0";

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backButton}>
        ← Back to the globe
      </Link>

      <div className={styles.eyebrow}>Methodology · v{formulaVersion}</div>
      <h1 className={styles.title}>How the Melt Score works</h1>
      <p className={styles.tagline}>How warm it feels, minus rain and wind, weighted by time of day.</p>

      <div className={styles.body}>
        <p>
          A single 0–100 score is computed per city, per hour, from live Open-Meteo forecast data. It is
          deliberately simple and explainable, and it is never tuned to flatter any one market — if a city scores
          low, that&rsquo;s the point.
        </p>
        <p>
          The formula is versioned. If the weights ever change, historical scores are recomputed and the version
          number above updates.
        </p>
      </div>

      <div className={styles.sectionLabel}>Inputs</div>
      <div className={styles.inputsTable}>
        {FORMULA_INPUTS.map((input) => (
          <div className={styles.inputRow} key={input.field}>
            <span className={styles.inputField}>{input.field}</span>
            <span className={styles.inputRole}>{input.role}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionLabel}>The formula</div>
      <pre className={styles.formula}>{FORMULA_TEXT}</pre>

      <div className={styles.sectionLabel}>Score bands</div>
      <div className={styles.bandsTable}>
        {SCORE_BANDS.map((band) => (
          <div className={styles.bandRow} key={band.band}>
            <span className={styles.bandSwatch} style={{ background: band.color }} />
            <span className={styles.bandRange}>
              {band.min}–{band.max}
            </span>
            <span className={styles.bandLabel}>{band.band}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionLabel}>Data sources</div>
      <div className={styles.sourcesGrid}>
        {DATA_SOURCES.map((source) => (
          <div className={`${styles.sourceCard} ${source.wide ? styles.sourceCardWide : ""}`} key={source.name}>
            <div className={styles.sourceName}>{source.name}</div>
            <div className={styles.sourceDesc}>{source.description}</div>
            <div className={styles.sourceLicense}>{source.license}</div>
          </div>
        ))}
      </div>

      <p className={styles.footer}>
        Weather data by{" "}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>
        , licensed CC BY 4.0. City data from GeoNames, licensed CC BY 4.0. This is an independent personal project
        &mdash; no employer branding, no employer data, no commercial monetisation.
      </p>
    </div>
  );
}
