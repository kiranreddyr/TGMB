"use client";

import { useMemo, useRef, useState } from "react";
import { colorForScore, type CityPayload } from "@/lib/payload";
import styles from "./CitySearch.module.css";

interface CitySearchProps {
  cities: CityPayload[];
  onSelect: (city: CityPayload) => void;
}

const MAX_RESULTS = 8;

/** F5: type a city name, the globe flies to it and opens the detail card. */
export default function CitySearch({ cities, onSelect }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query, cities]);

  const commit = (city: CityPayload) => {
    onSelect(city);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex] ?? results[0];
      if (pick) commit(pick);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <span className={styles.icon} aria-hidden>
          ⌕
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search a city…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          aria-label="Search a city"
        />
      </div>

      {open && query.trim() && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            results.map((city, i) => (
              <button
                key={city.id}
                className={`${styles.option} ${i === activeIndex ? styles.optionActive : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(city)}
              >
                <span className={styles.dot} style={{ background: colorForScore(city.current.score) }} />
                <span className={styles.name}>
                  {city.name} <span className={styles.country}>· {city.country}</span>
                </span>
                <span className={styles.score} style={{ color: colorForScore(city.current.score) }}>
                  {Math.round(city.current.score)}
                </span>
              </button>
            ))
          ) : (
            <div className={styles.empty}>No city matches &ldquo;{query}&rdquo;.</div>
          )}
        </div>
      )}
    </div>
  );
}
