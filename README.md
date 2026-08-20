# The Global Melt Belt

A live web experience that shows, at any moment, where on Earth it is perfect ice cream weather.

Ice cream season never ends globally — it relocates. This project renders a rotating globe with a glowing band across it: the set of places currently scoring high on a **Melt Score** derived from live weather data. The band moves west with the sun every day, and drifts north and south with the seasons.

This is an independent personal project. No employer branding, no employer data, no commercial monetisation in v1.

## The Melt Score

> How warm it feels, minus rain and wind, weighted by time of day.

A single 0–100 score per city per hour, computed from apparent temperature, precipitation, precipitation probability, wind gusts, cloud cover, and time of day. Full formula in [`src/scoreEngine.ts`](src/scoreEngine.ts) — kept simple and explainable on purpose. It is versioned (`MELT_SCORE_FORMULA_VERSION`); if the weights ever change, historical scores get recomputed and the version is shown.

The formula is deliberately never tuned to flatter any market. If a city scores low, that's the point.

| Score | Band | Colour intent |
|---|---|---|
| 85–100 | Peak melt | Hot gold |
| 65–84 | Prime cone weather | Warm amber |
| 40–64 | Worth considering | Soft cream |
| 15–39 | Only if committed | Cool grey blue |
| 0–14 | Nobody is buying | Deep blue |

## Data sources

- **Weather:** [Open-Meteo](https://open-meteo.com) forecast API — free, global, no key required for non-commercial use. Licensed CC BY 4.0.
- **Cities:** [GeoNames](https://www.geonames.org) `cities15000` — licensed CC BY 4.0.
- **Map geometry:** [Natural Earth](https://www.naturalearthdata.com) — public domain.

Weather data by Open-Meteo.com, licensed CC BY 4.0. City data from GeoNames, licensed CC BY 4.0.

If this project ever adds ads, a paid tier, sponsorship, or any revenue, the written rule is: move to a paid Open-Meteo plan first. No exceptions.

## Status

Currently **Phase 0 — spike**: validating that the Melt Score formula produces intuitively correct results across a wide latitude spread, before any frontend code is written. See [`src/phase0.ts`](src/phase0.ts).

Planned phasing (see the PRD for full detail):

| Phase | Scope |
|---|---|
| 0. Spike | Fetch 10 cities, compute scores, print to console. Validate the formula. |
| 1. Pipeline | Full 200-city fetch, score engine, hourly job, JSON payload to CDN |
| 2. Globe | Render globe, points, belt interpolation, city detail card |
| 3. Polish | Leaderboard, search, methodology page, share cards, mobile tuning |
| 4. Launch | Load test, open source the repo, publish, post to launch channels |
| 5. P1 | Time scrubber, hemisphere chart, embeddable widget |

## Running the Phase 0 spike

```bash
npm install
npm run phase0
```

This fetches current weather for 10 cities spanning both hemispheres (Reykjavik to Ushuaia), computes each city's Melt Score, and prints a sanity-check table: city, local time, apparent temperature, score, band, and a one-line plain-English reason.

```bash
npm run typecheck
```

## Non-goals for v1

Not a sales forecasting tool. Not a distributor or B2B product. No user accounts, no login. No product catalogue or e-commerce. Not a general weather app.

## License

Code: MIT. See [LICENSE](LICENSE). Weather and city data remain under their respective CC BY 4.0 licenses from Open-Meteo and GeoNames.
