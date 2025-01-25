const ipfsCache = new Map<string, any>();
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

// Primary gateway - Web3.Storage is reliable and free
const PRIMARY_GATEWAY = 'https://w3s.link';

// Fallback gateways
const FALLBACK_GATEWAYS = [
    'https://ipfs.io',
    'https://cf-ipfs.com',
    'https://gateway.ipfs.io'
];

// Timeout for fetch requests in milliseconds
const FETCH_TIMEOUT = 10000;

const metadataCache = new Map<string, any>();

interface IPFSMetadata {
    name: string;
    description: string;
    image: string;
    imageUrl?: string;
    edition: number;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

// Prioritized list of gateways - order matters for performance
const IPFS_GATEWAYS = [
    'https://w3s.link/ipfs/',
    PINATA_GATEWAY + '/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/'
];

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Helper function to check if string ends with common image extensions
function hasImageExtension(uri: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => uri.toLowerCase().endsWith(ext));
}

// Helper function to get IPFS hash from URI
function getIPFSHash(uri: string): string {
    return uri.replace('ipfs://', '');
}

export async function getIPFSContent(uri: string, retries = 3): Promise<any> {
    // Check cache first
    const cacheKey = uri.replace('ipfs://', '');
    if (ipfsCache.has(cacheKey)) {
        return ipfsCache.get(cacheKey);
    }

    const cid = cacheKey.split('/');
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        for (const gateway of IPFS_GATEWAYS) {
            try {
                const url = `${gateway}${cid[0]}/${cid[1] || ''}`;
                const response = await fetchWithTimeout(url);
                
                if (!response.ok) {
                    console.warn(`Gateway ${gateway} returned ${response.status} for ${url}`);
                    continue;
                }

                const data = await response.json();
                // Cache successful response
                ipfsCache.set(cacheKey, data);
                return data;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`Failed to fetch from ${gateway}:`, error);
                continue;
            }
        }
        // Exponential backoff between retries
        if (attempt < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
    
    throw new Error(`Failed to fetch IPFS content after ${retries} retries: ${lastError?.message || 'Unknown error'}`);
} 