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

export interface CollectionExtensions {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    medium?: string;
    linkedin?: string;
    twitch?: string;
    reddit?: string;
    github?: string;
}

export interface CollectionProperties {
    files: {
        uri: string;
        type: string;
    }[];
}

export interface CollectionMetadata {
    name: string;
    tick: string;
    description: string;
    image: string;
    properties: CollectionProperties;
    extensions: CollectionExtensions;
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
    collectionMetadata?: CollectionMetadata;
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