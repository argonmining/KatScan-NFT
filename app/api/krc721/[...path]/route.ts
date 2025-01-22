import { NextRequest } from 'next/server'
import { krc721Api } from '@/api/krc721'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const pathSegments = url.pathname.split('/').filter(Boolean).slice(2) // Remove 'api' and 'krc721'
        
        if (pathSegments[0] === 'nfts') {
            const tick = pathSegments[1]
            
            if (!tick) {
                return new Response(
                    JSON.stringify({ error: 'Tick is required' }), 
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                )
            }

            // Get collection details
            if (pathSegments.length === 2) {
                const response = await krc721Api.getCollectionDetails(tick)
                return new Response(
                    JSON.stringify(response), 
                    { headers: { 'Content-Type': 'application/json' } }
                )
            }

            // Get specific token
            if (pathSegments.length === 3) {
                const tokenId = pathSegments[2]
                const response = await krc721Api.getToken(tick, tokenId)
                return new Response(
                    JSON.stringify(response), 
                    { headers: { 'Content-Type': 'application/json' } }
                )
            }
        }

        return new Response(
            JSON.stringify({ error: 'Invalid endpoint' }), 
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('API Error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
} 