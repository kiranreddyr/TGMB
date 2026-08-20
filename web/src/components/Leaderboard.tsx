import { colorForScore, type CityPayload } from "@/lib/payload";
import styles from "./Leaderboard.module.css";

interface LeaderboardProps {
  cities: CityPayload[];
  onSelectCity: (city: CityPayload) => void;
}

/** F4: top 10 by Melt Score, bottom 5 as the counterpoint — half the humour, per the PRD. */
export default function Leaderboard({ cities, onSelectCity }: LeaderboardProps) {
  const sorted = [...cities].sort((a, b) => b.current.score - a.current.score);
  const top10 = sorted.slice(0, 10);
  const bottom5 = sorted.slice(-5).reverse();

  return (
    <div className={styles.columns}>
      <div>
        <div className={styles.columnTitle}>Top 10 right now</div>
        <ol className={styles.list}>
          {top10.map((city, i) => (
            <CityRow key={city.id} city={city} rank={i + 1} onSelect={onSelectCity} />
          ))}
        </ol>
      </div>
      <div>
        <div className={styles.columnTitle}>Bottom 5 (for contrast)</div>
        <ol className={styles.list}>
          {bottom5.map((city, i) => (
            <CityRow key={city.id} city={city} rank={i + 1} onSelect={onSelectCity} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function CityRow({ city, rank, onSelect }: { city: CityPayload; rank: number; onSelect: (c: CityPayload) => void }) {
  return (
    <li>
      <button className={styles.row} onClick={() => onSelect(city)}>
        <span className={styles.rank}>{rank}</span>
        <span className={styles.dot} style={{ background: colorForScore(city.current.score) }} />
        <span className={styles.cityName}>
          {city.name} <span className={styles.country}>· {city.country}</span>
        </span>
        <span className={styles.score} style={{ color: colorForScore(city.current.score) }}>
          {Math.round(city.current.score)}
        </span>
      </button>
    </li>
  );
}
