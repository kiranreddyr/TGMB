"use client";

import { useEffect, useState } from "react";
import type { CityPayload } from "./payload";
import { findNearestCity } from "./nearestCity";

export type VisitorCityStatus = "locating" | "found" | "unavailable";

interface VisitorCityState {
  city: CityPayload | null;
  status: VisitorCityStatus;
}

/**
 * Finds the tracked city nearest the visitor via one-shot browser
 * geolocation. Coordinates never leave the browser — they're only used
 * locally to pick the closest entry already in the loaded payload, never
 * sent anywhere. Silently falls back to "unavailable" on denial, timeout,
 * or an unsupported browser, with no retry or nagging — matches the
 * project's no-accounts, no-tracking posture.
 */
export function useVisitorCity(cities: CityPayload[]): VisitorCityState {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [unavailable, setUnavailable] = useState(() => typeof navigator === "undefined" || !navigator.geolocation);

  useEffect(() => {
    if (unavailable) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCoords({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => setUnavailable(true),
      { maximumAge: 10 * 60 * 1000, timeout: 8000 },
    );
  }, [unavailable]);

  if (unavailable) return { city: null, status: "unavailable" };
  if (coords && cities.length > 0) {
    return { city: findNearestCity(cities, coords.lat, coords.lon), status: "found" };
  }
  return { city: null, status: "locating" };
}
