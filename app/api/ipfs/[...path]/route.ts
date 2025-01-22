import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GATEWAYS = [
    'https://w3s.link',
    'https://ipfs.io',
    'https://cf-ipfs.com',
    'https://gateway.ipfs.io'
];

function hasImageExtension(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.split('/').filter(Boolean).slice(2).join('/');
        
        // If path doesn't have an extension and doesn't end in .json, treat as image
        const isImage = !path.endsWith('.json') && (!path.includes('.') || hasImageExtension(path));
        const targetPath = isImage && !hasImageExtension(path) ? `${path}.png` : path;

        // Try each gateway
        for (const gateway of GATEWAYS) {
            try {
                const response = await fetch(`${gateway}/ipfs/${targetPath}`);
                if (!response.ok) continue;

                // For images, stream the response directly
                if (isImage) {
                    const contentType = response.headers.get('content-type') || 'image/png';
                    return new Response(response.body, {
                        headers: {
                            'Content-Type': contentType,
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'public, max-age=31536000',
                        },
                    });
                }

                // For JSON metadata
                const data = await response.json();
                return new Response(JSON.stringify(data), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Cache-Control': 'public, max-age=31536000',
                    },
                });
            } catch (error) {
                console.error(`Failed to fetch from ${gateway}:`, error);
                continue;
            }
        }

        throw new Error('Failed to fetch from all gateways');
    } catch (error) {
        console.error('IPFS API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch IPFS content' }), 
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                } 
            }
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