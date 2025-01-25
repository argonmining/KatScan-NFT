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
): number | undefined {
    try {
        if (!metadata?.attributes?.length || !rarities) return undefined;

        // Calculate collection-wide average rarities for each trait type
        const traitAverages: Record<string, number> = {};
        let totalNFTs = Object.keys(allMetadata).length;

        // Calculate average rarity for each trait type across collection
        Object.entries(rarities).forEach(([traitType, values]) => {
            const traitSum = Object.values(values).reduce((sum, { percentage }) => sum + percentage, 0);
            traitAverages[traitType] = traitSum / Object.keys(values).length;
        });

        // Calculate how this NFT's traits compare to collection averages
        const validAttributes = metadata.attributes.filter(
            attr => attr?.trait_type && attr?.value && rarities[attr.trait_type]?.[attr.value]
        );

        if (validAttributes.length === 0) return undefined;

        let rarityScore = 0;
        validAttributes.forEach(attr => {
            if (!attr.trait_type || !attr.value) return;
            
            const traitRarity = rarities[attr.trait_type]?.[attr.value]?.percentage;
            const avgRarity = traitAverages[attr.trait_type];
            
            if (typeof traitRarity !== 'number' || typeof avgRarity !== 'number') return;

            // Calculate how much rarer this trait is compared to average
            // Lower percentage means rarer, so we keep this comparison
            const rarityMultiplier = traitRarity / avgRarity;
            rarityScore += rarityMultiplier;
        });

        // Average the score across all traits
        const finalScore = rarityScore / validAttributes.length;
        
        // Convert to a 0-100 scale where lower numbers mean rarer
        // We use log scale to prevent extreme values
        const normalizedScore = Math.min(100, 
            (100 / Math.log10(11)) * Math.log10(finalScore + 1)
        );

        // Return the normalized score (lower = rarer)
        return Number(normalizedScore.toFixed(2));
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
            overallRarity: rarityInfo,
            rarityPercentile: 0 // Assuming percentile is not available in the new calculateOverallRarity function
        };
    } catch (error) {
        console.error('Error enriching metadata with rarity:', error);
        return metadata;
    }
} 