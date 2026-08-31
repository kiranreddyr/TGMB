import { computeDemandIndex, buildDemandIndexBreakdown, getDayType } from "@/lib/demandIndex";
import type { CityPayload } from "@/lib/payload";
import styles from "./DemandIndex.module.css";

interface DemandIndexProps {
  city: CityPayload;
}

/** An illustrative weather + population demand index — clearly labeled as a model, not a forecast. */
export default function DemandIndex({ city }: DemandIndexProps) {
  if (!city.population) return null;

  const dayType = getDayType(city);
  const estimate = computeDemandIndex(city);
  const breakdown = buildDemandIndexBreakdown(city);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.badge}>Model, not a forecast</span>
      </div>
      <div className={styles.title}>Illustrative demand index</div>
      <div className={styles.value}>~{estimate.toLocaleString()}</div>
      <p className={styles.caption}>
        Estimated potential ice cream buyers in {city.name} today ({dayType}
        {dayType === "holiday" && city.current.holidayName ? `: ${city.current.holidayName}` : ""}), from population (
        {city.population.toLocaleString()}) and the current Melt Score. Some factors below are real, sourced data;
        others are named assumptions — never presented as the same thing.
      </p>
      <details>
        <summary className={styles.summary}>How this number is built</summary>
        <div className={styles.assumptions}>
          {breakdown.map((factor) => (
            <div className={styles.assumption} key={factor.label}>
              <span className={styles.assumptionLabel}>{factor.label}</span>
              <span className={factor.sourced ? styles.tagReal : styles.tagAssumed}>{factor.sourced ? "real" : "assumed"}</span>
              <span className={styles.assumptionValue}>{factor.value}</span>
              <span className={styles.assumptionNote}>{factor.note}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
