import type { CityPayload } from "./payload";

/** Great-circle distance in km — good enough for "closest tracked city," not for anything precision-critical. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Nearest tracked city to a raw lat/lon — used to turn a visitor's browser geolocation into one of our 213 cities. */
export function findNearestCity(cities: CityPayload[], lat: number, lon: number): CityPayload | null {
  if (cities.length === 0) return null;
  let nearest = cities[0]!;
  let nearestDist = haversineKm(lat, lon, nearest.lat, nearest.lon);
  for (const city of cities.slice(1)) {
    const dist = haversineKm(lat, lon, city.lat, city.lon);
    if (dist < nearestDist) {
      nearest = city;
      nearestDist = dist;
    }
  }
  return nearest;
}
