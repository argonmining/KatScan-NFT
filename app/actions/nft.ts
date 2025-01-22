'use server'

import { ofetch } from 'ofetch'
import { krc721Api } from '@/app/api/krc721/krc721'
import { NFTDisplay, NFTMetadata } from '@/types/nft'
import { getIPFSContent } from '@/utils/ipfs'

interface CollectionResponse {
    message: string;
    result?: {
        buri?: string;
        metadata?: {
            name: string;
            description: string;
            image: string;
        };
        minted: string;
    };
}

interface TokensResponse {
    message: string;
    result?: {
        id: string;
        owner: string;
    }[];
    next?: string;
}

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

export async function fetchCollectionNFTs(
    tick: string, 
    params?: { limit?: number; offset?: string }
): Promise<{ nfts: NFTDisplay[]; hasMore: boolean; nextOffset?: string }> {
    try {
        // Use ofetch instead of fetch
        const collectionResponse = await ofetch(`/api/krc721/nfts/${tick}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!collectionResponse.result) {
            throw new Error(collectionResponse.message || 'Collection not found');
        }

        const { buri, minted } = collectionResponse.result;
        if (!buri) {
            throw new Error('Collection has no metadata URI');
        }

        const totalMinted = parseInt(minted);
        const limit = params?.limit || 12;
        const offset = params?.offset ? parseInt(params.offset) : 0;

        // Fetch tokens using ofetch
        const tokens = await Promise.all(
            Array.from({ length: limit }, async (_, i) => {
                const tokenId = (offset + i + 1).toString();
                try {
                    return await ofetch(`/api/krc721/nfts/${tick}/${tokenId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (error) {
                    return null;
                }
            })
        );

        // Process valid responses and fetch metadata in parallel
        const nfts = await Promise.all(
            tokens
                .filter(token => token?.result)
                .map(async (token) => {
                    try {
                        const tokenId = token.result.id;
                        const metadataUri = `${buri}/${tokenId}`;
                        const metadata = await getIPFSContent(metadataUri);
                        
                        if (!metadata) return null;

                        return {
                            tick,
                            id: tokenId,
                            owner: token.result.owner,
                            buri,
                            metadata
                        };
                    } catch (error) {
                        return null;
                    }
                })
        );

        const validNfts = nfts.filter(nft => nft !== null) as NFTDisplay[];

        return {
            nfts: validNfts,
            hasMore: offset + limit < totalMinted,
            nextOffset: offset + limit < totalMinted ? (offset + limit).toString() : undefined,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch NFTs: ${error.message}`);
        }
        throw new Error('Failed to fetch NFTs: Unknown error');
    }
} 