import { NextRequest } from 'next/server'

export const runtime = 'edge'

const MARKETS_BASE_URL = 'https://markets.krc20.stream/krc721/mainnet/markets'

export interface MarketData {
    floor_price: number;
    total_volume: number;
    volume_24h: number;
    change_24h: number;
}

export type MarketsResponse = Record<string, MarketData>;

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(MARKETS_BASE_URL, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Markets API Error Response:', errorText);
            return new Response(
                JSON.stringify({ error: `API Error: ${response.status} - ${response.statusText}` }), 
                { 
                    status: response.status,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    } 
                }
            );
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('Markets API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
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