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

// Helper function to get file extension from URI or default to checking content type
async function getFileExtension(uri: string, hash: string): Promise<string> {
    // If URI has extension, use it
    const extensionMatch = uri.match(/\.[^.]+$/);
    if (extensionMatch) return extensionMatch[0];

    // Try to detect extension from content type
    try {
        const response = await fetch(`${PRIMARY_GATEWAY}/ipfs/${hash}`, {
            method: 'HEAD',
        });
        const contentType = response.headers.get('content-type');
        if (contentType) {
            switch (contentType.toLowerCase()) {
                case 'image/jpeg':
                    return '.jpg';
                case 'image/png':
                    return '.png';
                case 'image/gif':
                    return '.gif';
                case 'image/webp':
                    return '.webp';
                case 'image/svg+xml':
                    return '.svg';
                default:
                    return '.png'; // Default to .png if unknown image type
            }
        }
    } catch (error) {
        console.error('Error detecting file type:', error);
    }

    return '.png'; // Default extension if detection fails
}

export async function getIPFSContent(uri: string) {
    if (!uri) return null;

    // Check cache first
    const cached = ipfsCache.get(uri);
    if (cached) return cached;

    try {
        const hash = getIPFSHash(uri);

        // If it's an image (has image extension or is a single file), try to detect type
        if (hasImageExtension(uri) || !uri.includes('.')) {
            const extension = await getFileExtension(uri, hash);
            const imageUrl = `${PRIMARY_GATEWAY}/ipfs/${hash}${extension}`;
            return { imageUrl };
        }

        // For metadata JSON files, try each gateway
        for (const gateway of [PRIMARY_GATEWAY, ...FALLBACK_GATEWAYS]) {
            try {
                const response = await fetchWithTimeout(`${gateway}/ipfs/${hash}`);
                if (!response.ok) continue;

                const data = await response.json();
                
                // If the data has an image field that's an IPFS URI, process it
                if (data.image && data.image.startsWith('ipfs://')) {
                    const imageHash = getIPFSHash(data.image);
                    // Check content type for image field
                    const extension = await getFileExtension(data.image, imageHash);
                    data.imageUrl = `${PRIMARY_GATEWAY}/ipfs/${imageHash}${extension}`;
                }

                // Cache the result
                ipfsCache.set(uri, data);
                return data;
            } catch (error) {
                console.error(`Failed to fetch from ${gateway}:`, error);
                continue;
            }
        }
        throw new Error('Failed to fetch from all gateways');
    } catch (error) {
        console.error('Error fetching IPFS content:', error);
        return null;
    }
} 