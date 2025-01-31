import { ofetch } from 'ofetch'

// Types
export type Network = 'mainnet' | 'testnet-10' | 'testnet-11';
type SOMPI = string;
type DAA = string;
type U64 = string;
type Address = string;
type Direction = 'forward' | 'backward' | 'back';

// API Response Interface
interface ApiResponse<T> {
    message: string;
    result?: T;
    next?: string;
}

// Collection Interfaces
interface Collection {
    buri?: string;
    max: string;
    tick: string;
    txIdRev: string;
    mtsAdd: string;
    minted: string;
    opScoreMod: string;
    state: string;
    mtsMod: string;
    opScoreAdd: string;
    royaltyFee?: string;
    royaltyTo?: string;
    mintDaaScore?: string;
}

interface CollectionDetails extends Collection {
    metadata?: {
        name: string;
        description: string;
        image: string;
    };
    owners: {
        address: string;
        id: string;
    }[];
}

// Token Interface
interface Token {
    tick: string;
    id: string;
    owner: string;
    buri?: string;
}

// Operation Interfaces
interface BaseOperation {
    p: 'krc-721';
    op: 'deploy' | 'mint' | 'transfer';
    tick: string;
    actor: string;
    opScore: string;
    txIdRev: string;
    mtsAdd: string;
    opError?: string;
    feeRev: string;
}

interface DeployOperation extends BaseOperation {
    op: 'deploy';
    opData: {
        buri?: string;
        max: string;
    };
}

interface MintOperation extends BaseOperation {
    op: 'mint';
    opData: {
        token_id: string;
        to: string;
    };
}

interface TransferOperation extends BaseOperation {
    op: 'transfer';
    opData: {
        id: string;
        to: string;
    };
}

type Operation = DeployOperation | MintOperation | TransferOperation;

// Get network from environment or default to testnet-10
const DEFAULT_NETWORK: Network = (process.env.NEXT_PUBLIC_KRC721_NETWORK as Network) || 'testnet-10';

// Add interface at the top with other interfaces
interface TokenStatus {
    owner?: string;
    isMinted: boolean;
}

// Add these types
interface AddressCollection {
    tick: string;
    tokens: Array<{
        tokenId: string;
        owner: string;
    }>;
}

// Add this interface near the top with other interfaces
interface AddressNFT {
    tick: string;
    tokenId: string;
    buri?: string;
    owner: string;
}

export class KRC721Api {
    private network: Network;
    private baseUrl: string;
    private tokenStatusCache: Map<string, TokenStatus>;

    constructor(network: Network = DEFAULT_NETWORK) {
        this.network = network;
        this.baseUrl = ''; // Will be set properly in setNetwork
        this.tokenStatusCache = new Map<string, TokenStatus>();
        this.setNetwork(network);
    }

    setNetwork(network: Network) {
        this.network = network;
        // Dynamically determine base URL without duplicating /api/krc721
        this.baseUrl = typeof window !== 'undefined' 
            ? window.location.origin  // Browser environment
            : '';  // Server environment (will use relative path)
    }

    getNetwork(): Network {
        return this.network;
    }

    async getCollectionDetails(tick: string) {
        try {
            const response = await ofetch(`${this.baseUrl}/api/krc721/nfts/${tick}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                retry: 1,
            });
            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch collection');
        }
    }

    async getToken(tick: string, tokenId: string) {
        try {
            const response = await ofetch(`${this.baseUrl}/api/krc721/nfts/${tick}/${tokenId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                retry: 1,
            });
            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch token');
        }
    }

    async getCollectionTokens(tick: string, startId: number, limit: number = 12) {
        try {
            const ids = Array.from(
                { length: limit },
                (_, i) => (startId + i).toString()
            );

            const promises = ids.map(id => this.getToken(tick, id));
            const responses = await Promise.all(promises);

            return responses.filter(r => r !== null);
        } catch (error) {
            console.error('API Request Error:', error);
            return [];
        }
    }

    async getAddressNFTs(address: string): Promise<AddressNFT[]> {
        try {
            let allNFTs: AddressNFT[] = [];
            let nextOffset: string | undefined;
            
            do {
                const response = await ofetch(`${this.baseUrl}/api/krc721/address/${address}${nextOffset ? `?offset=${nextOffset}` : ''}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    retry: 1,
                });
                
                if (response.result) {
                    // Each NFT in the response will have the owner set to the address
                    const nftsWithOwner = response.result.map((nft: any) => ({
                        ...nft,
                        owner: address // Set the owner to the address we queried
                    }));
                    allNFTs = [...allNFTs, ...nftsWithOwner];
                    nextOffset = response.next;
                }
            } while (nextOffset);

            return allNFTs;
        } catch (error) {
            console.error('Failed to fetch address NFTs:', error);
            throw error;
        }
    }

    async getCollectionHolders(tick: string, params?: { limit?: number; offset?: string }) {
        const queryParams = new URLSearchParams(params as Record<string, string>).toString();
        const url = `${this.baseUrl}/api/krc721/nfts/${tick}/holders${queryParams ? `?${queryParams}` : ''}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Collection Holders Response:', data);
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async getCollectionNFTs(tick: string, startId: number, limit: number = 12) {
        try {
            const promises = Array.from({ length: limit }, (_, i) => {
                const id = (startId + i).toString();
                const url = `${this.baseUrl}/api/krc721/nfts/${tick}/token/${id}`;
                console.log('Fetching NFT:', url);
                
                return ofetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                }).catch(error => {
                    console.error('NFT fetch error:', error);
                    return null;
                });
            });

            const responses = await Promise.all(promises);
            console.log('All NFT Responses:', responses);
            return responses.filter(r => r !== null && r.result);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async getAllMintedTokens(tick: string) {
        try {
            // First get collection details to know total minted
            const collectionDetails = await this.getCollectionDetails(tick);
            if (!collectionDetails?.result?.minted) {
                throw new Error('Could not determine total minted tokens');
            }

            const totalMinted = parseInt(collectionDetails.result.minted);
            const maxTokenId = parseInt(collectionDetails.result.max); // Maximum possible token ID
            const responses = [];
            const batchSize = 50;

            // Create batches of requests
            for (let start = 1; start <= maxTokenId; start += batchSize) {
                const batchPromises = [];
                const end = Math.min(start + batchSize - 1, maxTokenId);

                for (let id = start; id <= end; id++) {
                    batchPromises.push(
                        this.getToken(tick, id.toString())
                    );
                }

                const batchResults = await Promise.all(batchPromises);
                const validResults = batchResults.filter(result => 
                    result && result.message === 'success' && result.result
                );
                
                responses.push(...validResults);

                // If we've found all minted tokens, we can stop
                if (responses.length >= totalMinted) {
                    break;
                }
            }

            return responses;
        } catch (error) {
            console.error('Error fetching all minted tokens:', error);
            throw error;
        }
    }

    // Update the getAllTokenOwners method
    async getAllTokenOwners(tick: string): Promise<Record<string, TokenStatus>> {
        try {
            // First get the total count from initial request
            const initialResponse = await ofetch(
                `${this.baseUrl}/api/krc721/owners/${tick}`,  // Remove v1 and network from path
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    retry: 1,
                }
            );

            let allOwners: Array<{tick: string; tokenId: string; owner: string}> = [];
            
            if (initialResponse.result) {
                allOwners = [...initialResponse.result];
                
                // If there's more data, fetch in parallel
                if (initialResponse.next) {
                    // Calculate total pages based on first response
                    const pageSize = 50; // API's default page size
                    const firstOffset = parseInt(initialResponse.next);
                    const totalPages = Math.ceil((firstOffset * 2) / pageSize);
                    
                    // Create parallel requests for remaining pages
                    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => {
                        const offset = (i + 1) * pageSize;
                        return ofetch(
                            `${this.baseUrl}/api/krc721/owners/${tick}?offset=${offset}`,  // Remove v1 and network from path
                            {
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json',
                                },
                                retry: 1,
                            }
                        );
                    });

                    // Execute requests in parallel with a reasonable batch size
                    const CONCURRENT_BATCH_SIZE = 5;
                    for (let i = 0; i < pagePromises.length; i += CONCURRENT_BATCH_SIZE) {
                        const batch = pagePromises.slice(i, i + CONCURRENT_BATCH_SIZE);
                        const batchResults = await Promise.all(batch);
                        batchResults.forEach(response => {
                            if (response.result) {
                                allOwners = [...allOwners, ...response.result];
                            }
                        });
                    }
                }
            }

            // Convert to TokenStatus format
            return allOwners.reduce((acc, { tokenId, owner }) => {
                acc[tokenId] = {
                    owner,
                    isMinted: true
                };
                return acc;
            }, {} as Record<string, TokenStatus>);
        } catch (error) {
            console.error('Failed to fetch token owners:', error);
            throw error;
        }
    }

    // Update getTokensBatch to use getAllTokenOwners
    async getTokensBatch(tick: string, tokenIds: string[]): Promise<Record<string, TokenStatus>> {
        // First check cache for all requested tokens
        const uncachedTokenIds = tokenIds.filter(id => !this.tokenStatusCache.has(`${tick}-${id}`));
        
        if (uncachedTokenIds.length > 0) {
            // Fetch all token owners in one request
            const allTokenStatuses = await this.getAllTokenOwners(tick);
            
            // Update cache with new results
            Object.entries(allTokenStatuses).forEach(([id, status]) => {
                const cacheKey = `${tick}-${id}`;
                this.tokenStatusCache.set(cacheKey, status);
            });
        }

        // Get all requested tokens from cache
        return tokenIds.reduce((acc, id) => {
            const cacheKey = `${tick}-${id}`;
            const status = this.tokenStatusCache.get(cacheKey);
            acc[id] = status || { owner: undefined, isMinted: false };
            return acc;
        }, {} as Record<string, TokenStatus>);
    }

    // Add this new method
    async getAddressCollections(address: string): Promise<AddressCollection[]> {
        const nfts = await this.getAddressNFTs(address);
        
        // Group NFTs by collection
        const collectionMap = nfts.reduce((acc, nft) => {
            if (!acc[nft.tick]) {
                acc[nft.tick] = {
                    tick: nft.tick,
                    tokens: []
                };
            }
            acc[nft.tick].tokens.push({
                tokenId: nft.tokenId,
                owner: nft.owner // Now TypeScript knows this exists
            });
            return acc;
        }, {} as Record<string, AddressCollection>);

        return Object.values(collectionMap);
    }

    // Add other API methods as needed...
}

// Create and export a singleton instance
export const krc721Api = new KRC721Api();