import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { colorForScore, type CityPayload } from "@/lib/payload";
import { loadPayloadAtBuildTime } from "@/lib/loadPayloadAtBuildTime";
import { describeNextMeltWindow } from "@/lib/nextMeltWindow";
import Sparkline from "@/components/Sparkline";
import DailyForecast from "@/components/DailyForecast";
import DemandIndex from "@/components/DemandIndex";
import styles from "./page.module.css";

// Static export has no server at request time — every city page must be
// known at build time, and a slug that isn't in the payload should 404
// rather than fall through to a runtime render that can never happen.
export const dynamicParams = false;

function findCity(slug: string): CityPayload | null {
  const payload = loadPayloadAtBuildTime();
  return payload?.cities.find((c) => c.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const payload = loadPayloadAtBuildTime();
  return (payload?.cities ?? []).map((city) => ({ slug: city.slug }));
}

export async function generateMetadata(props: PageProps<"/city/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const city = findCity(slug);
  if (!city) return {};

  const score = Math.round(city.current.score);
  const title = `${city.name}: ${score}/100 Melt Score — The Global Melt Belt`;
  const description = `${city.current.band} in ${city.name}, ${city.country} right now — ${city.current.apparentTemperature.toFixed(1)}°C feels-like. ${city.current.reason}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CityPage(props: PageProps<"/city/[slug]">) {
  const { slug } = await props.params;
  const city = findCity(slug);
  if (!city) notFound();

  const color = colorForScore(city.current.score);
  const localTime = new Date(city.current.time.replace(" ", "T")).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const meltWindow = describeNextMeltWindow(city);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backButton}>
        ← Back to the globe
      </Link>

      <div className={styles.eyebrow}>
        {city.country} · {localTime.toUpperCase()} LOCAL TIME
      </div>
      <h1 className={styles.title}>{city.name}</h1>

      <div className={styles.scoreRow}>
        <div className={styles.score} style={{ color }}>
          {Math.round(city.current.score)}
        </div>
        <div>
          <div className={styles.band} style={{ color }}>
            {city.current.band}
          </div>
          <p className={styles.reason}>{city.current.reason}</p>
        </div>
      </div>

      {city.current.stale && (
        <div className={styles.staleNote}>Showing the last known good reading — live data for this city is temporarily unavailable.</div>
      )}

      {meltWindow && (
        <div className={styles.meltWindow}>
          <span className={styles.meltWindowLabel}>Next melt window</span>
          <span className={styles.meltWindowValue}>{meltWindow.isNow ? "Right now" : meltWindow.label}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Feels like</div>
          <div className={styles.statValue}>{city.current.apparentTemperature.toFixed(1)}°C</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Melt Score</div>
          <div className={styles.statValue}>{city.current.score.toFixed(1)} / 100</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Coordinates</div>
          <div className={styles.statValue}>
            {city.lat.toFixed(1)}, {city.lon.toFixed(1)}
          </div>
        </div>
      </div>

      <div className={styles.sparklineSection}>
        <div className={styles.sparklineLabel}>Melt Score, next 48 hours</div>
        <div className={styles.sparklineWrap}>
          <Sparkline values={city.forward.map((p) => p.score)} color={color} />
        </div>
        <div className={styles.sparklineAxis}>
          <span>Now</span>
          <span>+24h</span>
          <span>+48h</span>
        </div>
      </div>

      <div className={styles.sparklineSection}>
        <div className={styles.sparklineLabel}>7-day outlook</div>
        <DailyForecast days={city.daily} />
      </div>

      <div className={styles.sparklineSection}>
        <DemandIndex city={city} />
      </div>

      <p className={styles.footer}>
        Weather data by{" "}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>
        , licensed CC BY 4.0. Updated hourly.{" "}
        <Link href="/methodology">How the Melt Score works →</Link>
      </p>
    </div>
  );
}
