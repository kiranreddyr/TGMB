import type { Metadata } from "next";
import { Instrument_Serif, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Origin only (no /TGMB) — relative image URLs built with the basePath-aware
// assetUrl() helper already include the repo path, so metadataBase must not
// double it up.
export const metadata: Metadata = {
  metadataBase: new URL("https://kiranreddyr.github.io"),
  title: "The Global Melt Belt",
  description:
    "A live globe showing where on Earth it is perfect ice cream weather right now, updated hourly from live weather data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${sourceSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
