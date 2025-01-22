import { NextRequest } from 'next/server'
import { krc721Api } from '@/app/api/krc721/krc721'

export const runtime = 'edge'

// Define allowed methods
const ALLOWED_METHODS = ['GET']

export async function GET(request: NextRequest) {
    try {
        // Check if method is allowed
        if (!ALLOWED_METHODS.includes(request.method)) {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }), 
                { 
                    status: 405,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Allow': ALLOWED_METHODS.join(', ')
                    } 
                }
            )
        }

        const url = new URL(request.url)
        const pathSegments = url.pathname.split('/').filter(Boolean).slice(2) // Remove 'api' and 'krc721'
        
        if (pathSegments[0] === 'nfts') {
            const tick = pathSegments[1]
            
            if (!tick) {
                return new Response(
                    JSON.stringify({ error: 'Tick is required' }), 
                    { 
                        status: 400, 
                        headers: { 'Content-Type': 'application/json' } 
                    }
                )
            }

            // Get collection details
            if (pathSegments.length === 2) {
                const response = await krc721Api.getCollectionDetails(tick)
                return new Response(
                    JSON.stringify(response), 
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET',
                        } 
                    }
                )
            }

            // Get specific token
            if (pathSegments.length === 3) {
                const tokenId = pathSegments[2]
                const response = await krc721Api.getToken(tick, tokenId)
                return new Response(
                    JSON.stringify(response), 
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET',
                        } 
                    }
                )
            }
        }

        return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }), 
            { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            }
        )
    } catch (error) {
        console.error('API Error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            }
        )
    }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 