import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { NFTDisplay, PaginatedNFTs, NFTMetadata, CollectionMetadata } from '@/types/nft'
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
const INITIAL_BATCH_SIZE = 24; // Show first 24 immediately
const BACKGROUND_BATCH_SIZE = 48; // Fetch next 48 in background
const CHUNK_SIZE = 20; // Process in chunks of 20
const MAX_CONCURRENT_CHUNKS = 5; // Process 5 chunks simultaneously
const DISPLAY_LIMIT = 24; // Default page size
const MAX_CACHE_SIZE = 2000; // Increase cache size for larger collections

// Add proper type for initialCache
interface InitialCache extends CachedCollection {
    metadata: Record<string, NFTMetadata>;
    timestamp: number;
    traits: Record<string, Set<string>>;
    lastFetchedToken: number;
}

// Queue processor for background fetching
class MetadataQueue {
    private queue: string[] = [];
    private processing = false;
    
    async add(tick: string, buri: string, ids: string[]) {
        this.queue.push(...ids);
        if (!this.processing) {
            this.processing = true;
            await this.process(tick, buri);
        }
    }

    private async process(tick: string, buri: string) {
        while (this.queue.length > 0) {
            const chunks = this.createChunks(this.queue.splice(0, BACKGROUND_BATCH_SIZE));
            await Promise.all(
                chunks.map(chunk => this.processChunk(tick, buri, chunk))
            );
        }
        this.processing = false;
    }

    private createChunks(ids: string[]): string[][] {
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            chunks.push(ids.slice(i, i + CHUNK_SIZE));
        }
        return chunks;
    }

    private async processChunk(tick: string, buri: string, chunk: string[]) {
        try {
            const [metadata, owners] = await Promise.all([
                Promise.all(
                    chunk.map(id => 
                        fetchMetadataWithFallback(buri, id)
                        .catch(error => {
                            console.error(`Failed to fetch metadata for token ${id}:`, error);
                            return null;
                        })
                    )
                ),
                krc721Api.getTokensBatch(tick, chunk)
            ]);

            const currentCache = await CollectionCache.getCollection(tick);
            if (!currentCache) return;

            const updatedMetadata = { ...currentCache.metadata };
            chunk.forEach((id, index) => {
                if (metadata[index]) {
                    const meta = metadata[index];
                    if (meta.image?.startsWith('ipfs://')) {
                        meta.imageUrl = `/api/ipfs/${meta.image.replace('ipfs://', '')}`;
                    }
                    updatedMetadata[id] = meta;
                }

                const status = owners[id];
                if (status) {
                    tokenStatusCache.set(`${tick}-${id}`, status);
                }
            });

            await CollectionCache.setCollection(tick, {
                ...currentCache,
                metadata: updatedMetadata,
                lastFetchedToken: Math.max(currentCache.lastFetchedToken, ...chunk.map(Number)),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Chunk processing error:', error);
        }
    }
}

const metadataQueue = new MetadataQueue();

// Add these interfaces near the top of the file
interface FetchState {
    isActive: boolean;
    controller: AbortController;
}

// Private map to track active fetches
const activeFetches = new Map<string, FetchState>();

// Export these functions to manage background fetches
export function stopBackgroundFetch(key: string) {
    const state = activeFetches.get(key);
    if (state) {
        state.isActive = false;
        state.controller.abort();
        activeFetches.delete(key);
    }
}

export function stopAllBackgroundFetches() {
    activeFetches.forEach((state, key) => {
        state.isActive = false;
        state.controller.abort();
    });
    activeFetches.clear();
}

// Add new function to fetch collection metadata
async function fetchCollectionMetadata(buri: string): Promise<CollectionMetadata | null> {
    try {
        // Clean up the buri by removing any 'ipfs:/' prefix
        const cleanBuri = buri.replace(/^ipfs:\/+/, '');
        console.log('Fetching collection metadata from:', cleanBuri);
        const response = await fetch(`/api/ipfs/${cleanBuri}/collection`);
        
        if (!response.ok) {
            console.log('Collection metadata not found:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        console.log('Collection metadata fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching collection metadata:', error);
        return null;
    }
}

// Update existing fetchCollectionNFTs function
export async function fetchCollectionNFTs(
    tick: string,
    params?: { limit?: number; offset?: string; filters?: Record<string, Set<string>> }
): Promise<PaginatedNFTs> {
    try {
        const collectionResponse = await krc721Api.getCollectionDetails(tick);
        
        if (!collectionResponse.result) {
            throw new Error(`Collection "${tick}" not found. Please check the ticker and try again.`);
        }

        const { buri, max: maxSupply, ...restCollectionData } = collectionResponse.result;
        if (!buri) {
            throw new Error('Collection has no metadata URI');
        }

        // Add collection metadata fetch
        const collectionMetadata = await fetchCollectionMetadata(buri);
        
        const totalSupply = parseInt(maxSupply);
        const startToken = params?.offset ? parseInt(params.offset) : 0;
        const limit = params?.limit || DISPLAY_LIMIT;

        // Try to get from cache first
        let cachedCollection = await CollectionCache.getCollection(tick);
        
        if (!cachedCollection) {
            // Initialize cache with empty data
            cachedCollection = {
                metadata: {},
                timestamp: Date.now(),
                traits: {},
                lastFetchedToken: 0
            };

            // Fetch initial batch metadata immediately
            const initialTokenIds = Array.from(
                { length: Math.min(INITIAL_BATCH_SIZE, totalSupply) },
                (_, i) => (i + 1).toString()
            );

            const [initialMetadata, initialOwners] = await Promise.all([
                Promise.all(
                    initialTokenIds.map(id => 
                        fetchMetadataWithFallback(buri, id)
                        .catch(error => {
                            console.error(`Failed to fetch metadata for token ${id}:`, error);
                            return null;
                        })
                    )
                ),
                krc721Api.getTokensBatch(tick, initialTokenIds)
            ]);

            // Update cache with initial metadata
            initialTokenIds.forEach((id, index) => {
                if (initialMetadata[index]) {
                    const meta = initialMetadata[index];
                    if (meta?.image?.startsWith('ipfs://')) {
                        meta.imageUrl = `/api/ipfs/${meta.image.replace('ipfs://', '')}`;
                    }
                    cachedCollection!.metadata[id] = meta;
                }
            });

            cachedCollection.lastFetchedToken = INITIAL_BATCH_SIZE;
            await CollectionCache.setCollection(tick, cachedCollection);

            // Start background fetching for remaining tokens
            if (totalSupply > INITIAL_BATCH_SIZE) {
                backgroundFetchMetadata(tick, buri, INITIAL_BATCH_SIZE + 1, totalSupply);
            }
        }

        // Get token ownership status for the current page
        const pageTokenIds = Array.from(
            { length: Math.min(limit, totalSupply - startToken) },
            (_, i) => (startToken + i + 1).toString()
        );

        // Log the token range we're fetching
        console.log('Fetching token range:', {
            startToken: startToken + 1,
            endToken: startToken + pageTokenIds.length,
            pageTokenIds
        });

        const tokenStatuses = await krc721Api.getTokensBatch(tick, pageTokenIds);

        // If we're beyond the initial batch and haven't fetched this range yet
        if (startToken + limit > INITIAL_BATCH_SIZE && 
            startToken + 1 > cachedCollection.lastFetchedToken) {
            // Fetch this batch immediately
            const batchTokenIds = pageTokenIds;
            const [batchMetadata] = await Promise.all([
                Promise.all(
                    batchTokenIds.map(id => 
                        fetchMetadataWithFallback(buri, id)
                        .catch(error => {
                            console.error(`Failed to fetch metadata for token ${id}:`, error);
                            return null;
                        })
                    )
                )
            ]);

            // Update cache with batch metadata
            batchTokenIds.forEach((id, index) => {
                if (batchMetadata[index]) {
                    const meta = batchMetadata[index];
                    if (meta?.image?.startsWith('ipfs://')) {
                        meta.imageUrl = `/api/ipfs/${meta.image.replace('ipfs://', '')}`;
                    }
                    cachedCollection!.metadata[id] = meta;
                }
            });

            // Update lastFetchedToken
            cachedCollection.lastFetchedToken = Math.max(
                cachedCollection.lastFetchedToken,
                ...batchTokenIds.map(Number)
            );
            await CollectionCache.setCollection(tick, cachedCollection);
        }

        // Remove the filtering of availableTokenIds since we want to show all tokens
        const availableTokenIds = pageTokenIds;

        let filteredTokenIds = availableTokenIds;

        // Apply filters if any
        if (params?.filters && Object.keys(params.filters).length > 0) {
            filteredTokenIds = availableTokenIds.filter(id => {
                const metadata = cachedCollection!.metadata[id];
                return metadata && Object.entries(params.filters!).every(([trait, values]) => {
                    const attribute = metadata.attributes?.find(attr => attr.trait_type === trait);
                    return attribute && values.has(attribute.value);
                });
            });
        }

        const nfts = filteredTokenIds.map((id): NFTDisplay => ({
            tick,
            id,
            owner: tokenStatuses[id]?.owner,
            metadata: cachedCollection!.metadata[id] || {
                name: `${tick} #${id}`,
                description: 'Loading metadata...',
                attributes: []
            },
            isMinted: tokenStatuses[id]?.isMinted ?? false
        })).filter(nft => nft); // Only filter out null/undefined

        // Trigger background fetch if needed
        if (startToken + limit > cachedCollection.lastFetchedToken) {
            const nextBatchStart = Math.max(cachedCollection.lastFetchedToken + 1, INITIAL_BATCH_SIZE + 1);
            if (nextBatchStart <= totalSupply) {
                backgroundFetchMetadata(tick, buri, nextBatchStart, totalSupply);
            }
        }

        return {
            nfts,
            hasMore: startToken + limit < totalSupply,
            nextOffset: startToken + limit < totalSupply ? 
                (startToken + limit).toString() : undefined,
            collection: {
                ...collectionResponse.result,
                collectionMetadata: collectionMetadata || undefined
            }
        };
    } catch (error) {
        console.error('Failed to fetch collection NFTs:', error);
        throw error;
    }
}

// Update the background fetch function
async function backgroundFetchMetadata(
    tick: string, 
    buri: string, 
    startIndex: number, 
    totalSupply: number
) {
    // Create new fetch state if doesn't exist
    if (!activeFetches.has(tick)) {
        activeFetches.set(tick, {
            isActive: true,
            controller: new AbortController()
        });
    }

    const state = activeFetches.get(tick)!;
    
    try {
        // Check if fetch should continue
        if (!state.isActive || state.controller.signal.aborted) {
            return;
        }

        const batchIds = Array.from(
            { length: Math.min(BACKGROUND_BATCH_SIZE, totalSupply - startIndex + 1) },
            (_, index) => (startIndex + index).toString()
        );

        await metadataQueue.add(tick, buri, batchIds);

        // Schedule next batch if not cancelled
        const nextStartIndex = startIndex + BACKGROUND_BATCH_SIZE;
        if (nextStartIndex <= totalSupply && state.isActive && !state.controller.signal.aborted) {
            setTimeout(() => {
                backgroundFetchMetadata(tick, buri, nextStartIndex, totalSupply);
            }, 100);
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Background fetch cancelled:', tick);
            return;
        }
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

// Add this helper function to fetch metadata for a specific NFT
async function fetchSingleNFTMetadata(
    tick: string,
    tokenId: string,
    buri: string
): Promise<NFTMetadata | null> {
    try {
        // Check if we already have this in the collection cache first
        const cachedCollection = await CollectionCache.getCollection(tick);
        if (cachedCollection?.metadata[tokenId]) {
            return cachedCollection.metadata[tokenId];
        }

        // If not in cache, fetch it directly
        const metadata = await fetchMetadataWithFallback(buri, tokenId);
        if (metadata?.image?.startsWith('ipfs://')) {
            metadata.imageUrl = `/api/ipfs/${metadata.image.replace('ipfs://', '')}`;
        }
        return metadata;
    } catch (error) {
        console.error(`Failed to fetch metadata for ${tick} token ${tokenId}:`, error);
        return null;
    }
}

// Add this interface to track address NFT fetching state
interface AddressNFTState {
    collections: AddressCollection[];
    lastFetchedIndices: Record<string, number>; // track progress per collection
    timestamp: number;
}

// Add this to store address NFT state
const addressNFTCache = new Map<string, AddressNFTState>();

// Add this interface near the top with other interfaces
interface AddressCollection {
    tick: string;
    tokens: Array<{
        tokenId: string;
        owner: string;
    }>;
}

const BATCH_SIZE = 10; // Process 10 NFTs at a time

// First, let's add the necessary interfaces
interface AddressHolding {
    tick: string;
    tokenId: string;
    owner: string;
}

interface AddressHoldingsResponse {
    holdings: AddressHolding[];
}

// Add interface for address NFT response
interface AddressNFT {
    tick: string;
    tokenId: string;
    owner: string;
}

// Add a delay utility function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchAddressNFTs(
    address: string,
    params?: { limit?: number; offset?: string }
): Promise<PaginatedNFTs> {
    try {
        const offset = params?.offset ? parseInt(params.offset) : 0;
        const limit = params?.limit || DISPLAY_LIMIT;

        // Get all NFTs for the address
        const addressNFTs = await krc721Api.getAddressNFTs(address);
        
        if (!addressNFTs?.length) {
            return { 
                nfts: [], 
                hasMore: false,
                nextOffset: undefined
            };
        }

        // Get the current page of NFTs
        const startIdx = offset;
        const endIdx = Math.min(startIdx + limit, addressNFTs.length);
        const currentBatch = addressNFTs.slice(startIdx, endIdx);

        // Get unique collections from the current batch
        const uniqueCollections = Array.from(new Set(currentBatch.map(nft => nft.tick)));

        // Fetch collection details in parallel
        const collectionDetails = await Promise.all(
            uniqueCollections.map(async (tick) => {
                // First check if we have this collection in cache
                const cachedCollection = await CollectionCache.getCollection(tick);
                if (cachedCollection) {
                    return { tick, details: cachedCollection };
                }

                // If not in cache, fetch collection details
                const details = await krc721Api.getCollectionDetails(tick);
                return { tick, details: details?.result };
            })
        );

        // Create a map for easy lookup
        const collectionsMap = new Map(
            collectionDetails.map(({ tick, details }) => [tick, details])
        );

        // Process NFTs in parallel
        const processedNFTs = await Promise.all(
            currentBatch.map(async (holding) => {
                try {
                    const collection = collectionsMap.get(holding.tick);
                    
                    // Check if we have metadata in collection cache
                    const cachedCollection = await CollectionCache.getCollection(holding.tick);
                    if (cachedCollection?.metadata[holding.tokenId]) {
                        return {
                            tick: holding.tick,
                            id: holding.tokenId,
                            owner: holding.owner,
                            metadata: cachedCollection.metadata[holding.tokenId],
                            isMinted: true
                        };
                    }

                    if (!collection?.buri) {
                        throw new Error(`No metadata URI found for collection ${holding.tick}`);
                    }

                    // Fetch metadata from IPFS
                    const metadata = await fetchMetadataWithRetry(
                        collection.buri,
                        holding.tokenId,
                        2
                    ).catch(async () => {
                        // Only try with .json extension as fallback
                        return fetchMetadataWithRetry(
                            collection.buri,
                            `${holding.tokenId}.json`,
                            1
                        );
                    });

                    // Ensure IPFS image handling is consistent
                    if (metadata?.image) {
                        if (metadata.image.startsWith('ipfs://')) {
                            metadata.imageUrl = `/api/ipfs/${metadata.image.replace('ipfs://', '')}`;
                        } else if (metadata.image.startsWith('http')) {
                            metadata.imageUrl = metadata.image;
                        } else {
                            // Handle case where image might be just the CID or path
                            metadata.imageUrl = `/api/ipfs/${metadata.image}`;
                        }
                    }

                    return {
                        tick: holding.tick,
                        id: holding.tokenId,
                        owner: holding.owner,
                        metadata: {
                            name: metadata.name || `${holding.tick} #${holding.tokenId}`,
                            description: metadata.description || '',
                            image: metadata.image || '',
                            imageUrl: metadata.imageUrl || '',
                            edition: metadata.edition || parseInt(holding.tokenId),
                            attributes: metadata.attributes || []
                        },
                        isMinted: true
                    };
                } catch (error) {
                    console.error(`Failed to process NFT ${holding.tick}-${holding.tokenId}:`, error);
                    // Return placeholder for failed NFTs
                    return {
                        tick: holding.tick,
                        id: holding.tokenId,
                        owner: holding.owner,
                        metadata: {
                            name: `${holding.tick} #${holding.tokenId}`,
                            description: 'Metadata unavailable',
                            image: '',
                            imageUrl: '',
                            edition: parseInt(holding.tokenId),
                            attributes: []
                        },
                        isMinted: true
                    };
                }
            })
        );

        return {
            nfts: processedNFTs,
            hasMore: endIdx < addressNFTs.length,
            nextOffset: endIdx < addressNFTs.length ? endIdx.toString() : undefined
        };
    } catch (error) {
        console.error('Failed to fetch address NFTs:', error);
        throw new Error(
            `Unable to find NFTs for address "${address}". Please verify the address and try again.`
        );
    }
}

// Helper function to fetch metadata with retries
async function fetchMetadataWithRetry(
    buri: string,
    tokenId: string,
    maxRetries: number
): Promise<any> {
    let lastError = null;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const metadata = await fetchMetadataWithFallback(buri, tokenId);
            return metadata;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${tokenId}:`, error);
            lastError = error;
            // Add exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    
    throw lastError;
} 