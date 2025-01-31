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

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    // Ensure params is properly awaited
    const pathSegments = await Promise.resolve(params.path);
    const path = pathSegments.join('/');
    
    console.log('IPFS Request:', { path, segments: pathSegments });

    // Determine content type based on file extension
    const fileExtension = path.split('.').pop()?.toLowerCase();
    const isJson = !fileExtension || fileExtension === 'json';
    
    // Add retry logic with exponential backoff for rate limits
    for (const gateway of GATEWAYS) {
        try {
            const url = `${gateway}/ipfs/${path}`;
            console.log('Trying gateway URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': isJson ? 'application/json' : '*/*',
                }
            });
            
            if (response.status === 429) {
                console.log(`Rate limited by ${gateway}, trying next gateway`);
                continue;
            }

            if (!response.ok) {
                console.log(`Gateway ${gateway} returned ${response.status}`);
                continue;
            }

            // For JSON files, validate the response
            if (isJson) {
                try {
                    const data = await response.json();
                    return Response.json(data);
                } catch (e) {
                    console.log(`Failed to parse JSON from ${gateway}:`, e);
                    continue;
                }
            }

            // For non-JSON files (images, videos, etc.), stream the response
            const headers = new Headers(response.headers);
            return new Response(response.body, {
                status: 200,
                headers
            });

        } catch (error) {
            console.log(`Failed to fetch from ${gateway}:`, error);
            continue;
        }
    }

    console.error('IPFS API Error:', new Error('Failed to fetch from all gateways'));
    return new Response('Failed to fetch from IPFS', { status: 500 });
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