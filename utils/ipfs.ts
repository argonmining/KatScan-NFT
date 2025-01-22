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

export async function getIPFSContent(uri: string) {
    if (!uri) return null;

    // Check cache first
    const cached = ipfsCache.get(uri);
    if (cached) return cached;

    try {
        const hash = getIPFSHash(uri);
        
        // Use our API proxy to fetch IPFS content
        const response = await fetch(`/api/ipfs/${hash}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch IPFS content: ${response.status}`);
        }

        const data = await response.json();
        
        // If the data has an image field that's an IPFS URI, process it
        if (data.image && data.image.startsWith('ipfs://')) {
            const imageHash = getIPFSHash(data.image);
            // Don't append .png if the image already has an extension
            data.imageUrl = hasImageExtension(data.image) 
                ? `/api/ipfs/${imageHash}`
                : `/api/ipfs/${imageHash}.png`;
        }

        // Cache the result
        ipfsCache.set(uri, data);
        return data;
    } catch (error) {
        console.error('Error fetching IPFS content:', error);
        return null;
    }
} 