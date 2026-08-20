import styles from "./IntroSection.module.css";

interface IntroSectionProps {
  cityCount: number;
}

/** Portion 1: explains what this portal is before the globe shows up. */
export default function IntroSection({ cityCount }: IntroSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>An open, live index</div>
      <h1 className={styles.title}>The Global Melt Belt</h1>
      <p className={styles.tagline}>Where on Earth it&rsquo;s perfect ice cream weather, right now.</p>

      <div className={styles.body}>
        <p>
          Ice cream demand is one of the most weather-sensitive habits there is, but nobody has made that visible.
          This portal renders a live, rotating globe with a glowing band across it &mdash; the set of places currently
          scoring high on a &ldquo;Melt Score&rdquo; computed from real hourly weather data. It moves west with the
          sun every day, and drifts north and south with the seasons.
        </p>
        <p>
          The Melt Score isn&rsquo;t just temperature: it&rsquo;s how warm it feels, minus rain and wind, weighted
          by time of day. The formula is published in full below &mdash; nothing about it is tuned to flatter any
          one place. If a city scores low, that&rsquo;s the point.
        </p>
      </div>

      <div className={styles.factRow}>
        <div className={styles.fact}>
          <strong>{cityCount || 213}</strong> cities tracked
        </div>
        <div className={styles.fact}>Refreshed every hour</div>
        <div className={styles.fact}>Open methodology, no hidden weights</div>
        <div className={styles.fact}>Data by Open-Meteo, CC BY 4.0</div>
      </div>

      <div className={styles.scrollCue}>
        <span>Scroll to explore the globe</span>
        <span>↓</span>
      </div>
    </section>
  );
}
