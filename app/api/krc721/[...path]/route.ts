import { NextRequest } from 'next/server'
import { krc721Api } from '@/api/krc721'

export async function GET(
    request: NextRequest,
    context: { params: { path: string[] } }
) {
    try {
        const path = context.params.path
        
        // Handle different API endpoints based on path segments
        if (path[0] === 'nfts') {
            const tick = path[1]
            
            if (!tick) {
                return Response.json({ error: 'Tick is required' }, { status: 400 })
            }

            // Get collection details
            if (path.length === 2) {
                const response = await krc721Api.getCollectionDetails(tick)
                return Response.json(response)
            }

            // Get specific token
            if (path.length === 3) {
                const tokenId = path[2]
                const response = await krc721Api.getToken(tick, tokenId)
                return Response.json(response)
            }
        }

        return Response.json({ error: 'Invalid endpoint' }, { status: 404 })
    } catch (error) {
        console.error('API Error:', error)
        return Response.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        )
    }
} 