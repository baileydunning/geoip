export interface GeoIPResponse {
  ip: string;
  found: boolean;
  result: {
    countryCode: string;
    countryName: string;
    regionName: string;
    cityName: string;
    latitude: number;
    longitude: number;
    zipCode: string;
    timeZone: string;
    ipFrom: string;
    ipTo: string;
  } | null;
}

export interface GeoIPError {
  error: string;
  message: string;
}

export type GeoIPResult = GeoIPResponse | GeoIPError;

export interface APIState {
  data: GeoIPResponse | null;
  error: string | null;
  isLoading: boolean;
}
