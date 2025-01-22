'use server'

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
        // First get collection info to get total minted and metadata URI
        const collectionResponse = await krc721Api.getCollectionDetails(tick);
        
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

        // Fetch all minted tokens in one call
        const allTokens = await krc721Api.getAllMintedTokens(tick);
        
        // Sort tokens by ID and apply pagination
        const paginatedTokens = allTokens
            .sort((a, b) => parseInt(a.result.tokenid) - parseInt(b.result.tokenid))
            .slice(offset, offset + limit);

        // Process valid responses and fetch metadata in parallel
        const nfts = await Promise.all(
            paginatedTokens.map(async (token) => {
                try {
                    const tokenId = token.result.tokenid;
                    if (!tokenId) return null;

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
            hasMore: offset + limit < allTokens.length,
            nextOffset: offset + limit < allTokens.length ? (offset + limit).toString() : undefined,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch NFTs: ${error.message}`);
        }
        throw new Error('Failed to fetch NFTs: Unknown error');
    }
} 