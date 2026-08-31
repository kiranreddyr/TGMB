import { computeDemandIndex, getDayType, DEMAND_INDEX_ASSUMPTIONS } from "@/lib/demandIndex";
import type { CityPayload } from "@/lib/payload";
import styles from "./DemandIndex.module.css";

interface DemandIndexProps {
  city: CityPayload;
}

function dayTypeLabel(city: CityPayload, dayType: ReturnType<typeof getDayType>): string {
  if (dayType === "holiday") return `public holiday${city.current.holidayName ? `: ${city.current.holidayName}` : ""}`;
  return dayType;
}

/** An illustrative weather + population demand index — clearly labeled as a model, not a forecast. */
export default function DemandIndex({ city }: DemandIndexProps) {
  if (!city.population) return null;

  const dayType = getDayType(city);
  const estimate = computeDemandIndex(city.population, city.current.score, dayType);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.badge}>Model, not a forecast</span>
      </div>
      <div className={styles.title}>Illustrative demand index</div>
      <div className={styles.value}>~{estimate.toLocaleString()}</div>
      <p className={styles.caption}>
        Estimated potential ice cream buyers in {city.name} today ({dayTypeLabel(city, dayType)}), from population (
        {city.population.toLocaleString()}) and the current Melt Score. Built from named assumptions, not real sales
        data — see below.
      </p>
      {city.current.isPublicHoliday === null && (
        <p className={styles.caption}>Public holiday status is unknown for this country — the holiday data source doesn&rsquo;t cover it.</p>
      )}
      <details>
        <summary className={styles.summary}>How this number is built</summary>
        <div className={styles.assumptions}>
          {DEMAND_INDEX_ASSUMPTIONS.map((a) => (
            <div className={styles.assumption} key={a.label}>
              <span className={styles.assumptionLabel}>{a.label}</span>
              <span className={styles.assumptionValue}>{a.value}</span>
              <span className={styles.assumptionNote}>{a.note}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
