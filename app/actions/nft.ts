'use server'

import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { NFTDisplay, PaginatedNFTs } from '@/types/nft'

export async function fetchCollectionNFTs(
    tick: string, 
    params?: { limit?: number; offset?: string }
): Promise<PaginatedNFTs> {
    try {
        // Get collection details
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

        // Fetch metadata for each token in range
        const nftPromises = Array.from({ length: limit }, async (_, i) => {
            const tokenId = (offset + i + 1).toString();
            try {
                // Fetch metadata from IPFS
                const metadata = await getIPFSContent(`${buri}/${tokenId}.json`);
                if (!metadata) return null;

                // Check if token is minted
                let owner: string | undefined;
                let isMinted = false;
                try {
                    const tokenResponse = await krc721Api.getToken(tick, tokenId);
                    if (tokenResponse.result) {
                        owner = tokenResponse.result.owner;
                        isMinted = true;
                    }
                } catch (error) {
                    console.error(`Token ${tokenId} not minted yet`);
                }

                return {
                    tick,
                    id: tokenId,
                    owner,
                    metadata,
                    isMinted
                };
            } catch (error) {
                console.error(`Failed to fetch NFT ${tokenId}:`, error);
                return null;
            }
        });

        const nftResults = await Promise.all(nftPromises);
        const validNfts = nftResults.filter(nft => nft !== null) as NFTDisplay[];

        return {
            nfts: validNfts,
            hasMore: offset + limit < 1000,
            nextOffset: offset + limit < 1000 ? (offset + limit).toString() : undefined
        };
    } catch (error) {
        console.error('Failed to fetch collection NFTs:', error);
        throw error;
    }
}

export async function loadMoreNFTsAction(
    tick: string,
    offset: string,
    limit: number = 100
): Promise<PaginatedNFTs> {
    return fetchCollectionNFTs(tick, { limit, offset });
} 