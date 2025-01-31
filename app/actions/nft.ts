import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { NFTDisplay, PaginatedNFTs, NFTMetadata } from '@/types/nft'
import { CollectionCache, CachedCollection } from '@/utils/collectionCache'

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
const INITIAL_BATCH_SIZE = 12; // Show first 12 immediately
const BACKGROUND_BATCH_SIZE = 50; // Fetch rest in chunks of 50
const DISPLAY_LIMIT = 200; // Show more NFTs per page

// Add proper type for initialCache
interface InitialCache extends CachedCollection {
    metadata: Record<string, NFTMetadata>;
    timestamp: number;
    traits: Record<string, Set<string>>;
    lastFetchedToken: number;
}

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

        // Try to get from IndexedDB first
        let cachedCollection = await CollectionCache.getCollection(tick);
        
        if (!cachedCollection) {
            // Initialize cache structure with proper typing
            const initialCache: InitialCache = {
                metadata: {},
                timestamp: Date.now(),
                traits: {},
                lastFetchedToken: 0
            };
            
            // Fetch initial visible batch
            const initialBatchPromises = Array.from(
                { length: Math.min(INITIAL_BATCH_SIZE, totalSupply) },
                async (_, i) => {
                    const tokenId = (i + 1).toString();
                    try {
                        const metadata = await fetchMetadataWithFallback(buri, tokenId);
                        if (metadata) {
                            // Process IPFS image URLs
                            if (metadata.image?.startsWith('ipfs://')) {
                                const imageHash = metadata.image.replace('ipfs://', '');
                                metadata.imageUrl = `/api/ipfs/${imageHash}`;
                            }
                            initialCache.metadata[tokenId] = metadata;
                        }
                        return { tokenId, metadata };
                    } catch (error) {
                        console.error(`Initial batch: Failed to fetch metadata for token ${tokenId}:`, error);
                        return null;
                    }
                }
            );

            await Promise.all(initialBatchPromises);
            
            // Save initial batch to cache
            await CollectionCache.setCollection(tick, initialCache);
            cachedCollection = initialCache;

            // Start background fetching
            if (totalSupply > INITIAL_BATCH_SIZE) {
                backgroundFetchMetadata(tick, buri, INITIAL_BATCH_SIZE + 1, totalSupply);
            }
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

// Fix the background fetch metadata function to properly update cache
async function backgroundFetchMetadata(
    tick: string,
    buri: string,
    startToken: number,
    totalSupply: number
) {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        for (let i = startToken; i <= totalSupply; i += BACKGROUND_BATCH_SIZE) {
            const batchEnd = Math.min(i + BACKGROUND_BATCH_SIZE - 1, totalSupply);
            
            // Get current cache
            const currentCache = await CollectionCache.getCollection(tick);
            if (!currentCache) continue;

            // Fetch batch
            const batchPromises = Array.from(
                { length: batchEnd - i + 1 },
                async (_, index) => {
                    const tokenId = (i + index).toString();
                    
                    // Skip if already cached
                    if (currentCache.metadata[tokenId]) return null;

                    await delay(50 * index); // Prevent rate limiting
                    try {
                        const metadata = await fetchMetadataWithFallback(buri, tokenId);
                        if (metadata) {
                            // Process IPFS image URLs
                            if (metadata.image?.startsWith('ipfs://')) {
                                const imageHash = metadata.image.replace('ipfs://', '');
                                metadata.imageUrl = `/api/ipfs/${imageHash}`;
                            }
                        }
                        return { tokenId, metadata };
                    } catch (error) {
                        console.error(`Background: Failed to fetch metadata for token ${tokenId}:`, error);
                        return null;
                    }
                }
            );

            const results = await Promise.all(batchPromises);
            
            // Update cache with new batch
            const updatedMetadata = { ...currentCache.metadata };
            results.forEach(result => {
                if (result?.metadata) {
                    updatedMetadata[result.tokenId] = result.metadata;
                }
            });

            // Update cache with proper type
            const updatedCache: CachedCollection = {
                ...currentCache,
                metadata: updatedMetadata,
                lastFetchedToken: batchEnd,
                timestamp: Date.now()
            };

            await CollectionCache.setCollection(tick, updatedCache);

            // Add delay between batches
            await delay(1000);
        }
    } catch (error) {
        console.error('Background fetch error:', error);
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

                // Create proper CachedCollection object
                const newCacheData: CachedCollection = {
                    timestamp: Date.now(),
                    metadata: metadataMap,
                    traits: {}, // Initialize empty traits - they'll be computed on retrieval
                    lastFetchedToken: Math.max(...Object.keys(metadataMap).map(Number))
                };

                await CollectionCache.setCollection(tick, newCacheData);
                cachedCollection = await CollectionCache.getCollection(tick);
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