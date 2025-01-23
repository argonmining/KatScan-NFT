export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    imageUrl?: string;
    edition: number;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

export interface NFTDisplay {
    tick: string;
    id: string;
    owner?: string;
    metadata: NFTMetadata;
    isMinted: boolean;
}

export interface CollectionInfo {
    deployer: string;
    royaltyTo?: string;
    max: string;
    royaltyFee?: string;
    minted: string;
    tick: string;
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