'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/hero'
import Inspiration from '@/components/inspiration'
import Carousel from '@/components/carousel'
import Faqs from '@/components/faqs'
import { CollectionInfo, NFTDisplay, PaginatedNFTs } from '@/types/nft'
import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { fetchCollectionNFTs, fetchAddressNFTs, stopAllBackgroundFetches, stopBackgroundFetch } from '@/app/actions/nft'

export default function Home() {
  const [searchType, setSearchType] = useState<'collection' | 'address'>('collection')
  const [searchValue, setSearchValue] = useState('')
  
  // Store last searched values for each type
  const [lastSearched, setLastSearched] = useState({
    collection: '',
    address: ''
  });

  // Separate states for collection and address searches
  const [collectionData, setCollectionData] = useState({
    nfts: [] as NFTDisplay[],
    nextOffset: undefined as string | undefined,
    hasMore: false,
    collectionInfo: undefined as CollectionInfo | undefined
  });
  
  const [addressData, setAddressData] = useState({
    nfts: [] as NFTDisplay[],
    nextOffset: undefined as string | undefined,
    hasMore: false
  });

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track search state for each type
  const [hasSearched, setHasSearched] = useState({
    collection: false,
    address: false
  });

  const ITEMS_PER_PAGE = 24; // Match with INITIAL_BATCH_SIZE in nft.ts

  const handleSearchTypeChange = (type: 'collection' | 'address') => {
    // Stop background fetches when switching types
    stopAllBackgroundFetches();
    
    setSearchType(type);
    setSearchValue(lastSearched[type]);
    setError(null);
  };

  const handleSearch = async (type: 'collection' | 'address', value: string) => {
    // Stop any ongoing background fetches
    stopAllBackgroundFetches();
    
    setIsLoading(true);
    setError(null);
    setHasSearched(prev => ({
        ...prev,
        [type]: true
    }));
    setLastSearched(prev => ({
        ...prev,
        [type]: value
    }));

    // Clear data completely when starting a new search
    if (type === 'collection') {
        setCollectionData({
            nfts: [],
            nextOffset: undefined,
            hasMore: false,
            collectionInfo: undefined
        });
    } else {
        setAddressData({
            nfts: [],
            nextOffset: undefined,
            hasMore: false
        });
    }

    try {
        if (type === 'collection') {
            // Get both collection details and initial NFTs
            const [response, collectionDetails] = await Promise.all([
                fetchCollectionNFTs(value, { limit: ITEMS_PER_PAGE }), // Make sure to pass limit
                krc721Api.getCollectionDetails(value)
            ]);
            
            setCollectionData({
                nfts: response.nfts,
                nextOffset: response.nextOffset,
                hasMore: response.hasMore,
                collectionInfo: collectionDetails.result
            });
        } else {
            const response = await fetchAddressNFTs(value, { limit: ITEMS_PER_PAGE });
            setAddressData({
                nfts: response.nfts,
                nextOffset: response.nextOffset,
                hasMore: response.hasMore
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !currentData.nextOffset) return;
    setLoadingMore(true);

    try {
        if (searchType === 'collection') {
            const response = await fetchCollectionNFTs(searchValue, {
                limit: ITEMS_PER_PAGE,
                offset: currentData.nextOffset,
                filters: {} // Pass current filters if you have any
            });
            
            // Only update if we got new NFTs
            if (response.nfts.length > 0) {
                setCollectionData(prev => ({
                    ...prev,
                    nfts: [...prev.nfts, ...response.nfts],
                    nextOffset: response.nextOffset,
                    hasMore: response.hasMore
                }));
            } else {
                setCollectionData(prev => ({
                    ...prev,
                    hasMore: false
                }));
            }
        } else {
            // Similar logic for address search
            const response = await fetchAddressNFTs(searchValue, {
                limit: ITEMS_PER_PAGE,
                offset: currentData.nextOffset
            });
            
            if (response.nfts.length > 0) {
                setAddressData(prev => ({
                    ...prev,
                    nfts: [...prev.nfts, ...response.nfts],
                    nextOffset: response.nextOffset,
                    hasMore: response.hasMore
                }));
            } else {
                setAddressData(prev => ({
                    ...prev,
                    hasMore: false
                }));
            }
        }
    } catch (error) {
        console.error('Load more error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load more NFTs');
    } finally {
        setLoadingMore(false);
    }
  };

  // Get current data based on search type
  const currentData = searchType === 'collection' ? collectionData : addressData;
  const currentSearchValue = lastSearched[searchType];

  const processedNFTs = currentData.nfts.map(nft => ({
    ...nft,
  }))

  // Clean up on unmount
  useEffect(() => {
    return () => {
        stopAllBackgroundFetches();
    };
  }, []);

  return (
    <>
      <Hero 
        onSearchAction={handleSearch}
        isLoading={isLoading}
        searchType={searchType}
        searchValue={searchValue}
        onSearchValueChangeAction={setSearchValue}
        onSearchTypeChangeAction={handleSearchTypeChange}
      />
      <Inspiration
        nfts={searchType === 'collection' ? collectionData.nfts : addressData.nfts}
        isLoading={isLoading}
        isLoadingMore={loadingMore}
        error={error}
        searchType={searchType}
        searchValue={searchValue}
        hasMore={searchType === 'collection' ? collectionData.hasMore : addressData.hasMore}
        onLoadMoreAction={handleLoadMore}
        collection={collectionData.collectionInfo}
        hasSearched={hasSearched[searchType]}
      />
      {/* <Carousel /> */}
      {/* <Faqs /> */}
    </>
  )
}
