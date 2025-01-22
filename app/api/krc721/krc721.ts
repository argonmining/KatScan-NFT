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

export class KRC721Api {
    private baseUrl!: string;
    private network!: Network;

    constructor(network: Network = DEFAULT_NETWORK) {
        this.setNetwork(network);
    }

    setNetwork(network: Network) {
        this.network = network;
        this.baseUrl = '/api/krc721';
    }

    getNetwork(): Network {
        return this.network;
    }

    async getCollectionDetails(tick: string) {
        try {
            const response = await ofetch(`${this.baseUrl}/nfts/${tick}`, {
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
            const response = await ofetch(`${this.baseUrl}/nfts/${tick}/${tokenId}`, {
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

    async getAddressNFTs(address: string, params?: { limit?: number; offset?: string }) {
        const queryParams = new URLSearchParams(params as Record<string, string>).toString();
        const url = `${this.baseUrl}/address/${address}${queryParams ? `?${queryParams}` : ''}`;
        
        try {
            const data = await ofetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('Address NFTs Response:', data);
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async getCollectionHolders(tick: string, params?: { limit?: number; offset?: string }) {
        const queryParams = new URLSearchParams(params as Record<string, string>).toString();
        const url = `${this.baseUrl}/nfts/${tick}/holders${queryParams ? `?${queryParams}` : ''}`;
        
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
                const url = `${this.baseUrl}/nfts/${tick}/token/${id}`;
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

    // Add other API methods as needed...
}

// Create and export a singleton instance
export const krc721Api = new KRC721Api();