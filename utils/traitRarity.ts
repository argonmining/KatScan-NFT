import { NFTMetadata, TraitRarity } from '@/types/nft'

export function calculateTraitRarities(metadataMap: Record<string, NFTMetadata>): TraitRarity {
    const totalNFTs = Object.keys(metadataMap).length;
    const traitCounts: TraitRarity = {};

    // Count occurrences of each trait value
    Object.values(metadataMap).forEach((metadata) => {
        metadata.attributes?.forEach((attr) => {
            if (!traitCounts[attr.trait_type]) {
                traitCounts[attr.trait_type] = {};
            }
            if (!traitCounts[attr.trait_type][attr.value]) {
                traitCounts[attr.trait_type][attr.value] = { count: 0, percentage: 0 };
            }
            traitCounts[attr.trait_type][attr.value].count++;
        });
    });

    // Calculate percentages
    Object.values(traitCounts).forEach((traitValues) => {
        Object.values(traitValues).forEach((stats) => {
            stats.percentage = Number(((stats.count / totalNFTs) * 100).toFixed(1));
        });
    });

    return traitCounts;
}

export function enrichMetadataWithRarity(
    metadata: NFTMetadata, 
    rarities: TraitRarity
): NFTMetadata {
    return {
        ...metadata,
        attributes: metadata.attributes?.map(attr => ({
            ...attr,
            rarity: rarities[attr.trait_type]?.[attr.value]?.percentage
        }))
    };
} 