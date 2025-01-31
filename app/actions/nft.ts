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
const BACKGROUND_BATCH_SIZE = 100; // Larger batch for background
const CHUNK_SIZE = 20; // Process in chunks of 20
const MAX_CONCURRENT_CHUNKS = 5; // Process 5 chunks simultaneously
const DISPLAY_LIMIT = 50; // Keep this smaller for smoother loading
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

export async function fetchCollectionNFTs(
    tick: string, 
    params?: { limit?: number; offset?: string; filters?: Record<string, Set<string>> }
): Promise<PaginatedNFTs> {
    try {
        // First, only fetch collection details - this is fast
        const collectionResponse = await krc721Api.getCollectionDetails(tick);
        
        if (!collectionResponse.result) {
            throw new Error(`Collection "${tick}" not found. Please check the ticker and try again.`);
        }

        const { buri, minted, max, ...restCollectionData } = collectionResponse.result;
        if (!buri) {
            throw new Error('Collection has no metadata URI');
        }

        const totalSupply = parseInt(max);
        const offset = params?.offset ? parseInt(params.offset) : 0;
        const limit = params?.limit || DISPLAY_LIMIT;

        // Try to get from cache first
        let cachedCollection = await CollectionCache.getCollection(tick);
        
        if (!cachedCollection) {
            // Initialize cache with empty data
            const initialCache: InitialCache = {
                metadata: {},
                timestamp: Date.now(),
                traits: {},
                lastFetchedToken: 0
            };

            // Only fetch first INITIAL_BATCH_SIZE tokens for immediate display
            const initialTokenIds = Array.from(
                { length: Math.min(INITIAL_BATCH_SIZE, totalSupply) }, 
                (_, i) => (i + 1).toString()  // Start from 1
            );

            // Fetch metadata and owners in parallel for initial batch
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

            // Process initial batch
            initialTokenIds.forEach((id, index) => {
                if (initialMetadata[index]) {
                    const metadata = initialMetadata[index];
                    if (metadata.image?.startsWith('ipfs://')) {
                        metadata.imageUrl = `/api/ipfs/${metadata.image.replace('ipfs://', '')}`;
                    }
                    initialCache.metadata[id] = metadata;
                }
                
                // Cache owner status
                const status = initialOwners[id];
                if (status) {
                    tokenStatusCache.set(`${tick}-${id}`, status);
                }
            });

            // Save initial batch to cache
            await CollectionCache.setCollection(tick, initialCache);
            cachedCollection = initialCache;

            // Start background fetching for remaining tokens
            if (totalSupply > INITIAL_BATCH_SIZE) {
                backgroundFetchMetadata(tick, buri, INITIAL_BATCH_SIZE + 1, totalSupply);
            }
        }

        // Handle pagination and filtering with available data
        const availableTokenIds = Array.from(
            { length: totalSupply },
            (_, i) => (i + 1).toString()
        ).filter(id => cachedCollection.metadata[id] || parseInt(id) <= cachedCollection.lastFetchedToken);

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

        // Paginate filtered results
        const paginatedTokenIds = filteredTokenIds
            .slice(offset, offset + limit);

        // Convert to NFTDisplay format using cached data
        const nfts = paginatedTokenIds.map((id): NFTDisplay => ({
            tick,
            id,
            owner: tokenStatusCache.get(`${tick}-${id}`)?.owner,
            metadata: cachedCollection!.metadata[id],
            isMinted: tokenStatusCache.get(`${tick}-${id}`)?.isMinted ?? false
        })).filter(nft => nft.metadata); // Filter out NFTs with missing metadata

        // Trigger background fetch if needed
        if (offset + limit > cachedCollection.lastFetchedToken) {
            const nextBatchStart = Math.max(cachedCollection.lastFetchedToken + 1, INITIAL_BATCH_SIZE + 1);
            if (nextBatchStart <= totalSupply) {
                backgroundFetchMetadata(tick, buri, nextBatchStart, totalSupply);
            }
        }

        return {
            nfts,
            hasMore: offset + limit < totalSupply,
            nextOffset: offset + limit < totalSupply ? 
                (offset + limit).toString() : undefined,
        };
    } catch (error) {
        console.error('Failed to fetch collection NFTs:', error);
        throw error;
    }
}

// Update background fetch to use queue
async function backgroundFetchMetadata(
    tick: string, 
    buri: string, 
    startIndex: number, 
    totalSupply: number
) {
    try {
        const batchIds = Array.from(
            { length: Math.min(BACKGROUND_BATCH_SIZE, totalSupply - startIndex + 1) },
            (_, index) => (startIndex + index).toString()
        );

        await metadataQueue.add(tick, buri, batchIds);

        // If there are more tokens to fetch, schedule the next batch
        const nextStartIndex = startIndex + BACKGROUND_BATCH_SIZE;
        if (nextStartIndex <= totalSupply) {
            setTimeout(() => {
                backgroundFetchMetadata(tick, buri, nextStartIndex, totalSupply);
            }, 100);
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