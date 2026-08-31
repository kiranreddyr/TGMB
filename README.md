# The Global Melt Belt

**Live:** https://kiranreddyr.github.io/TGMB/

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

Planned phasing (see the PRD for full detail):

| Phase | Scope | Status |
|---|---|---|
| 0. Spike | Fetch 10 cities, compute scores, print to console. Validate the formula. | ✅ Done |
| 1. Pipeline | Full city fetch, score engine, hourly job, JSON payload | ✅ Done |
| 2. Globe | Render globe, points, belt interpolation, city detail card | ✅ Done |
| 3. Polish | Leaderboard, methodology page, mobile tuning | ✅ Done — search and share cards still open |
| 4. Launch | Load test, open source the repo, publish, post to launch channels | In progress |
| 5. P1 | Time scrubber, hemisphere chart, embeddable widget | Not started |

**v2 roadmap** — share cards, city permalinks, the credibility layer (Peak Cone Hour, hemisphere handoff, the historical melt-days chart), an open CC BY dataset, opt-in anonymous push, and a Freeze Belt companion product are all scoped in detail in PRD.docx, section 16. Not started; see the PRD before picking any of these up.

## Deployment

`web/` is a Next.js static export (`output: "export"`), served from GitHub Pages at the `/TGMB` sub-path — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) rebuilds and republishes it on every push to `main`, once an hour on a cron schedule (the "scheduler" from PRD section 7), and on demand from the Actions tab. Each run re-fetches weather, rebuilds the score payload, and redeploys — nothing is committed back to the repo.

**No secrets anywhere in this project.** Open-Meteo's forecast API is keyless for non-commercial use, and the frontend never calls it directly — it only ever fetches the static `melt-payload.json` this job produces, which is meant to be public (that's the point of an open methodology). If a paid Open-Meteo plan is ever needed (PRD risk R1), the key would live only as a GitHub Actions secret used server-side in this workflow — it would never ship to the browser.

## Pipeline

```
[Hourly scheduler]
        |
        v
[Fetch worker] --batched calls--> Open-Meteo forecast API
        |
        v
[Score engine] applies the Melt Score formula, versioned
        |
        v
[JSON payload] latest score + 48h forward per city
        |
        v
[Frontend] reads one JSON file — never calls Open-Meteo directly
```

### 1. Validate the formula (Phase 0 spike)

```bash
npm install
npm run phase0
```

Fetches current weather for 10 cities spanning both hemispheres (Reykjavik to Ushuaia), computes each city's Melt Score, and prints a sanity-check table: city, local time, apparent temperature, score, band, and a one-line plain-English reason.

### 2. Build the city list (one-off / annual refresh)

`data/cities.csv` is generated from the GeoNames dump using the PRD's selection order: all cities over 3M population, then capitals of countries over 5M population, then a fill pass that guarantees every latitude band — especially the southern hemisphere — has a representative city so the belt is never visually broken. Currently 213 cities.

```bash
mkdir -p data/raw
curl -o data/raw/cities15000.zip https://download.geonames.org/export/dump/cities15000.zip
curl -o data/raw/countryInfo.txt https://download.geonames.org/export/dump/countryInfo.txt
unzip -o data/raw/cities15000.zip -d data/raw
npm run build:cities
```

### 3. Run the hourly job

```bash
npm run hourly-job
```

Fetches all cities in batches (never one request per city), computes scores, and writes `data/output/melt-payload.json` — the single static file the frontend will fetch. Currently ~20 KB gzipped for 213 cities with 48h-forward series, well inside the 500 KB budget from the PRD. This is the job a scheduler (GitHub Actions cron in v1) will run hourly once deployed.

```bash
npm run typecheck
```

## Non-goals for v1

Not a sales forecasting tool. Not a distributor or B2B product. No user accounts, no login. No product catalogue or e-commerce. Not a general weather app.

## License

Code: MIT. See [LICENSE](LICENSE). Weather and city data remain under their respective CC BY 4.0 licenses from Open-Meteo and GeoNames.
