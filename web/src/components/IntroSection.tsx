import Link from "next/link";
import { colorForScore, type CityPayload } from "@/lib/payload";
import styles from "./IntroSection.module.css";

interface IntroSectionProps {
  cityCount: number;
  topCity: CityPayload | null;
}

/** Portion 1: hooks the reader in a few seconds, then invites them to scroll — the deep explanation lives on /methodology. */
export default function IntroSection({ cityCount, topCity }: IntroSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.backdrop} aria-hidden>
        <div className={styles.glow} />
        <div className={styles.grid} />
      </div>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.liveDot} />
          An open, live index
        </div>

        <h1 className={styles.title}>
          The Global
          <br />
          Melt Belt
        </h1>

        <p className={styles.hook}>Ice cream season never ends. It just moves.</p>

        {topCity && (
          <div className={styles.liveProof} style={{ borderColor: colorForScore(topCity.current.score) }}>
            <span className={styles.liveProofScore} style={{ color: colorForScore(topCity.current.score) }}>
              {Math.round(topCity.current.score)}
            </span>
            <span className={styles.liveProofText}>
              Right now it&rsquo;s <strong style={{ color: colorForScore(topCity.current.score) }}>{topCity.current.band.toLowerCase()}</strong>{" "}
              in {topCity.name}, {topCity.country}.
            </span>
          </div>
        )}

        <p className={styles.body}>
          A live globe of every place currently scoring high on real hourly weather data &mdash; not just heat, but
          how it actually feels, minus rain and wind.{" "}
          <Link href="/methodology" className={styles.inlineLink}>
            The formula is public
          </Link>
          . If a city scores low, that&rsquo;s the point.
        </p>

        <div className={styles.factRow}>
          <div className={styles.fact}>
            <strong>{cityCount || 213}</strong> cities, refreshed hourly
          </div>
          <div className={styles.fact}>Open methodology, no hidden weights</div>
          <div className={styles.fact}>Data by Open-Meteo, CC BY 4.0</div>
        </div>

        <div className={styles.scrollCue}>
          <span>Scroll to explore the globe</span>
          <span>↓</span>
        </div>
      </div>
    </section>
  );
}
