'use client'

import { useState } from 'react'
import Hero from '@/components/hero'
import Inspiration from '@/components/inspiration'
import Carousel from '@/components/carousel'
import Faqs from '@/components/faqs'
import { CollectionInfo, NFTDisplay, PaginatedNFTs } from '@/types/nft'
import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { fetchCollectionNFTs, fetchAddressNFTs } from '@/app/actions/nft'

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

  const ITEMS_PER_PAGE = 100; // Show more NFTs per page

  const handleSearchTypeChange = (type: 'collection' | 'address') => {
    setSearchType(type);
    setSearchValue(lastSearched[type]);
    setError(null);
  };

  const handleSearch = async (type: 'collection' | 'address', value: string) => {
    setIsLoading(true);
    setError(null);
    // Update hasSearched for this specific type
    setHasSearched(prev => ({
      ...prev,
      [type]: true
    }));
    // Store the searched value
    setLastSearched(prev => ({
      ...prev,
      [type]: value
    }));

    // Only clear data if searching the same type
    if (type === searchType) {
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
    }

    try {
        if (type === 'collection') {
            const response = await fetchCollectionNFTs(value, { limit: ITEMS_PER_PAGE });
            setCollectionData({
                nfts: response.nfts,
                nextOffset: response.nextOffset,
                hasMore: response.hasMore,
                collectionInfo: response.collection
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
    if (loadingMore) return;
    
    const currentData = searchType === 'collection' ? collectionData : addressData;
    if (!currentData.nextOffset) return;
    
    setLoadingMore(true);
    try {
        if (searchType === 'collection') {
            const response = await fetchCollectionNFTs(searchValue, {
                limit: ITEMS_PER_PAGE,
                offset: currentData.nextOffset
            });
            setCollectionData(prev => ({
                ...prev,
                nfts: [...prev.nfts, ...response.nfts],
                nextOffset: response.nextOffset,
                hasMore: response.hasMore
            }));
        } else {
            const response = await fetchAddressNFTs(searchValue, {
                limit: ITEMS_PER_PAGE,
                offset: currentData.nextOffset
            });
            setAddressData(prev => ({
                ...prev,
                nfts: [...prev.nfts, ...response.nfts],
                nextOffset: response.nextOffset,
                hasMore: response.hasMore
            }));
        }
    } catch (error) {
        console.error('Load more error:', error)
        setError(error instanceof Error ? error.message : 'Failed to load more NFTs')
    } finally {
        setLoadingMore(false)
    }
  }

  // Get current data based on search type
  const currentData = searchType === 'collection' ? collectionData : addressData;
  const currentSearchValue = lastSearched[searchType];

  const processedNFTs = currentData.nfts.map(nft => ({
    ...nft,
  }))

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
        nfts={currentData.nfts}
        isLoading={isLoading}
        isLoadingMore={loadingMore}
        error={error}
        searchType={searchType}
        searchValue={currentSearchValue}
        hasMore={currentData.hasMore}
        onLoadMoreAction={handleLoadMore}
        collection={searchType === 'collection' ? collectionData.collectionInfo : undefined}
        hasSearched={hasSearched[searchType]}
      />
      {/* <Carousel /> */}
      {/* <Faqs /> */}
    </>
  )
}
