import { NFTMetadata, TraitRarity } from '@/types/nft'

export function calculateTraitRarities(metadataMap: Record<string, NFTMetadata>): TraitRarity {
    try {
        const totalNFTs = Object.keys(metadataMap).length;
        if (totalNFTs === 0) return {};

        const traitCounts: TraitRarity = {};

        // Count occurrences of each trait value
        Object.values(metadataMap).forEach((metadata) => {
            if (!metadata?.attributes) return;
            
            metadata.attributes.forEach((attr) => {
                if (!attr?.trait_type || !attr?.value) return;
                
                if (!traitCounts[attr.trait_type]) {
                    traitCounts[attr.trait_type] = {};
                }
                if (!traitCounts[attr.trait_type][attr.value]) {
                    traitCounts[attr.trait_type][attr.value] = { count: 0, percentage: 0 };
                }
                traitCounts[attr.trait_type][attr.value].count++;
            });
        });

        // Calculate percentages - lower percentage means rarer
        Object.values(traitCounts).forEach((traitValues) => {
            Object.values(traitValues).forEach((stats) => {
                stats.percentage = Number(((stats.count / totalNFTs) * 100).toFixed(1));
            });
        });

        return traitCounts;
    } catch (error) {
        console.error('Error calculating trait rarities:', error);
        return {};
    }
}

export function calculateOverallRarity(
    metadata: NFTMetadata, 
    rarities: TraitRarity,
    allMetadata: Record<string, NFTMetadata>
): { score: number; percentile: number } | undefined {
    try {
        if (!metadata?.attributes?.length || !rarities) return undefined;

        // Calculate rarity score for this NFT
        const validAttributes = metadata.attributes.filter(
            attr => attr?.trait_type && attr?.value && rarities[attr.trait_type]?.[attr.value]
        );

        if (validAttributes.length === 0) return undefined;

        // Calculate statistical rarity
        let totalScore = 0;
        validAttributes.forEach(attr => {
            const traitRarity = rarities[attr.trait_type]?.[attr.value]?.percentage;
            if (typeof traitRarity !== 'number') return;
            totalScore += traitRarity;
        });

        const score = Number((totalScore / validAttributes.length).toFixed(2));

        // Calculate all scores and find percentile
        const allScores = Object.values(allMetadata)
            .map(nft => {
                const attrs = nft.attributes?.filter(
                    attr => attr?.trait_type && attr?.value && rarities[attr.trait_type]?.[attr.value]
                ) || [];
                
                if (attrs.length === 0) return Infinity;

                const total = attrs.reduce((sum, attr) => {
                    const rarity = rarities[attr.trait_type]?.[attr.value]?.percentage;
                    return sum + (typeof rarity === 'number' ? rarity : 0);
                }, 0);

                return Number((total / attrs.length).toFixed(2));
            })
            .filter(s => s !== Infinity)
            .sort((a, b) => a - b);

        const index = allScores.findIndex(s => s >= score);
        const percentile = Number(((index / allScores.length) * 100).toFixed(2));

        return { score, percentile };
    } catch (error) {
        console.error('Error calculating overall rarity:', error);
        return undefined;
    }
}

export function enrichMetadataWithRarity(
    metadata: NFTMetadata, 
    rarities: TraitRarity,
    allMetadata: Record<string, NFTMetadata>
): NFTMetadata {
    try {
        if (!metadata?.attributes) return metadata;

        const enrichedAttributes = metadata.attributes.map(attr => {
            if (!attr?.trait_type || !attr?.value) return attr;
            return {
                ...attr,
                rarity: rarities[attr.trait_type]?.[attr.value]?.percentage
            };
        });

        const rarityInfo = calculateOverallRarity(metadata, rarities, allMetadata);

        return {
            ...metadata,
            attributes: enrichedAttributes,
            overallRarity: rarityInfo?.score,
            rarityPercentile: rarityInfo?.percentile
        };
    } catch (error) {
        console.error('Error enriching metadata with rarity:', error);
        return metadata;
    }
} 