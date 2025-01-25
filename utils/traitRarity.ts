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
    rarities: TraitRarity
): number | undefined {
    try {
        if (!metadata?.attributes?.length || !rarities) return undefined;

        // Filter out invalid attributes
        const validAttributes = metadata.attributes.filter(
            attr => attr?.trait_type && attr?.value && rarities[attr.trait_type]?.[attr.value]
        );

        if (validAttributes.length === 0) return undefined;

        // Calculate rarity score using average method
        // But weigh rarer traits more heavily
        let weightedScore = 0;
        let totalWeight = 0;

        validAttributes.forEach(attr => {
            const traitRarity = rarities[attr.trait_type]?.[attr.value]?.percentage;
            if (typeof traitRarity !== 'number') return;

            // Weight is inverse to rarity - rarer traits have more weight
            const weight = 100 / traitRarity;
            weightedScore += traitRarity * weight;
            totalWeight += weight;
        });

        // Calculate final weighted average
        const finalScore = weightedScore / totalWeight;
        
        // Return rounded to 2 decimal places
        return Number(finalScore.toFixed(2));
    } catch (error) {
        console.error('Error calculating overall rarity:', error);
        return undefined;
    }
}

export function enrichMetadataWithRarity(
    metadata: NFTMetadata, 
    rarities: TraitRarity
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

        const overallRarity = calculateOverallRarity(metadata, rarities);

        return {
            ...metadata,
            attributes: enrichedAttributes,
            overallRarity
        };
    } catch (error) {
        console.error('Error enriching metadata with rarity:', error);
        return metadata;
    }
} 