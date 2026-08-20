# web

The Next.js frontend for [The Global Melt Belt](../README.md) — the globe itself.

See the [repo root README](../README.md) for project overview, the Melt Score methodology, and the data pipeline. This app is a static export (`output: 'export'`) that only ever reads `public/data/melt-payload.json`; it never calls Open-Meteo directly.

## Local development

From the repo root:

```bash
npm run hourly-job    # generates data/output/melt-payload.json
npm run sync-web-data # copies it into web/public/data/
npm run dev           # starts the Next.js dev server (proxies into web/)
```

Or from this directory directly: `npm run dev`.
