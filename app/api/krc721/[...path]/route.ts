import { NextRequest, NextResponse } from 'next/server'
import { krc721Api } from '@/api/krc721'

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const path = params.path
        
        // Handle different API endpoints based on path segments
        if (path[0] === 'nfts') {
            const tick = path[1]
            
            if (!tick) {
                return NextResponse.json({ error: 'Tick is required' }, { status: 400 })
            }

            // Get collection details
            if (path.length === 2) {
                const response = await krc721Api.getCollectionDetails(tick)
                return NextResponse.json(response)
            }

            // Get specific token
            if (path.length === 3) {
                const tokenId = path[2]
                const response = await krc721Api.getToken(tick, tokenId)
                return NextResponse.json(response)
            }
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        )
    }
} 