"use client";

import Link from "next/link";
import { SCORE_BANDS, colorForScore } from "@/lib/payload";
import { useMeltPayload } from "@/lib/useMeltPayload";
import styles from "./page.module.css";

const STEPS = [
  {
    title: "Start with how it actually feels",
    body: "Not the thermometer reading — the “feels like” temperature, which already factors in humidity, wind chill and sun exposure. Below 8°C, that's an automatic zero. From 8°C up to 30°C the score climbs on a curve, slowly at first, faster as it warms. Between 30°C and 36°C — the plateau — it holds at a perfect 100. Push past 36°C and comfort starts working against the score, so it eases back down and settles at 70, even in extreme heat.",
    rule: "8–30°C → 100 × ((T − 8) / 22)^1.3   ·   30–36°C → 100   ·   >48°C → 70",
  },
  {
    title: "Rain kills it",
    body: "Actual rain falling right now — more than half a millimetre — cuts the score to 40% of what it was. Just a high chance of rain, over 60%, cuts it to 65%. A moderate chance, 30–60%, trims it to 85%. Clear forecast, no penalty at all.",
    rule: ">0.5mm → ×0.40   ·   >60% chance → ×0.65   ·   30–60% chance → ×0.85",
  },
  {
    title: "Wind takes the edge off",
    body: "Gusts over 45 km/h cut the score to 80% of what it was. Gusts over 30 km/h trim it to 92%. Calmer than that, no penalty.",
    rule: ">45 km/h → ×0.80   ·   >30 km/h → ×0.92",
  },
  {
    title: "Night is quieter, not zero",
    body: "Ice cream doesn't stop existing after dark, but demand drops. Night-time hours are scored at 70% of what the identical conditions would score during the day.",
    rule: "is_day → ×1.00   ·   is_night → ×0.70",
  },
  {
    title: "A small nudge for the sky",
    body: "Clear skies, under 30% cloud cover, add a small +5 point bonus. Heavy overcast, over 85% cloud cover, subtracts 5. Anywhere in between, no change.",
    rule: "<30% cloud → +5   ·   >85% cloud → −5",
  },
  {
    title: "Add it up, keep it in range",
    body: "The temperature curve, the rain factor, the wind factor and the day/night factor all multiply together. The sky nudge is added on top. Whatever comes out is clamped so it can never read below 0 or above 100.",
    rule: "clamp(0, 100, base × rain × wind × daypart + clarity)",
  },
];

const DATA_SOURCES = [
  {
    name: "Open-Meteo",
    tag: "Live weather, every hour",
    description:
      "The forecast API this whole product runs on. One batched call per refresh returns hourly forecasts for every tracked city — no API key needed at this usage volume.",
    endpoint: "api.open-meteo.com/v1/forecast",
    fields: [
      { field: "apparent_temperature", use: "the primary driver — step 1" },
      { field: "precipitation", use: "rain suppressor — step 2" },
      { field: "precipitation_probability", use: "rain suppressor — step 2" },
      { field: "wind_gusts_10m", use: "wind suppressor — step 3" },
      { field: "is_day", use: "day/night factor — step 4" },
      { field: "cloud_cover", use: "sky nudge — step 5" },
      { field: "uv_index", use: "captured, not yet used in v1" },
    ],
    license: "CC BY 4.0",
    wide: true,
  },
  {
    name: "GeoNames",
    tag: "Which cities exist",
    description:
      "The cities15000 dataset — every populated place above 15,000 people, with latitude, longitude, country and timezone. A static list, refreshed annually, not a live call.",
    endpoint: null,
    fields: [],
    license: "CC BY 4.0",
    wide: false,
  },
  {
    name: "Natural Earth",
    tag: "What the globe looks like",
    description: "Country borders and coastlines at 1:110m scale, used to render the globe itself. No live data involved.",
    endpoint: null,
    fields: [],
    license: "Public domain",
    wide: false,
  },
];

export default function MethodologyPage() {
  const { payload } = useMeltPayload();
  const formulaVersion = payload?.formulaVersion ?? "1.0.0";

  const topCity = payload?.cities ? [...payload.cities].sort((a, b) => b.current.score - a.current.score)[0] : null;

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
          A single 0–100 score is computed per city, per hour, from live Open-Meteo forecast data. It&rsquo;s
          deliberately simple enough to explain in one sentence, and it&rsquo;s never tuned to flatter any one
          market — if a city scores low, that&rsquo;s the point, not a bug.
        </p>
        <p>Below is the exact walk from raw weather data to the number and colour you see on the globe.</p>
      </div>

      <div className={styles.sectionLabel}>How we get the numbers</div>
      <div className={styles.curveCard}>
        <ScoreCurveDiagram />
        <div className={styles.curveCaption}>
          The temperature curve at the heart of step 1 — flat zero below 8°C, a climbing curve to the plateau, a
          gentle fall back to 70 above 36°C.
        </div>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li className={styles.step} key={step.title}>
            <div className={styles.stepNumber}>{i + 1}</div>
            <div>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepBody}>{step.body}</p>
              <div className={styles.stepRule}>{step.rule}</div>
            </div>
          </li>
        ))}
      </ol>

      {topCity && (
        <>
          <div className={styles.sectionLabel}>Right now</div>
          <div className={styles.liveExample}>
            <div className={styles.liveScore} style={{ color: colorForScore(topCity.current.score) }}>
              {Math.round(topCity.current.score)}
            </div>
            <div>
              <div className={styles.liveCity}>
                {topCity.name}, {topCity.country}
              </div>
              <p className={styles.liveReason}>
                {topCity.current.reason} That works out to a{" "}
                <strong style={{ color: colorForScore(topCity.current.score) }}>{topCity.current.band}</strong> score
                of {topCity.current.score.toFixed(1)} — the highest of any tracked city this hour.
              </p>
            </div>
          </div>
        </>
      )}

      <div className={styles.sectionLabel}>Score bands</div>
      <div className={styles.bandBar}>
        {SCORE_BANDS.slice()
          .reverse()
          .map((band) => (
            <div key={band.band} className={styles.bandSegment} style={{ background: band.color, flexGrow: band.max - band.min + 1 }} />
          ))}
      </div>
      <div className={styles.bandBarLabels}>
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
      <div className={styles.bandsTable}>
        {SCORE_BANDS.map((band) => (
          <div className={styles.bandRow} key={band.band}>
            <span className={styles.bandSwatch} style={{ background: band.color }} />
            <span className={styles.bandRange}>
              {band.min}–{band.max}
            </span>
            <span className={styles.bandLabel}>{band.band}</span>
            <span className={styles.bandDescription}>{band.description}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionLabel}>Where the numbers come from</div>
      <div className={styles.sourcesGrid}>
        {DATA_SOURCES.map((source) => (
          <div className={`${styles.sourceCard} ${source.wide ? styles.sourceCardWide : ""}`} key={source.name}>
            <div className={styles.sourceHeader}>
              <div className={styles.sourceName}>{source.name}</div>
              <div className={styles.sourceLicense}>{source.license}</div>
            </div>
            <div className={styles.sourceTag}>{source.tag}</div>
            <p className={styles.sourceDesc}>{source.description}</p>
            {source.endpoint && <div className={styles.sourceEndpoint}>{source.endpoint}</div>}
            {source.fields.length > 0 && (
              <div className={styles.fieldsTable}>
                {source.fields.map((f) => (
                  <div className={styles.fieldRow} key={f.field}>
                    <span className={styles.fieldName}>{f.field}</span>
                    <span className={styles.fieldUse}>{f.use}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <details className={styles.exactFormula}>
        <summary className={styles.exactFormulaSummary}>The exact formula, for the technically curious</summary>
        <pre className={styles.formula}>{FORMULA_TEXT}</pre>
      </details>

      <p className={styles.footer}>
        Weather data by{" "}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>
        , licensed CC BY 4.0. City data from GeoNames, licensed CC BY 4.0. Country and coastline geometry from
        Natural Earth, public domain. This is an independent personal project &mdash; no employer branding, no
        employer data, no commercial monetisation.
      </p>
    </div>
  );
}

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

function baseScoreFor(t: number): number {
  if (t < 8) return 0;
  if (t <= 30) return 100 * Math.pow((t - 8) / 22, 1.3);
  if (t <= 36) return 100;
  if (t <= 48) return 100 - ((t - 36) / 12) * 30;
  return 70;
}

/** The step-1 curve, drawn from the same math as scoreEngine.ts's computeBase. */
function ScoreCurveDiagram() {
  const width = 600;
  const height = 160;
  const padL = 34;
  const padB = 24;
  const padT = 10;
  const padR = 10;
  const tMin = -2;
  const tMax = 54;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xFor = (t: number) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
  const yFor = (score: number) => padT + plotH - (score / 100) * plotH;

  const points: string[] = [];
  for (let t = tMin; t <= tMax; t += 1) {
    points.push(`${xFor(t).toFixed(1)},${yFor(baseScoreFor(t)).toFixed(1)}`);
  }
  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${xFor(tMax).toFixed(1)},${(padT + plotH).toFixed(1)} L${xFor(tMin).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const marks = [8, 30, 36, 48];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.curveSvg} role="img" aria-label="Base score versus apparent temperature">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={padL} x2={width - padR} y1={yFor(v)} y2={yFor(v)} className={styles.curveGrid} />
          <text x={padL - 8} y={yFor(v) + 3} textAnchor="end" className={styles.curveAxisLabel}>
            {v}
          </text>
        </g>
      ))}
      {marks.map((t) => (
        <g key={t}>
          <line x1={xFor(t)} x2={xFor(t)} y1={padT} y2={padT + plotH} className={styles.curveGrid} />
          <text x={xFor(t)} y={height - 6} textAnchor="middle" className={styles.curveAxisLabel}>
            {t}°
          </text>
        </g>
      ))}
      <path d={areaPath} className={styles.curveArea} />
      <path d={linePath} className={styles.curveLine} />
    </svg>
  );
}
