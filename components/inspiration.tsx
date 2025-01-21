'use client'

import { useState, useMemo, useCallback } from 'react'

import Link from 'next/link'
import Image from 'next/image'
import Author01 from '@/public/images/author-01.jpg'
import Inspiration01 from '@/public/images/inspiration-01.jpg'
import Inspiration02 from '@/public/images/inspiration-02.jpg'
import Inspiration03 from '@/public/images/inspiration-03.jpg'
import Inspiration04 from '@/public/images/inspiration-04.jpg'
import Inspiration05 from '@/public/images/inspiration-05.jpg'
import Inspiration06 from '@/public/images/inspiration-06.jpg'
import Inspiration07 from '@/public/images/inspiration-07.jpg'
import Inspiration08 from '@/public/images/inspiration-08.jpg'
import Inspiration09 from '@/public/images/inspiration-09.jpg'
import { NFTDisplay, FilterState } from '@/types/nft'
import NFTCard from './nft-card'
import NFTFilters from './nft-filters'

interface InspirationProps {
  nfts: NFTDisplay[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchType: 'collection' | 'address';
  searchValue: string;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function Inspiration({ 
  nfts, 
  isLoading, 
  isLoadingMore,
  error, 
  searchType, 
  searchValue,
  hasMore,
  onLoadMore 
}: InspirationProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const handleFilterChange = useCallback((trait_type: string, value: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      // If this trait type doesn't exist yet, create it
      if (!newFilters[trait_type]) {
        newFilters[trait_type] = new Set([value]);
      } else {
        // Create a new Set from the existing one
        const newSet = new Set(newFilters[trait_type]);
        
        // Toggle the value
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }

        // If the set is empty, remove the trait type
        if (newSet.size === 0) {
          delete newFilters[trait_type];
        } else {
          newFilters[trait_type] = newSet;
        }
      }

      return Object.keys(newFilters).length > 0 ? newFilters : {};
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filteredNFTs = useMemo(() => {
    if (Object.keys(filters).length === 0) return nfts;

    return nfts.filter(nft => {
      const attributes = nft.metadata?.attributes;
      if (!attributes) return false;

      // Check if NFT matches all selected trait types
      return Object.entries(filters).every(([trait_type, allowedValues]) => {
        const attribute = attributes.find(
          attr => attr.trait_type === trait_type
        );
        // Match if the NFT's attribute value is in the set of allowed values
        return attribute && allowedValues.has(attribute.value);
      });
    });
  }, [nfts, filters]);

  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:pt-32 md:pb-20">
          {/* Section header */}
          <div className="pb-12 md:pb-14">
            <div className="relative text-center md:text-left">
              <h2 className="h2 font-cabinet-grotesk">
                {searchValue 
                  ? `${searchType === 'collection' ? 'Collection' : 'Address'}: ${searchValue}`
                  : 'Search for NFTs'}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters */}
            {!isLoading && nfts.length > 0 && (
              <div className="md:w-64 flex-shrink-0">
                <NFTFilters 
                  nfts={nfts}
                  selectedFilters={filters}
                  onFilterToggle={handleFilterChange}
                  onReset={handleResetFilters}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-grow">
              {isLoading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4">Loading NFTs...</p>
                </div>
              )}

              {error && (
                <div className="text-center text-red-500">
                  {error}
                </div>
              )}

              {!isLoading && !error && nfts.length === 0 && searchValue && (
                <div className="text-center text-gray-500">
                  No NFTs found for this {searchType}
                </div>
              )}

              {/* NFT Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredNFTs.map((nft) => (
                  <NFTCard 
                    key={`${nft.tick}-${nft.id || Math.random()}`} 
                    nft={nft} 
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && filteredNFTs.length === nfts.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="btn text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}

              {/* No Results */}
              {filteredNFTs.length === 0 && nfts.length > 0 && (
                <div className="text-center text-gray-500">
                  No NFTs match the selected filters
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}