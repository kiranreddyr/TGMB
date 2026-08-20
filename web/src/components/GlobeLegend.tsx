import { SCORE_BANDS } from "@/lib/payload";
import styles from "./GlobeLegend.module.css";

/** Compact colour key overlaid on the globe itself — the full legend with descriptions lives in the analysis panel below, but this answers "what do the colours mean" without requiring a scroll. */
export default function GlobeLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.title}>Melt Score</div>
      {SCORE_BANDS.map((b) => (
        <div className={styles.item} key={b.band}>
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
