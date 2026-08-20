import { SCORE_BANDS } from "@/lib/payload";
import styles from "./Legend.module.css";

/** Explains what the globe's colours mean — the Melt Score bands (PRD section 4). */
export default function Legend() {
  return (
    <div className={styles.legend}>
      {SCORE_BANDS.map((b) => (
        <div className={styles.item} key={b.band} title={b.description}>
          <span className={styles.swatch} style={{ background: b.color }} />
          <span className={styles.label}>{b.band}</span>
          <span className={styles.range}>
            {b.min}–{b.max}
          </span>
        </div>
      ))}
    </div>
  );
}
