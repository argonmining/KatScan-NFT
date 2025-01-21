'use server'

import { krc721Api } from '@/api/krc721'
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
        const collectionResponse = await krc721Api.getCollectionDetails(tick);
        console.log('Collection Response:', collectionResponse);

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

        // Use new method to get tokens
        const tokenResponses = await krc721Api.getCollectionTokens(tick, offset + 1, limit);
        console.log('Token Responses:', tokenResponses);

        // Process valid responses and fetch metadata
        const nfts = await Promise.all(
            tokenResponses.map(async (response) => {
                try {
                    console.log('Processing token response:', response);
                    
                    const tokenId = response.result.tokenid || response.result.id;
                    if (!tokenId) {
                        console.error('No token ID found in response:', response);
                        return null;
                    }

                    // Get metadata from IPFS
                    const metadataUri = `${buri}/${tokenId}`;
                    console.log('Fetching metadata from:', metadataUri);
                    
                    const metadata = await getIPFSContent(metadataUri) as NFTMetadata;
                    console.log('Received metadata:', metadata);
                    
                    if (!metadata) {
                        console.error('Failed to fetch metadata for token:', tokenId);
                        return null;
                    }

                    return {
                        tick,
                        id: tokenId,
                        owner: response.result.owner,
                        buri,
                        metadata
                    };
                } catch (error) {
                    console.error('Error processing token:', error);
                    return null;
                }
            })
        );

        // Filter out null values and log final result
        const validNfts = nfts.filter(nft => nft !== null) as NFTDisplay[];
        console.log('Final processed NFTs:', validNfts);

        return {
            nfts: validNfts,
            hasMore: offset + limit < totalMinted,
            nextOffset: offset + limit < totalMinted ? (offset + limit).toString() : undefined,
        };
    } catch (error) {
        console.error('Error in fetchCollectionNFTs:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch NFTs: ${error.message}`);
        }
        throw new Error('Failed to fetch NFTs: Unknown error');
    }
} 