'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { NFTDisplay, FilterState, CollectionInfo as CollectionInfoType } from '@/types/nft'
import NFTCard from './nft-card'
import Select from 'react-select'
import type { MultiValue } from 'react-select'
import AddressInfo from './address-info'
import CollectionFilter from './collection-filter'
import CollectionInfo from './collection-info'
import { debounce } from 'lodash'

interface InspirationProps {
  nfts: NFTDisplay[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchType: 'collection' | 'address';
  searchValue: string;
  hasMore: boolean;
  onLoadMoreAction: () => void;
  collection?: CollectionInfoType;
  hasSearched: boolean;
}

interface FilterOption {
  label: string;
  value: string;
}

// Add new interface for collection filter option
interface CollectionFilterOption {
  label: string;  // Collection name or tick
  value: string;  // Collection tick
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
  collection,
  hasSearched
}: InspirationProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

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

  // Generate collection filter options for address search
  const collectionFilterOptions = useMemo(() => {
    if (searchType !== 'address') return [];
    
    const collections = new Set(nfts.map(nft => nft.tick));
    return Array.from(collections).map(tick => ({
      label: tick,  // Could use collection name if available
      value: tick
    }));
  }, [nfts, searchType]);

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

  // Modify the filter section JSX
  const filteredNFTs = useMemo(() => {
    if (Object.keys(filters).length === 0) return nfts;

    return nfts.filter(nft => {
      if (searchType === 'address') {
        // Filter by collection for address search
        return filters['collection']?.has(nft.tick) ?? true;
      } else {
        // Filter by traits for collection search
        const attributes = nft.metadata?.attributes;
        if (!attributes) return false;

        return Object.entries(filters).every(([trait_type, allowedValues]) => {
          const attribute = attributes.find(attr => attr.trait_type === trait_type);
          return attribute && allowedValues.has(attribute.value);
        });
      }
    });
  }, [nfts, filters, searchType]);

  // Add effect to sync filters with dropdown values
  useEffect(() => {
    // Get URL params
    const params = new URLSearchParams(window.location.search);
    const filtersParam = params.get('filters');
    
    if (filtersParam) {
      try {
        // Parse the filters from URL
        const parsedFilters = JSON.parse(decodeURIComponent(filtersParam));
        
        // Convert the parsed filters into the correct format
        const newFilters: Record<string, Set<string>> = {};
        Object.entries(parsedFilters).forEach(([trait, values]) => {
          newFilters[trait] = new Set(values as string[]);
        });
        
        // Update the filter state
        setFilters(newFilters);
      } catch (error) {
        console.error('Error parsing filters from URL:', error);
      }
    }
  }, []); // Run once on component mount

  // Debounce the load more action to prevent multiple calls
  const debouncedLoadMore = useCallback(
    debounce(() => {
      if (!isLoadingMore && hasMore) {
        onLoadMoreAction();
      }
    }, 250), // Increased debounce time for better performance
    [isLoadingMore, hasMore, onLoadMoreAction]
  );

  // Update the intersection observer effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setIsIntersecting(true);
        } else {
          setIsIntersecting(false);
        }
      },
      {
        threshold: 0,
        rootMargin: '200px' // Increased rootMargin for earlier loading
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
        observer.disconnect();
      }
    };
  }, [nfts.length]); // Add nfts.length as dependency to reinitialize observer when new items are loaded

  // Update the load more effect
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoadingMore && nfts.length > 0) {
      debouncedLoadMore();
    }
  }, [isIntersecting, hasMore, isLoadingMore, debouncedLoadMore, nfts.length]);

  console.log('Collection data:', collection);

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-8 md:pt-12">
          {/* Only show Address Info after search is executed */}
          {searchType === 'address' && hasSearched && (
            <AddressInfo
              address={searchValue}
              totalNFTs={nfts.length}
              collections={Array.from(new Set(nfts.map(nft => nft.tick)))}
            />
          )}

          {/* Show Collection Info for collection searches */}
          {searchType === 'collection' && collection && (
            <CollectionInfo collection={collection} />
          )}

          {/* Filter Dropdowns */}
          {!isLoading && nfts.length > 0 && (
            <div className="mb-8">
              {searchType === 'address' ? (
                <CollectionFilter
                  collections={Array.from(new Set(nfts.map(nft => nft.tick))).map(tick => ({
                    tick,
                    count: nfts.filter(nft => nft.tick === tick).length
                  }))}
                  selectedCollections={filters['collection'] || new Set()}
                  onChange={(selected) => {
                    const newFilters = { ...filters };
                    if (selected.size > 0) {
                      newFilters['collection'] = selected;
                    } else {
                      delete newFilters['collection'];
                    }
                    setFilters(newFilters);
                  }}
                />
              ) : (
                // Trait filters for collection search
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(filterOptions).map(([trait_type, options]) => (
                    <div key={trait_type}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {trait_type}
                      </label>
                      <Select<FilterOption, true>
                        isMulti
                        options={options}
                        value={options.filter(option => 
                          filters[trait_type]?.has(option.value)
                        )}
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
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <svg 
                        className="w-8 h-8 text-red-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      {searchType === 'collection' ? 'Collection Not Found' : 'Address Not Found'}
                    </h3>
                    <p className="text-red-600">
                      {error}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try another search
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No NFTs message */}
            {!isLoading && !error && nfts.length === 0 && hasSearched && (
              <div className="text-center text-gray-500">
                No NFTs found for this {searchType}
              </div>
            )}

            {/* NFT Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 md:grid-cols-4 lg:grid-cols-4">
              {filteredNFTs.map((nft) => (
                <div 
                  key={`${nft.tick}-${nft.id}`} 
                  className="relative w-full h-fit"
                >
                  <NFTCard nft={nft} />
                </div>
              ))}
            </div>

            {/* Loading indicator at bottom - Updated positioning */}
            {hasMore && (
              <div 
                ref={observerTarget} 
                className="h-20 mt-8" // Increased height for better detection
              />
            )}
            {isLoadingMore && (
              <div className="mt-8 mb-4 flex justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            )}
            {!hasMore && nfts.length > 0 && (
              <div className="mt-8 text-center text-gray-500">
                End of collection
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