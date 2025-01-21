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
    try {
        const hash = uri.replace('ipfs://', '');
        console.log(`Fetching IPFS ${isImage ? 'image' : 'metadata'} for hash:`, hash);

        const headers: Record<string, string> = isImage ? 
            { 'Cache-Control': 'no-cache' } : 
            { 'Accept': 'application/json', 'Cache-Control': 'no-cache' };

        // For metadata requests
        if (!isImage) {
            const [baseHash, tokenId] = hash.split('/');
            if (tokenId) {
                // Always append .json for metadata requests
                const metadataUrl = `${PRIMARY_GATEWAY}/ipfs/${baseHash}/${tokenId}.json`;
                console.log('Fetching token metadata:', metadataUrl);
                try {
                    const response = await fetchWithTimeout(metadataUrl, { headers });

                    if (response.ok) {
                        const metadata = await response.json() as IPFSMetadata;
                        console.log('Token metadata retrieved:', metadata);
                        
                        // Convert IPFS image URL to gateway URL with extension
                        if (metadata.image) {
                            const imageHash = metadata.image.replace('ipfs://', '');
                            // Try each extension until we find one that works
                            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
                            for (const ext of imageExtensions) {
                                const imageUrl = `${PINATA_GATEWAY}/ipfs/${imageHash}${ext}`;
                                try {
                                    console.log('Trying image URL:', imageUrl);
                                    const imgResponse = await fetchWithTimeout(imageUrl);
                                    if (imgResponse.ok) {
                                        metadata.imageUrl = imageUrl;
                                        console.log('Found working image URL:', imageUrl);
                                        break;
                                    }
                                } catch (err) {
                                    console.log(`Failed to verify image with ${ext}`);
                                }
                            }
                        }
                        
                        return metadata;
                    }
                } catch (err) {
                    const error = err as Error;
                    console.log('Failed to fetch token metadata:', error.message);
                }

                // Try Pinata if primary gateway fails
                if (PINATA_GATEWAY) {
                    try {
                        const url = `${PINATA_GATEWAY}/ipfs/${baseHash}/${tokenId}.json`;
                        console.log('Trying Pinata gateway:', url);
                        const response = await fetchWithTimeout(url, { headers });
                        if (response.ok) {
                            return await response.json();
                        }
                    } catch (err) {
                        const error = err as Error;
                        console.log('Pinata gateway failed:', error.message);
                    }
                }

                // Try fallback gateways
                for (const gateway of FALLBACK_GATEWAYS) {
                    try {
                        const url = `${gateway}/ipfs/${baseHash}/${tokenId}.json`;
                        console.log('Trying fallback gateway:', url);
                        const response = await fetchWithTimeout(url, { headers });
                        if (response.ok) {
                            return await response.json();
                        }
                    } catch (err) {
                        const error = err as Error;
                        console.log(`Gateway ${gateway} failed:`, error.message);
                    }
                }
            }
        } else {
            const [baseHash, tokenId] = hash.split('/');
            if (tokenId) {
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
                for (const ext of imageExtensions) {
                    const url = `${PRIMARY_GATEWAY}/ipfs/${baseHash}/${tokenId}${ext}`;
                    console.log('Trying image URL:', url);
                    try {
                        const response = await fetchWithTimeout(url, { headers });
                        if (response.ok) {
                            console.log('Image found with extension:', ext);
                            return response;
                        }
                    } catch (err) {
                        const error = err as Error;
                        console.log(`Failed to fetch image with ${ext}:`, error.message);
                    }
                }
            }
        }

        // Try Pinata if configured
        if (PINATA_GATEWAY) {
            try {
                if (isImage) {
                    const [baseHash, tokenId] = hash.split('/');
                    if (tokenId) {
                        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
                        for (const ext of imageExtensions) {
                            const url = `${PINATA_GATEWAY}/ipfs/${baseHash}/${tokenId}${ext}`;
                            console.log('Trying Pinata image URL:', url);
                            const response = await fetchWithTimeout(url, { headers });
                            if (response.ok) {
                                console.log('Image found on Pinata with extension:', ext);
                                return response;
                            }
                        }
                    }
                }

                const url = `${PINATA_GATEWAY}/ipfs/${hash}`;
                console.log('Trying Pinata gateway:', url);
                const response = await fetchWithTimeout(url, { headers });
                if (response.ok) {
                    return isImage ? response : await response.json();
                }
            } catch (err) {
                const error = err as Error;
                console.log('Pinata gateway failed:', error.message);
            }
        }

        // Try fallback gateways
        for (const gateway of FALLBACK_GATEWAYS) {
            try {
                const url = `${gateway}/ipfs/${hash}`;
                console.log('Trying fallback gateway:', url);
                const response = await fetchWithTimeout(url, { headers });
                if (response.ok) {
                    return isImage ? response : await response.json();
                }
            } catch (err) {
                const error = err as Error;
                console.log(`Gateway ${gateway} failed:`, error.message);
            }
        }

        console.error(`Failed to retrieve IPFS ${isImage ? 'image' : 'metadata'}`);
        return null;
    } catch (err) {
        const error = err as Error;
        console.error('IPFS fetch error:', error);
        return null;
    }
} 