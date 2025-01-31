import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { NFTDisplay, PaginatedNFTs, NFTMetadata } from '@/types/nft'
import { CollectionCache } from '@/utils/collectionCache'

interface TokenStatus {
    owner?: string;
    isMinted: boolean;
}

interface TokenOwner {
    tokenId: string;
    owner: string;
}

// Cache for token ownership status
const tokenStatusCache = new Map<string, TokenStatus>();

// Update the batch sizes at the top of the file
const BATCH_SIZE = 500; // Increased from 200
const DISPLAY_LIMIT = 200; // Show more NFTs per page

export async function fetchCollectionNFTs(
    tick: string, 
    params?: { limit?: number; offset?: string; filters?: Record<string, Set<string>> }
): Promise<PaginatedNFTs> {
    try {
        // Fetch collection details and owners in parallel
        const [collectionResponse, ownersResponse] = await Promise.all([
            krc721Api.getCollectionDetails(tick),
            krc721Api.getAllTokenOwners(tick)
        ]);
        
        if (!collectionResponse.result) {
            throw new Error(`Collection "${tick}" not found. Please check the ticker and try again.`);
        }

        const { buri, minted, max, ...restCollectionData } = collectionResponse.result;
        if (!buri) {
            throw new Error('Collection has no metadata URI');
        }

        // Log the buri to verify we're getting it
        console.log('Collection base URI:', buri);

        const totalSupply = parseInt(max);
        const limit = params?.limit || DISPLAY_LIMIT;
        const offset = params?.offset ? parseInt(params.offset) : 0;

        // Get or fetch collection metadata
        let cachedCollection = await CollectionCache.getCollection(tick);
        
        if (!cachedCollection) {
            console.log('Fetching metadata for collection:', tick);
            const metadataMap: Record<string, NFTMetadata> = {};
            
            // Create metadata fetch batches with smaller batch size for testing
            const BATCH_SIZE = 50; // Reduced batch size for testing
            const batchPromises = [];
            
            for (let i = 0; i < totalSupply; i += BATCH_SIZE) {
                const batchEnd = Math.min(i + BATCH_SIZE, totalSupply);
                const batchPromise = Promise.all(
                    Array.from({ length: batchEnd - i }, async (_, index) => {
                        const tokenId = (i + index + 1).toString();
                        try {
                            // Log each metadata fetch attempt
                            console.log(`Fetching metadata for token ${tokenId}`);
                            const metadata = await fetchMetadataWithFallback(buri, tokenId);
                            if (metadata) {
                                if (metadata.image?.startsWith('ipfs://')) {
                                    const imageHash = metadata.image.replace('ipfs://', '');
                                    metadata.imageUrl = `/api/ipfs/${imageHash}`;
                                }
                                return { tokenId, metadata };
                            }
                        } catch (error) {
                            console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
                        }
                        return null;
                    })
                );
                batchPromises.push(batchPromise);
            }

            // Process all batches
            const batchResults = await Promise.all(batchPromises);
            
            // Process results and combine with ownership data
            batchResults.flat().forEach(result => {
                if (result?.metadata) {
                    metadataMap[result.tokenId] = result.metadata;
                }
            });

            // Log the metadata map size
            console.log('Fetched metadata count:', Object.keys(metadataMap).length);

            await CollectionCache.setCollection(tick, metadataMap);
            cachedCollection = await CollectionCache.getCollection(tick);
        }

        if (!cachedCollection || !Object.keys(cachedCollection.metadata).length) {
            console.error('No metadata found for collection');
            throw new Error('Failed to load collection metadata');
        }

        // Log the cached collection size
        console.log('Cached collection metadata count:', 
            Object.keys(cachedCollection.metadata).length);

        // Apply filters if any
        let filteredTokenIds = Object.keys(cachedCollection.metadata);
        if (params?.filters && Object.keys(params.filters).length > 0) {
            filteredTokenIds = filteredTokenIds.filter(tokenId => {
                const metadata = cachedCollection!.metadata[tokenId];
                return Object.entries(params.filters!).every(([trait_type, allowedValues]) => {
                    const attribute = metadata.attributes.find(
                        (attr: { trait_type: string; value: string }) => 
                        attr.trait_type === trait_type
                    );
                    return attribute && allowedValues.has(attribute.value);
                });
            });
        }

        // Sort and paginate filtered tokens
        const paginatedTokenIds = filteredTokenIds
            .sort((a, b) => parseInt(a) - parseInt(b))
            .slice(offset, offset + limit);

        // Batch fetch token status for visible NFTs
        const tokenIds = paginatedTokenIds;
        let tokenStatuses: Record<string, TokenStatus> = {};

        // Check cache first
        const uncachedTokenIds = tokenIds.filter(id => !tokenStatusCache.has(`${tick}-${id}`));

        if (uncachedTokenIds.length > 0) {
            // Fetch uncached token statuses in batch
            const batchResults = await krc721Api.getTokensBatch(tick, uncachedTokenIds);
            
            // Update cache with new results
            Object.entries(batchResults).forEach(([id, status]) => {
                const cacheKey = `${tick}-${id}`;
                tokenStatusCache.set(cacheKey, status);
            });
        }

        // Get all statuses from cache
        tokenStatuses = tokenIds.reduce((acc, id) => {
            const cacheKey = `${tick}-${id}`;
            const status = tokenStatusCache.get(cacheKey);
            acc[id] = status as TokenStatus;
            return acc;
        }, {} as Record<string, TokenStatus>);

        // Construct NFT objects
        const validNfts = paginatedTokenIds.map((tokenId): NFTDisplay => ({
            tick,
            id: tokenId,
            owner: tokenStatuses[tokenId].owner,
            metadata: cachedCollection!.metadata[tokenId],
            isMinted: tokenStatuses[tokenId].isMinted
        }));

        // Get collection metadata from first NFT
        const collectionMetadata = validNfts[0] ? {
            name: validNfts[0].metadata.name.replace(/#?\s*\d+$/, '').trim(),
            description: validNfts[0].metadata.description
        } : undefined;

        return {
            nfts: validNfts,
            hasMore: offset + limit < filteredTokenIds.length,
            nextOffset: offset + limit < filteredTokenIds.length ? (offset + limit).toString() : undefined,
            collection: {
                ...restCollectionData,
                minted,
                max,
                metadata: collectionMetadata
            }
        };
    } catch (error) {
        console.error('Collection fetch error:', error);
        throw error;
    }
}

// Helper function to fetch metadata in background
async function fetchMetadataBatch(buri: string, start: number, end: number): Promise<(NFTMetadata | null)[]> {
    const promises = Array.from({ length: end - start + 1 }, (_, i) => {
        const tokenId = start + i;
        return getIPFSContent(`${buri}/${tokenId}.json`)
            .catch(error => {
                console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
                return null;
            });
    });
    return Promise.all(promises);
}

// Helper function to check if string ends with common image extensions
function hasImageExtension(uri: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => uri.toLowerCase().endsWith(ext));
}

async function fetchMetadataWithFallback(baseUri: string, tokenId: string): Promise<any> {
    try {
        const uri = `${baseUri}/${tokenId}`;
        console.log('Fetching metadata from:', uri);
        
        const metadata = await getIPFSContent(uri);
        console.log('Metadata received:', metadata);
        return metadata;
    } catch (error) {
        console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
        throw error;
    }
}

export async function fetchAddressNFTs(
    address: string,
    params?: { limit?: number; offset?: string }
): Promise<PaginatedNFTs> {
    try {
        // Get all NFTs owned by the address
        const addressNFTs = await krc721Api.getAddressNFTs(address);
        
        // Group NFTs by collection
        const nftsByCollection = addressNFTs.reduce((acc, nft) => {
            if (!acc[nft.tick]) {
                acc[nft.tick] = [];
            }
            acc[nft.tick].push(nft);
            return acc;
        }, {} as Record<string, typeof addressNFTs>);

        // Fetch metadata for each collection
        const nftPromises = Object.entries(nftsByCollection).map(async ([tick, tokens]) => {
            let cachedCollection = await CollectionCache.getCollection(tick);
            
            if (!cachedCollection) {
                const collectionResponse = await krc721Api.getCollectionDetails(tick);
                if (!collectionResponse.result?.buri) {
                    throw new Error('Collection has no metadata URI');
                }

                const metadataMap: Record<string, NFTMetadata> = {};
                for (const token of tokens) {
                    try {
                        const metadata = await fetchMetadataWithFallback(collectionResponse.result.buri, token.tokenId);
                        if (metadata) {
                            // Process image URL if it's an IPFS URL
                            if (metadata.image && metadata.image.startsWith('ipfs://')) {
                                const imageHash = metadata.image.replace('ipfs://', '');
                                metadata.imageUrl = `/api/ipfs/${imageHash}`;
                            }
                            metadataMap[token.tokenId] = metadata;
                        }
                    } catch (error) {
                        console.error(`Failed to fetch metadata for token ${token.tokenId}:`, error);
                    }
                }

                await CollectionCache.setCollection(tick, metadataMap);
                cachedCollection = await CollectionCache.getCollection(tick);
            } else {
                // Process cached metadata images
                Object.values(cachedCollection.metadata).forEach(metadata => {
                    if (metadata.image && metadata.image.startsWith('ipfs://') && !metadata.imageUrl) {
                        const imageHash = metadata.image.replace('ipfs://', '');
                        metadata.imageUrl = `/api/ipfs/${imageHash}`;
                    }
                });
            }

            // Convert to NFTDisplay format
            return tokens.map((token): NFTDisplay => ({
                tick,
                id: token.tokenId,
                owner: address,
                metadata: cachedCollection!.metadata[token.tokenId],
                isMinted: true
            })).filter(nft => nft.metadata); // Filter out NFTs with missing metadata
        });

        const allNFTs = (await Promise.all(nftPromises)).flat();

        // Handle pagination
        const offset = params?.offset ? parseInt(params.offset) : 0;
        const limit = params?.limit || 50;
        const paginatedNFTs = allNFTs.slice(offset, offset + limit);

        return {
            nfts: paginatedNFTs,
            hasMore: offset + limit < allNFTs.length,
            nextOffset: offset + limit < allNFTs.length ? (offset + limit).toString() : undefined,
        };
    } catch (error) {
        console.error('Failed to fetch address NFTs:', error);
        throw new Error(
            `Unable to find NFTs for address "${address}". Please verify the address and try again.`
        );
    }
} 