/**
 * Renders one 1200x630 OG/Twitter share-card PNG per city — city name,
 * score, band, and global rank — so a link to /city/[slug] shows the
 * actual reading, not generic site metadata. Runs at build time (inside
 * the hourly job) since GitHub Pages has no server to render these on
 * demand; the frontend just points its <meta> tags at the static file.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MeltPayload, CityPayload } from "./buildPayload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const BACKGROUND = "#05070d";
const FOREGROUND = "#f4f1ea";
const MUTED = "#93a0b8";
const ACCENT = "#ffc94a";
const PANEL_BORDER = "rgba(255, 255, 255, 0.14)";

// Kept in sync by hand with BAND_COLORS in web/src/lib/payload.ts — same
// five bands, same hex values, just duplicated across the two packages.
const BAND_COLORS: Record<string, string> = {
  "Peak melt": "#FFC94A",
  "Prime cone weather": "#FF9F45",
  "Worth considering": "#F5E6C8",
  "Only if committed": "#6E8CA8",
  "Nobody is buying": "#1B2A4A",
};

function colorForBand(band: string): string {
  return BAND_COLORS[band] ?? MUTED;
}

// "Nobody is buying"'s navy is a deliberately low-key band color for small
// UI accents elsewhere in the app, but at the card's 180px score size it's
// nearly invisible against the near-black background — fall back to the
// readable foreground color for the one band where that's true.
function legibleScoreColor(band: string): string {
  const color = colorForBand(band);
  return color === BAND_COLORS["Nobody is buying"] ? FOREGROUND : color;
}

interface LoadedFonts {
  mono: Buffer;
  monoSemiBold: Buffer;
  serif: Buffer;
}

async function loadFonts(): Promise<LoadedFonts> {
  const [mono, monoSemiBold, serif] = await Promise.all([
    readFile(path.join(FONTS_DIR, "IBMPlexMono-Regular.woff")),
    readFile(path.join(FONTS_DIR, "IBMPlexMono-SemiBold.woff")),
    readFile(path.join(FONTS_DIR, "InstrumentSerif-Regular.woff")),
  ]);
  return { mono, monoSemiBold, serif };
}

function cardElement(city: CityPayload, totalCities: number) {
  const color = colorForBand(city.current.band);

  return {
    type: "div",
    props: {
      style: {
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        background: BACKGROUND,
        color: FOREGROUND,
        fontFamily: "IBM Plex Mono",
      },
      children: [
        // eyebrow row
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: "10px", fontSize: 20, letterSpacing: 4, color: ACCENT },
            children: [
              {
                type: "div",
                props: { style: { width: 10, height: 10, borderRadius: 999, background: ACCENT } },
              },
              { type: "div", props: { children: "THE GLOBAL MELT BELT" } },
            ],
          },
        },
        // main row: city block (left) + score block (right)
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", maxWidth: "620px" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { fontFamily: "Instrument Serif", fontSize: 84, lineHeight: 1.02, color: FOREGROUND },
                        children: city.name,
                      },
                    },
                    { type: "div", props: { style: { fontSize: 24, color: MUTED, marginTop: 6 }, children: city.country } },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginTop: 28,
                          padding: "8px 18px",
                          borderRadius: 999,
                          border: `2px solid ${color}`,
                          alignSelf: "flex-start",
                        },
                        children: [
                          { type: "div", props: { style: { fontSize: 20, letterSpacing: 1, color, fontWeight: 600, fontFamily: "IBM Plex Mono SemiBold" }, children: city.current.band } },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 30, color: FOREGROUND, marginTop: 24, lineHeight: 1.3 },
                        children: city.current.reason,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "baseline", color: legibleScoreColor(city.current.band) },
                        children: [
                          { type: "div", props: { style: { fontSize: 180, fontWeight: 600, lineHeight: 1, fontFamily: "IBM Plex Mono SemiBold" }, children: String(Math.round(city.current.score)) } },
                          { type: "div", props: { style: { fontSize: 40, marginLeft: 8, color: MUTED }, children: "/100" } },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 22, color: MUTED, marginTop: 14 },
                        children: `#${city.rank} of ${totalCities} right now`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `1px solid ${PANEL_BORDER}`,
              paddingTop: 24,
              fontSize: 20,
              color: MUTED,
            },
            children: [
              { type: "div", props: { children: "kiranreddyr.github.io/TGMB" } },
              { type: "div", props: { children: "Live weather by Open-Meteo, updated hourly" } },
            ],
          },
        },
      ],
    },
  };
}

async function renderShareCard(city: CityPayload, totalCities: number, fonts: LoadedFonts): Promise<Buffer> {
  const svg = await satori(cardElement(city, totalCities), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: "IBM Plex Mono", data: fonts.mono, weight: 400, style: "normal" },
      { name: "IBM Plex Mono SemiBold", data: fonts.monoSemiBold, weight: 600, style: "normal" },
      { name: "Instrument Serif", data: fonts.serif, weight: 400, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: CARD_WIDTH } });
  return resvg.render().asPng();
}

/** Renders one share-card PNG per city in the payload into `outputDir/{slug}.png`. */
export async function generateShareCards(payload: MeltPayload, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const fonts = await loadFonts();

  for (const city of payload.cities) {
    const png = await renderShareCard(city, payload.cityCount, fonts);
    await writeFile(path.join(outputDir, `${city.slug}.png`), png);
  }
}
