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
    'https://ipfs.io/ipfs/',
    PINATA_GATEWAY + '/ipfs/'
];

const RATE_LIMIT_DELAY = 100; // ms between requests
let lastRequestTime = 0;

async function rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
}

async function fetchWithRetry(url: string, retries = 3, backoff = 1000): Promise<Response> {
    try {
        await rateLimit();
        const response = await fetch(url);
        if (response.status === 429 && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
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

    let lastError: Error | null = null;
    
    // Implement retry logic on the client side
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const hash = cacheKey.split('/')[0];
            const path = cacheKey.split('/').slice(1).join('/');
            
            const response = await fetch(`/api/ipfs/${hash}/${path}`, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`IPFS fetch failed: ${response.status}`);
            }
            
            const data = await response.json();
            ipfsCache.set(cacheKey, data);
            return data;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            console.warn(`Failed to fetch IPFS content (attempt ${attempt + 1}/${retries}):`, error);
            
            // Exponential backoff between retries
            if (attempt < retries - 1) {
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
            }
        }
    }
    
    throw new Error(
        `Failed to fetch IPFS content after ${retries} retries: ${
            lastError?.message || 'Unknown error'
        }`
    );
} 