import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const path = params.path.join('/')
    const { searchParams } = new URL(request.url)
    const network = process.env.NEXT_PUBLIC_KRC721_NETWORK || 'testnet-10'
    
    const apiUrl = `https://${network}.krc721.stream/api/v1/krc721/${network}/${path}${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
} 