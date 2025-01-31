const ipfsCache = new Map<string, any>();
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

// Timeout for fetch requests in milliseconds
const FETCH_TIMEOUT = 10000;

const metadataCache = new Map<string, any>();

export interface IPFSMetadata {
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

// Update to match server-side gateways
export const IPFS_GATEWAYS = [
    'https://w3s.link/ipfs/',        // Web3.Storage - fastest
    'https://dweb.link/ipfs/',       // Protocol Labs - very fast
    'https://ipfs.io/ipfs/',         // Protocol Labs - reliable
    'https://nftstorage.link/ipfs/', // NFT.Storage
    'https://gateway.pinata.cloud/ipfs/'  // Pinata fallback
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
export function hasImageExtension(uri: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => uri.toLowerCase().endsWith(ext));
}

// Helper function to get IPFS hash from URI
export function getIPFSHash(uri: string): string {
    return uri.replace('ipfs://', '');
}

export async function getIPFSContent(uri: string, retries = 3): Promise<any> {
    const hash = uri.replace('ipfs://', '').split('/')[0];
    const path = uri.replace('ipfs://', '').split('/').slice(1).join('/');
    
    const response = await fetch(`/api/ipfs/${hash}/${path}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });
    
    if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.status}`);
    }
    
    return response.json();
} 