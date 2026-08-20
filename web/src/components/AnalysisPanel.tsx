import type { CityPayload } from "@/lib/payload";
import CitySearch from "./CitySearch";
import Legend from "./Legend";
import Leaderboard from "./Leaderboard";
import CityAnalysis from "./CityAnalysis";
import styles from "./AnalysisPanel.module.css";

interface AnalysisPanelProps {
  cities: CityPayload[];
  selectedCity: CityPayload | null;
  onSelectCity: (city: CityPayload) => void;
  onSearchSelect: (city: CityPayload) => void;
  onDeselect: () => void;
}

export default function AnalysisPanel({ cities, selectedCity, onSelectCity, onSearchSelect, onDeselect }: AnalysisPanelProps) {
  return (
    <div className={styles.panel}>
      {cities.length > 0 && <CitySearch cities={cities} onSelect={onSearchSelect} />}

      <div className={styles.legendRow}>
        <Legend />
      </div>

      {selectedCity ? (
        <CityAnalysis city={selectedCity} onBack={onDeselect} />
      ) : cities.length > 0 ? (
        <>
          <div className={styles.sectionTitle}>Analysis</div>
          <div className={styles.hint}>Click any dot on the globe, or a city below, to see its full breakdown.</div>
          <Leaderboard cities={cities} onSelectCity={onSelectCity} />
        </>
      ) : (
        <div className={styles.emptyState}>Waiting for data…</div>
      )}

      <div className={styles.footer}>
        Weather data by{" "}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>
        , CC BY 4.0.
      </div>
    </div>
  );
}
