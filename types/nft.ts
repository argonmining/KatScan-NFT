export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    imageUrl?: string;
    edition: number;
    attributes: Array<{
        trait_type: string;
        value: string;
        rarity?: number;
    }>;
    overallRarity?: number;
    rarityPercentile?: number;
}

export interface NFTDisplay {
    tick: string;
    id: string;
    owner?: string;
    metadata: NFTMetadata;
    isMinted: boolean;
}

export interface CollectionMetadata {
    name: string;
    description: string;
    // Add other collection metadata fields as needed
}

export interface CollectionInfo {
    deployer: string;
    royaltyTo?: string;
    max: string;
    royaltyFee?: string;
    minted: string;
    tick: string;
    daaMintStart?: string;
    premint?: string;
    state?: string;
    metadata?: CollectionMetadata;
}

export interface PaginatedNFTs {
    nfts: NFTDisplay[];
    hasMore: boolean;
    nextOffset?: string;
    collection?: CollectionInfo;
}

export interface TraitFilter {
    trait_type: string;
    values: Set<string>;
}

export interface FilterState {
    [trait_type: string]: Set<string>;
}

export interface TraitRarity {
    [trait_type: string]: {
        [value: string]: {
            count: number;
            percentage: number;
        }
    }
} 