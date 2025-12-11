import { GeoIPResponse, GeoIPError } from '@/types/geoip';

/**
 * Base URL for the Harper GeoIPLookup resource.
 *
 * Set NEXT_PUBLIC_GEOIP_ENDPOINT in your env, e.g.:
 *   NEXT_PUBLIC_GEOIP_ENDPOINT="https://my-harper-host:9926/GeoIPLookup"
 */
const GEOIP_ENDPOINT =
  process.env.NEXT_PUBLIC_GEOIP_ENDPOINT ??
  '/GeoIPLookup';

/**
 * Shape of the backend GeoIPLookup response
 */
interface GeoIPLookupResultRow {
  countryCode: string;
  countryName: string;
  regionName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  timeZone: string;
  ipFrom?: string | number; // optional, if you add to `select`
  ipTo?: string | number;
}

interface GeoIPLookupResponse {
  ip: string;
  found: boolean;
  result: GeoIPLookupResultRow | null;
}

/**
 * Validate IPv4 address format
 */
export function validateIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Convert IP address to integer
 * NOTE: Only used for approximate ip_from/ip_to in the mapped response.
 * The actual range lookup is done on the server using DB11 IPv6 decimals.
 */
export function ipToInteger(ip: string): number {
  const octets = ip.split('.').map(Number);
  return (
    octets[0] * 16777216 +
    octets[1] * 65536 +
    octets[2] * 256 +
    octets[3]
  );
}

/**
 * Fetch GeoIP data from Harper GeoIPLookup Resource.
 *
 * Calls:
 *   GET <GEOIP_ENDPOINT>?ip=<ip>
 *
 * and maps the result into your existing GeoIPResponse shape.
 */
export async function fetchGeoIP(
  ip: string
): Promise<GeoIPResponse | GeoIPError> {
  // Basic client-side validation
  if (!validateIPv4(ip)) {
    return {
      error: 'INVALID_IP',
      message: 'Invalid IPv4 address format',
    };
  }

  let res: Response;
  try {
    const url = `${GEOIP_ENDPOINT}?ip=${encodeURIComponent(ip)}`;

    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    return {
      error: 'NETWORK_ERROR',
      message:
        err instanceof Error ? err.message : 'Failed to reach GeoIP service',
    };
  }

  let payload: GeoIPLookupResponse | { error?: string; message?: string };
  try {
    payload = (await res.json()) as GeoIPLookupResponse;
  } catch {
    return {
      error: 'BACKEND_ERROR',
      message: `Invalid JSON from GeoIP service (status ${res.status})`,
    };
  }

  // If the Resource returned an explicit error
  if (!res.ok) {
    const msg =
      (payload as any).error ||
      (payload as any).message ||
      `GeoIP lookup failed with status ${res.status}`;
    return {
      error: 'BACKEND_ERROR',
      message: String(msg),
    };
  }

  const data = payload as GeoIPLookupResponse;

  if (!data.found || !data.result) {
    return {
      error: 'NOT_FOUND',
      message: 'No GeoIP record found for this IP',
    };
  }

  const row = data.result;

  // Map backend camelCase -> your existing snake_case GeoIPResponse
  // ip_from/ip_to are approximated if not returned from backend.
  const ipFrom =
    row.ipFrom != null
      ? Number(row.ipFrom)
      : ipToInteger(ip); // fall back to simple range
  const ipTo =
    row.ipTo != null
      ? Number(row.ipTo)
      : ipFrom + 255; // cheap /24-style range approximation

  const mapped: GeoIPResponse = {
    ip: data.ip,
    found: data.found,
    result: {
      countryCode: row.countryCode,
      countryName: row.countryName,
      regionName: row.regionName,
      cityName: row.cityName,
      latitude: row.latitude,
      longitude: row.longitude,
      zipCode: row.zipCode,
      timeZone: row.timeZone,
      ipFrom: String(ipFrom),
      ipTo: String(ipTo),
    },
  };

    return mapped;
}

/**
 * Detect visitor's IP address via Harper.
 *
 * Call GeoIPLookup *without* ?ip — the Resource will use context.ip.
 * We just return the IP string from the response.
 */
export async function detectVisitorIP(): Promise<string> {
  let res: Response;
  try {
    res = await fetch(GEOIP_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    // Fall back to a sane default if you want, or rethrow
    console.error('Failed to detect visitor IP:', err);
    return '0.0.0.0';
  }

  const data = (await res.json()) as Partial<GeoIPLookupResponse>;
  return data.ip ?? '0.0.0.0';
}
