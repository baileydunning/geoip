import { tables, Resource } from 'harperdb';
import { isIPv4, ipv4ToDb11BigInt, ipv6ToBigInt } from './utils/helpers.js';

const GeoIPRange = tables.GeoIPRange;

export class GeoIPLookup extends Resource {
    static loadAsInstance = false;

    async get(target) {
        const context = this.getContext();
        const ip = target.get('ip') || context.ip;  // ?ip= overrides client IP

        if (!ip) {
            return new Response(JSON.stringify({ error: 'No IP available' }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        let ipNumber;
        try {
            // - IPv4 => IPv4-mapped IPv6 decimal (::ffff:x.x.x.x)
            // - IPv6 => full 128-bit decimal
            ipNumber = isIPv4(ip) ? ipv4ToDb11BigInt(ip) : ipv6ToBigInt(ip);
        } catch (e) {
            console.error('Error converting IP:', e);
            return new Response(JSON.stringify({ error: e.message }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const ipStr = ipNumber.toString();

        const query = {
            operator: 'and',
            conditions: [
                { attribute: 'ipFrom', comparator: 'less_than_equal', value: ipStr },
                { attribute: 'ipTo', comparator: 'greater_than_equal', value: ipStr },
            ],
            select: [
                'ipFrom',
                'ipTo',
                'countryCode',
                'countryName',
                'regionName',
                'cityName',
                'latitude',
                'longitude',
                'zipCode',
                'timeZone',
            ],
        };

        let best = null;

        try {
            const results = await GeoIPRange.search(query);

            for await (const row of results || []) {
                if (!best || BigInt(row.ipFrom) > BigInt(best.ipFrom)) {
                    best = row;
                }
            }
        } catch (err) {
            console.error('GeoIPRange.search error:', err);
            return new Response(
                JSON.stringify({ error: 'GeoIP search failed', details: String(err) }),
                {
                    status: 500,
                    headers: { 'content-type': 'application/json' },
                }
            );
        }

        return new Response(
            JSON.stringify(
                {
                    ip,
                    found: !!best,
                    result: best || null,
                },
                null,
                2
            ),
            {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }
        );
    }
}
