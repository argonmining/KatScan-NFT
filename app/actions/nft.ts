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

export async function fetchCollectionNFTs(tick: string, options: { limit?: number; offset?: string } = {}) {
    try {
        const collectionResponse = await krc721Api.getCollectionDetails(tick);
        
        if (collectionResponse.message !== 'success' || !collectionResponse.result) {
            throw new Error('Collection not found');
        }

        const collection = collectionResponse.result;
        const totalMinted = parseInt(collection.minted);
        const limit = options.limit || 12;  // Increase default limit to 12
        const startId = options.offset ? parseInt(options.offset) : 0;

        // Get NFTs for this page
        const nftResponses = await krc721Api.getCollectionNFTs(tick, startId + 1, limit);
        const nftList: NFTDisplay[] = [];

        // Process NFTs and get metadata
        for (const response of nftResponses) {
            if (!response?.result) continue;
            
            const metadata = await getIPFSContent(collection.buri?.replace('{id}', response.result.id));
            
            nftList.push({
                tick: tick,
                id: response.result.id,
                owner: response.result.owner,
                buri: collection.buri,
                metadata: metadata
            });
        }

        return {
            nfts: nftList,
            hasMore: startId + limit < totalMinted,
            nextOffset: startId + limit < totalMinted ? (startId + limit).toString() : undefined
        };
    } catch (error) {
        console.error('Error fetching collection NFTs:', error);
        throw error;
    }
} 