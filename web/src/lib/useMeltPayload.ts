"use client";

import { useEffect, useState } from "react";
import { assetUrl, type MeltPayload } from "./payload";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // check for a fresher payload every 5 minutes; the payload itself refreshes hourly

interface MeltPayloadState {
  payload: MeltPayload | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetches the single static JSON payload and re-polls periodically. On a
 * failed refetch, keeps showing the last good payload rather than clearing
 * it — matches the PRD's "degrade to 'as of X hours ago', never break"
 * posture (section 9) for when the upstream job stalls.
 */
export function useMeltPayload(): MeltPayloadState {
  const [payload, setPayload] = useState<MeltPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayload() {
      try {
        const res = await fetch(assetUrl("/data/melt-payload.json"), { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = (await res.json()) as MeltPayload;
        if (!cancelled) {
          setPayload(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPayload();
    const interval = setInterval(fetchPayload, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { payload, error, loading };
}
