'use client'

import { useState, useMemo, useCallback } from 'react'
import { NFTDisplay, FilterState, CollectionInfo } from '@/types/nft'
import NFTCard from './nft-card'
import Select from 'react-select'
import type { MultiValue } from 'react-select'

interface InspirationProps {
  nfts: NFTDisplay[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchType: 'collection' | 'address';
  searchValue: string;
  hasMore: boolean;
  onLoadMoreAction: () => Promise<void>;
  collection?: CollectionInfo;
}

interface FilterOption {
  label: string;
  value: string;
}

// Helper function to convert Sompi to KAS with optional decimal places
const sompiToKAS = (sompi: string, decimals: number = 8): string => {
  const value = BigInt(sompi);
  const whole = value / BigInt(100000000);
  const fraction = value % BigInt(100000000);
  const fractionStr = fraction.toString().padStart(8, '0');
  return decimals === 0 
    ? `${whole} KAS`
    : `${whole}.${fractionStr.slice(0, decimals)} KAS`;
};

export default function Inspiration({ 
  nfts, 
  isLoading, 
  isLoadingMore,
  error, 
  searchType, 
  searchValue,
  hasMore,
  onLoadMoreAction,
  collection
}: InspirationProps) {
  const [filters, setFilters] = useState<FilterState>({});

  // Generate filter options from NFTs
  const filterOptions = useMemo(() => {
    const options: Record<string, FilterOption[]> = {};
    
    nfts.forEach(nft => {
      nft.metadata?.attributes?.forEach(attr => {
        if (!options[attr.trait_type]) {
          options[attr.trait_type] = [];
        }
        if (!options[attr.trait_type].find(opt => opt.value === attr.value)) {
          options[attr.trait_type].push({
            label: attr.value,
            value: attr.value
          });
        }
      });
    });

    return options;
  }, [nfts]);

  const handleFilterChange = useCallback((trait_type: string, selectedOptions: MultiValue<FilterOption>) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (selectedOptions.length === 0) {
        delete newFilters[trait_type];
      } else {
        newFilters[trait_type] = new Set(selectedOptions.map(opt => opt.value));
      }

      return Object.keys(newFilters).length > 0 ? newFilters : {};
    });
  }, []);

  const filteredNFTs = useMemo(() => {
    if (Object.keys(filters).length === 0) return nfts;

    return nfts.filter(nft => {
      const attributes = nft.metadata?.attributes;
      if (!attributes) return false;

      return Object.entries(filters).every(([trait_type, allowedValues]) => {
        const attribute = attributes.find(attr => attr.trait_type === trait_type);
        return attribute && allowedValues.has(attribute.value);
      });
    });
  }, [nfts, filters]);

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:pt-32 md:pb-20">
          <div className="pb-12 md:pb-14">
            <div className="relative text-center md:text-left">
              <h2 className="h2 font-cabinet-grotesk mb-6">
                {searchValue 
                  ? `${searchType === 'collection' ? 'Collection' : 'Address'}: ${searchValue}`
                  : 'Search for NFTs'}
              </h2>
              
              {/* Debug collection info */}
              {collection && searchType === 'collection' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Supply</div>
                      <div className="text-lg font-semibold mt-1">
                        {collection.minted} / {collection.max}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Mint Cost</div>
                      <div className="text-lg font-semibold mt-1 group relative cursor-help">
                        {collection.royaltyFee 
                          ? sompiToKAS(collection.royaltyFee, 0)
                          : 'Free'}
                        
                        {/* Tooltip with full value */}
                        {collection.royaltyFee && (
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
                            <div className="bg-gray-900 text-white text-sm rounded py-1 px-2 whitespace-nowrap">
                              {sompiToKAS(collection.royaltyFee)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Pre-mint</div>
                      <div className="text-lg font-semibold mt-1">
                        {collection.premint || '0'}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-sm font-medium text-gray-500">State</div>
                      <div className="text-lg font-semibold mt-1">
                        {collection.state || 'Unknown'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-gray-500">Deployer</div>
                      <div className="text-sm font-mono truncate mt-1 hover:text-clip">
                        {collection.deployer}
                      </div>
                    </div>
                    {collection.royaltyTo && (
                      <div className="col-span-2 md:col-span-3">
                        <div className="text-sm font-medium text-gray-500">Royalty Recipient</div>
                        <div className="text-sm font-mono truncate mt-1 hover:text-clip">
                          {collection.royaltyTo}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          {!isLoading && nfts.length > 0 && (
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(filterOptions).map(([trait_type, options]) => (
                <div key={trait_type}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {trait_type}
                  </label>
                  <Select<FilterOption, true>
                    isMulti
                    options={options}
                    onChange={(selected: MultiValue<FilterOption>) => 
                      handleFilterChange(trait_type, selected)
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder={`Select ${trait_type}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="w-full">
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
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredNFTs.map((nft) => (
                <div key={nft.id} className="relative w-full" style={{ paddingBottom: '120%' }}>
                  <div className="absolute inset-0">
                    <NFTCard nft={nft} />
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && nfts.length === filteredNFTs.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={onLoadMoreAction}
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
  )
}