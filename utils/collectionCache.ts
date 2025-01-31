import { openDB, IDBPDatabase } from 'idb';
import { NFTMetadata } from '@/types/nft';
import { calculateTraitRarities, enrichMetadataWithRarity } from '@/utils/traitRarity';

// Export the interface so it can be imported elsewhere
export interface CachedCollection {
    timestamp: number;
    metadata: Record<string, NFTMetadata>;  // tokenId -> metadata
    traits: Record<string, Set<string>>;    // trait_type -> possible values
    lastFetchedToken: number;
}

const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export class CollectionCache {
    private static DB_NAME = 'nft_cache';
    private static STORE_NAME = 'collections';
    private static db: Promise<IDBPDatabase>;

    private static async getDB() {
        if (!this.db) {
            this.db = openDB(this.DB_NAME, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(CollectionCache.STORE_NAME)) {
                        db.createObjectStore(CollectionCache.STORE_NAME);
                    }
                },
            });
        }
        return this.db;
    }

    static async getCollection(tick: string): Promise<CachedCollection | null> {
        try {
            const db = await this.getDB();
            const data = await db.get(this.STORE_NAME, tick);
            
            if (!data || Date.now() - data.timestamp > CACHE_DURATION) {
                return null;
            }

            // Calculate rarities for the collection
            const rarities = calculateTraitRarities(data.metadata);
            
            // Enrich metadata with rarity information
            const enrichedMetadata = Object.entries(data.metadata).reduce((acc, [tokenId, meta]) => ({
                ...acc,
                [tokenId]: enrichMetadataWithRarity(meta as NFTMetadata, rarities, data.metadata)
            }), {} as Record<string, NFTMetadata>);

            // Convert stored arrays back to Sets
            const traits: Record<string, Set<string>> = {};
            Object.entries(data.traits).forEach(([trait, values]) => {
                traits[trait] = new Set(values as string[]);
            });

            return {
                ...data,
                metadata: enrichedMetadata,
                traits
            };
        } catch (error) {
            console.error('Error reading from cache:', error);
            return null;
        }
    }

    static async setCollection(tick: string, collection: CachedCollection): Promise<void> {
        try {
            const db = await this.getDB();
            
            // Convert Sets to arrays for storage
            const storedTraits: Record<string, string[]> = {};
            Object.entries(collection.traits).forEach(([trait, values]) => {
                storedTraits[trait] = Array.from(values);
            });

            await db.put(this.STORE_NAME, {
                ...collection,
                traits: storedTraits
            }, tick);
        } catch (error) {
            console.error('Error writing to cache:', error);
        }
    }

    static async clearCache(tick?: string): Promise<void> {  // Make async and return Promise
        try {
            const db = await this.getDB();
            if (tick) {
                await db.delete(this.STORE_NAME, tick);
            } else {
                await db.clear(this.STORE_NAME);
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
} 