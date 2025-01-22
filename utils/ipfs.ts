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

export async function getIPFSContent(uri: string, isImage: boolean = false): Promise<any> {
    if (metadataCache.has(uri)) {
        return metadataCache.get(uri);
    }

    try {
        const ipfsHash = uri.replace('ipfs://', '');
        const urls = [
            `https://w3s.link/ipfs/${ipfsHash}.json`,
            `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${ipfsHash}.json`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    metadataCache.set(uri, data);
                    return data;
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
} 