import Link from "next/link";
import { colorForScore, type CityPayload } from "@/lib/payload";
import { describeNextMeltWindow } from "@/lib/nextMeltWindow";
import styles from "./IntroSection.module.css";

interface IntroSectionProps {
  cityCount: number;
  topCity: CityPayload | null;
  /** Nearest tracked city to the visitor's browser geolocation, when granted — leads the hero over the global top city. */
  visitorCity: CityPayload | null;
}

/** Portion 1: hooks the reader in a few seconds, then invites them to scroll — the deep explanation lives on /methodology. */
export default function IntroSection({ cityCount, topCity, visitorCity }: IntroSectionProps) {
  const featuredCity = visitorCity ?? topCity;
  const isVisitor = Boolean(visitorCity);
  const meltWindow = featuredCity ? describeNextMeltWindow(featuredCity) : null;

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

        {featuredCity && (
          <div className={styles.liveProof} style={{ borderColor: colorForScore(featuredCity.current.score) }}>
            <span className={styles.liveProofScore} style={{ color: colorForScore(featuredCity.current.score) }}>
              {Math.round(featuredCity.current.score)}
            </span>
            <div className={styles.liveProofBody}>
              <span className={styles.liveProofText}>
                {isVisitor ? <>Near you, it&rsquo;s</> : <>Right now it&rsquo;s</>}{" "}
                <strong style={{ color: colorForScore(featuredCity.current.score) }}>{featuredCity.current.band.toLowerCase()}</strong>{" "}
                in {featuredCity.name}, {featuredCity.country}.
              </span>
              {meltWindow && !meltWindow.isNow && (
                <span className={styles.liveProofWindow}>Next melt window: {meltWindow.label}.</span>
              )}
              {isVisitor && (
                <Link href={`/city/${featuredCity.slug}`} className={styles.liveProofLink}>
                  Full forecast for {featuredCity.name} →
                </Link>
              )}
            </div>
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
