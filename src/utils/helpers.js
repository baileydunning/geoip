// ::ffff:0.0.0.0 in decimal
const IPV4_MAPPED_BASE = BigInt('281470681743360');

export function isIPv4(ip) {
    return ip.includes('.') && ip.split('.').length === 4;
}

export function ipv4ToInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) throw new Error('Invalid IPv4 address');

    const [w, x, y, z] = parts.map((p) => {
        const n = Number(p);
        if (!Number.isInteger(n) || n < 0 || n > 255) {
            throw new Error(`Invalid IPv4 octet "${p}" in ${ip}`);
        }
        return n;
    });

    return (16777216 * w) + (65536 * x) + (256 * y) + z;
}

// IPv4 -> IPv4-mapped IPv6 decimal (::ffff:w.x.y.z)
export function ipv4ToDb11BigInt(ip) {
    return IPV4_MAPPED_BASE + BigInt(ipv4ToInt(ip));
}

// IPv6 string -> BigInt decimal
export function ipv6ToBigInt(ip) {
    // Handle IPv4-mapped forms like ::ffff:8.8.8.8
    if (ip.includes('.')) {
        const lastColon = ip.lastIndexOf(':');
        const ipv6Part = ip.slice(0, lastColon);
        const ipv4Part = ip.slice(lastColon + 1);
        const base = ipv6ToBigInt(ipv6Part);
        const v4 = ipv4ToInt(ipv4Part);
        return (base << BigInt(32)) + BigInt(v4);
    }

    let parts = ip.split(':');
    let result = BigInt(0);

    // expand ::
    const emptyIndex = parts.indexOf('');
    if (emptyIndex !== -1) {
        const missing = 8 - parts.length + 1;
        parts = [
            ...parts.slice(0, emptyIndex),
            ...new Array(missing).fill('0'),
            ...parts.slice(emptyIndex + 1),
        ];
    }

    for (const part of parts) {
        const value = BigInt(parseInt(part || '0', 16));
        result = (result << BigInt(16)) + value;
    }
    return result;
}