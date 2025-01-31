import { NextRequest } from 'next/server'
import { IPFS_GATEWAYS } from '@/utils/ipfs'

export const runtime = 'edge'

const GATEWAYS = [
    'https://w3s.link',        // Web3.Storage - fastest
    'https://dweb.link',       // Protocol Labs - very fast
    'https://ipfs.io',         // Protocol Labs - reliable
    'https://nftstorage.link', // NFT.Storage
    'https://gateway.pinata.cloud'  // Pinata fallback
];

const FETCH_TIMEOUT = 5000; // 5 seconds

function hasImageExtension(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
}

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(Boolean).slice(2);
        
        console.log('IPFS Request:', {
            path: url.pathname,
            segments: pathSegments
        });
        
        const cid = pathSegments[0];
        const remainingPath = pathSegments.slice(1).join('/');
        const isImage = hasImageExtension(remainingPath);

        let lastError: Error | null = null;
        
        for (const gateway of GATEWAYS) {
            try {
                const gatewayUrl = `${gateway}/ipfs/${cid}/${remainingPath}`;
                console.log('Trying gateway URL:', gatewayUrl);

                const response = await fetchWithTimeout(gatewayUrl);
                
                if (!response.ok) {
                    console.warn(`Gateway ${gateway} returned ${response.status}`);
                    continue;
                }

                // Handle images differently from JSON metadata
                if (isImage) {
                    const imageData = await response.arrayBuffer();
                    return new Response(imageData, {
                        headers: {
                            'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'public, max-age=31536000',
                        },
                    });
                } else {
                    // For JSON metadata
                    const data = await response.json();
                    return new Response(JSON.stringify(data), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'public, max-age=31536000',
                        },
                    });
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.error(`Failed to fetch from ${gateway}:`, error);
                continue;
            }
        }

        throw new Error(`Failed to fetch from all gateways: ${lastError?.message}`);
    } catch (error) {
        console.error('IPFS API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch IPFS content', details: error instanceof Error ? error.message : 'Unknown error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 