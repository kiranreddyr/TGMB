"use client";

import { useState } from "react";
import MeltGlobe from "@/components/MeltGlobe";
import Header from "@/components/Header";
import GlobeLegend from "@/components/GlobeLegend";
import IntroSection from "@/components/IntroSection";
import AnalysisPanel from "@/components/AnalysisPanel";
import { useMeltPayload } from "@/lib/useMeltPayload";
import type { CityPayload } from "@/lib/payload";
import styles from "./page.module.css";

export default function Home() {
  const { payload, error, loading } = useMeltPayload();
  const [selectedCity, setSelectedCity] = useState<CityPayload | null>(null);

  return (
    <main className={styles.container}>
      <IntroSection cityCount={payload?.cityCount ?? 0} />

      <div className={styles.mainRow}>
        <div className={styles.globeSection}>
          {payload && <MeltGlobe cities={payload.cities} onSelectCity={setSelectedCity} />}

          {loading && !payload && <div className={styles.statusOverlay}>Loading the melt belt…</div>}

          {error && !payload && (
            <div className={styles.statusOverlay}>
              Couldn&rsquo;t load live data ({error}). Run <code>npm run hourly-job</code> in the repo root, then{" "}
              <code>npm run sync-web-data</code>.
            </div>
          )}

          <Header generatedAt={payload?.generatedAt ?? null} cityCount={payload?.cityCount ?? 0} />

          {payload && <GlobeLegend />}
        </div>

        <div className={styles.analysisSection}>
          <AnalysisPanel
            cities={payload?.cities ?? []}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            onDeselect={() => setSelectedCity(null)}
          />
        </div>
      </div>
    </main>
  );
}
