import { colorForScore, type CityPayload } from "@/lib/payload";
import Sparkline from "./Sparkline";
import styles from "./CityAnalysis.module.css";

interface CityAnalysisProps {
  city: CityPayload;
  onBack: () => void;
}

export default function CityAnalysis({ city, onBack }: CityAnalysisProps) {
  const color = colorForScore(city.current.score);
  const localTime = new Date(city.current.time.replace(" ", "T")).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div>
      <button className={styles.backButton} onClick={onBack}>
        ← Back to leaderboard
      </button>

      <div className={styles.header}>
        <div>
          <div className={styles.cityName}>{city.name}</div>
          <div className={styles.country}>{city.country}</div>
          <div className={styles.meta}>{localTime.toUpperCase()} LOCAL TIME</div>
        </div>
        <div className={styles.scoreBlock}>
          <div className={styles.score} style={{ color }}>
            {Math.round(city.current.score)}
          </div>
          <div className={styles.band} style={{ color }}>
            {city.current.band}
          </div>
        </div>
      </div>

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

      <p className={styles.reason}>{city.current.reason}</p>

      {city.current.stale && (
        <div className={styles.staleNote}>Showing the last known good reading — live data for this city is temporarily unavailable.</div>
      )}

      <div className={styles.sparklineSection}>
        <div className={styles.sparklineLabel}>Next 48 hours</div>
        <div className={styles.sparklineWrap}>
          <Sparkline values={city.forward} color={color} />
        </div>
        <div className={styles.sparklineAxis}>
          <span>Now</span>
          <span>+24h</span>
          <span>+48h</span>
        </div>
      </div>
    </div>
  );
}
