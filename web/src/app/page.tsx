"use client";

import { useState } from "react";
import MeltGlobe, { type FlyToTarget } from "@/components/MeltGlobe";
import Header from "@/components/Header";
import GlobeLegend from "@/components/GlobeLegend";
import IntroSection from "@/components/IntroSection";
import AnalysisPanel from "@/components/AnalysisPanel";
import { useMeltPayload } from "@/lib/useMeltPayload";
import { useVisitorCity } from "@/lib/useVisitorCity";
import type { CityPayload } from "@/lib/payload";
import styles from "./page.module.css";

export default function Home() {
  const { payload, error, loading } = useMeltPayload();
  const { city: visitorCity } = useVisitorCity(payload?.cities ?? []);
  const [selectedCity, setSelectedCity] = useState<CityPayload | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);

  const handleSearchSelect = (city: CityPayload) => {
    setSelectedCity(city);
    setFlyToTarget({ lat: city.lat, lon: city.lon, nonce: Date.now() });
  };

  const topCity = payload?.cities.length
    ? [...payload.cities].sort((a, b) => b.current.score - a.current.score)[0]
    : null;

  return (
    <main className={styles.container}>
      <IntroSection cityCount={payload?.cityCount ?? 0} topCity={topCity ?? null} visitorCity={visitorCity} />

      <div className={styles.mainRow}>
        <div className={styles.globeSection}>
          {payload && <MeltGlobe cities={payload.cities} onSelectCity={setSelectedCity} flyToTarget={flyToTarget} />}

          {loading && !payload && <div className={styles.statusOverlay}>Loading the melt belt…</div>}

          {error && !payload && (
            <div className={styles.statusOverlay}>
              Couldn&rsquo;t load live data ({error}). Run <code>npm run hourly-job</code> in the repo root, then{" "}
              <code>npm run sync-web-data</code>.
            </div>
          )}

          <div className={styles.topLeftStack}>
            <Header generatedAt={payload?.generatedAt ?? null} cityCount={payload?.cityCount ?? 0} />
            {payload && <GlobeLegend />}
          </div>
        </div>

        <div className={styles.analysisSection}>
          <AnalysisPanel
            cities={payload?.cities ?? []}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            onSearchSelect={handleSearchSelect}
            onDeselect={() => setSelectedCity(null)}
          />
        </div>
      </div>
    </main>
  );
}
