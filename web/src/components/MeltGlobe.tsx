"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { assetUrl, colorForScore, meltHeatColor, type CityPayload } from "@/lib/payload";
import ZoomControls from "./ZoomControls";

// react-globe.gl touches `window` at import time, so it can only load client-side.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const DEFAULT_ALTITUDE = 2.2;
const MIN_ALTITUDE = 0.5;
const MAX_ALTITUDE = 3.5;

interface MeltGlobeProps {
  cities: CityPayload[];
  onSelectCity: (city: CityPayload) => void;
}

function useContainerSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Read synchronously on mount rather than waiting for the observer's
    // first async callback, so the globe appears on the first paint instead
    // of one render cycle later.
    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export default function MeltGlobe({ cities, onSelectCity }: MeltGlobeProps) {
  const { ref, size } = useContainerSize();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const handleGlobeReady = () => {
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      // Wheel-to-zoom fights the page's own scroll when the cursor is over
      // a full-screen globe, so zoom is button-driven instead (ZoomControls).
      controls.enableZoom = false;
    }
    globeRef.current?.pointOfView({ altitude: DEFAULT_ALTITUDE }, 0);
  };

  const zoomBy = (factor: number) => {
    const globe = globeRef.current;
    if (!globe) return;
    const current = globe.pointOfView().altitude;
    const next = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, current * factor));
    globe.pointOfView({ altitude: next }, 300);
  };

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%" }}
      // Stop the wheel event before it ever reaches the globe's own canvas
      // listener (OrbitControls re-enables itself on resize, so relying on
      // controls.enableZoom alone isn't reliable) — this lets the wheel fall
      // through to the page's normal scroll instead of zooming the globe.
      onWheelCapture={(e) => e.stopPropagation()}
    >
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="#05070d"
          globeImageUrl={assetUrl("/textures/earth-dark.jpg")}
          showAtmosphere
          atmosphereColor="#6fb7ff"
          atmosphereAltitude={0.18}
          onGlobeReady={handleGlobeReady}
          // The "belt": a smooth heat-map interpolation across every city's
          // score, read as a soft glowing band rather than discrete blocks.
          heatmapsData={[cities]}
          heatmapPoints={(d) => d as CityPayload[]}
          heatmapPointLat={(d) => (d as CityPayload).lat}
          heatmapPointLng={(d) => (d as CityPayload).lon}
          heatmapPointWeight={(d) => (d as CityPayload).current.score}
          heatmapBandwidth={4.2}
          heatmapColorFn={() => meltHeatColor}
          heatmapBaseAltitude={0.006}
          heatmapsTransitionDuration={0}
          // Every city as a small clickable point, coloured by its own score.
          pointsData={cities}
          pointLat={(d) => (d as CityPayload).lat}
          pointLng={(d) => (d as CityPayload).lon}
          pointColor={(d) => colorForScore((d as CityPayload).current.score)}
          pointAltitude={0.012}
          pointRadius={0.22}
          pointsMerge={false}
          pointLabel={(d) => {
            const c = d as CityPayload;
            return `${c.name}, ${c.country}: ${c.current.score.toFixed(0)} (${c.current.band})`;
          }}
          onPointClick={(d) => onSelectCity(d as CityPayload)}
        />
      )}
      {size.width > 0 && <ZoomControls onZoomIn={() => zoomBy(0.75)} onZoomOut={() => zoomBy(1.35)} />}
    </div>
  );
}
