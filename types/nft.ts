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
    owner: string;
    buri: string;
    metadata: NFTMetadata;
}

export interface PaginatedNFTs {
    nfts: NFTDisplay[];
    hasMore: boolean;
    nextOffset?: string;
}

export interface TraitFilter {
    trait_type: string;
    values: Set<string>;
}

export interface FilterState {
    [trait_type: string]: Set<string>;
} 