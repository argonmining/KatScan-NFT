import { NextRequest } from 'next/server'

export const runtime = 'edge'

const BASE_URL = 'https://mainnet.krc721.stream/api/v1/krc721/mainnet'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const pathSegments = url.pathname.split('/').filter(Boolean).slice(2) // Remove 'api' and 'krc721'
        
        // Construct the target URL with query parameters
        const targetUrl = `${BASE_URL}/${pathSegments.join('/')}${url.search}`

        // Forward the request to the KRC721 API
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            return new Response(
                JSON.stringify({ error: `API Error: ${response.status} - ${response.statusText}` }), 
                { 
                    status: response.status,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    } 
                }
            )
        }

        const data = await response.json()

        // Return the response with CORS headers
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })
    } catch (error) {
        console.error('API Error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                } 
            }
        )
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 