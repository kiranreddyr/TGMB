import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Global Melt Belt",
  description:
    "A live globe showing where on Earth it is perfect ice cream weather right now, updated hourly from live weather data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
