import { NFTMetadata } from '@/types/nft';
import { calculateTraitRarities, enrichMetadataWithRarity } from '@/utils/traitRarity';

interface CachedCollection {
    timestamp: number;
    metadata: Record<string, NFTMetadata>;  // tokenId -> metadata
    traits: Record<string, Set<string>>;    // trait_type -> possible values
}

const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export class CollectionCache {
    private static CACHE_PREFIX = 'collection_metadata_';

    static async getCollection(tick: string): Promise<CachedCollection | null> {
        try {
            const cached = localStorage.getItem(this.CACHE_PREFIX + tick);
            if (!cached) return null;

            const data = JSON.parse(cached);
            
            // Check if cache is still valid
            if (Date.now() - data.timestamp > CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_PREFIX + tick);
                return null;
            }

            // Calculate rarities for the collection
            const rarities = calculateTraitRarities(data.metadata);
            
            // Enrich metadata with rarity information
            const enrichedMetadata = Object.entries(data.metadata).reduce((acc, [tokenId, meta]) => ({
                ...acc,
                [tokenId]: enrichMetadataWithRarity(meta as NFTMetadata, rarities, data.metadata)
            }), {} as Record<string, NFTMetadata>);

            // Convert trait values back to Sets
            const traits: Record<string, Set<string>> = {};
            Object.entries(data.traits).forEach(([trait, values]) => {
                traits[trait] = new Set(values as string[]);
            });

            return {
                timestamp: data.timestamp,
                metadata: enrichedMetadata,
                traits
            };
        } catch (error) {
            console.error('Error reading from cache:', error);
            return null;
        }
    }

    static async setCollection(
        tick: string, 
        metadata: Record<string, NFTMetadata>
    ): Promise<void> {
        try {
            // Build traits index
            const traits: Record<string, Set<string>> = {};
            Object.values(metadata).forEach(nft => {
                nft.attributes?.forEach((attr: { trait_type: string; value: string }) => {
                    if (!traits[attr.trait_type]) {
                        traits[attr.trait_type] = new Set();
                    }
                    traits[attr.trait_type].add(attr.value);
                });
            });

            // Convert Sets to arrays for storage
            const storedTraits: Record<string, string[]> = {};
            Object.entries(traits).forEach(([trait, values]) => {
                storedTraits[trait] = Array.from(values);
            });

            const cacheData = {
                timestamp: Date.now(),
                metadata,
                traits: storedTraits
            };

            localStorage.setItem(
                this.CACHE_PREFIX + tick,
                JSON.stringify(cacheData)
            );
        } catch (error) {
            console.error('Error writing to cache:', error);
        }
    }

    static clearCache(tick?: string): void {
        if (tick) {
            localStorage.removeItem(this.CACHE_PREFIX + tick);
        } else {
            // Clear all collection caches
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.CACHE_PREFIX))
                .forEach(key => localStorage.removeItem(key));
        }
    }
} 