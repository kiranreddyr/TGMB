import type { CityPayload } from "./payload";

export interface MeltWindowLabel {
  /** true when the peak window is happening right now, not in the future. */
  isNow: boolean;
  /** e.g. "Right now" or "Thursday, 4pm" */
  label: string;
}

/** "Thursday, 4pm" from an already-localized "YYYY-MM-DDTHH:mm" string — no timezone re-interpretation, just formatting the calendar values directly. */
function formatWeekdayHour(localTimeIso: string): string {
  const [datePart, timePart] = localTimeIso.split("T");
  const [y, m, d] = (datePart ?? "").split("-").map(Number);
  const hour = Number((timePart ?? "0").split(":")[0]);
  if (!y || !m || !d) return localTimeIso;

  const weekday = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long" });
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${weekday}, ${hour12}${period}`;
}

/** Formats a city's next "Peak melt" window for share-worthy display — null when there isn't one this week. */
export function describeNextMeltWindow(city: CityPayload): MeltWindowLabel | null {
  if (!city.nextPeakWindow) return null;
  const isNow = city.nextPeakWindow.time === city.current.time;
  return {
    isNow,
    label: isNow ? "Right now" : formatWeekdayHour(city.nextPeakWindow.time),
  };
}
