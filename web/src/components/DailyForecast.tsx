import type { CityPayload } from "@/lib/payload";
import styles from "./DailyForecast.module.css";

interface DailyForecastProps {
  days: CityPayload["daily"];
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  // Noon avoids a date-only string parsing to the previous day near
  // timezone boundaries when read as local time.
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

/** A basic multi-day outlook — high/low, rain chance, plain-English condition. */
export default function DailyForecast({ days }: DailyForecastProps) {
  if (days.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {days.map((day, i) => (
        <div className={styles.day} key={day.date}>
          <div className={styles.dayLabel}>{dayLabel(day.date, i)}</div>
          <div className={styles.condition}>{day.condition}</div>
          <div className={styles.rain}>{day.precipitationProbabilityMax}%</div>
          <div className={styles.temps}>
            <span className={styles.tempMax}>{Math.round(day.temperatureMax)}°</span>
            <span className={styles.tempMin}>{Math.round(day.temperatureMin)}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}
