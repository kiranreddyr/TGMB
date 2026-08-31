export interface City {
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2 code, e.g. "IN" — used to look up public holidays. */
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  population: number;
}
