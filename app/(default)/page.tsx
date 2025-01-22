'use client'

import { useState } from 'react'
import Hero from '@/components/hero'
import Inspiration from '@/components/inspiration'
import Carousel from '@/components/carousel'
import Faqs from '@/components/faqs'
import { NFTDisplay, PaginatedNFTs } from '@/types/nft'
import { krc721Api } from '@/app/api/krc721/krc721'
import { getIPFSContent } from '@/utils/ipfs'
import { fetchCollectionNFTs } from '@/app/actions/nft'

export default function Home() {
  const [searchType, setSearchType] = useState<'collection' | 'address'>('collection')
  const [searchValue, setSearchValue] = useState('')
  const [nfts, setNfts] = useState<NFTDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextOffset, setNextOffset] = useState<string>()
  const [hasMore, setHasMore] = useState(false)

  const ITEMS_PER_PAGE = 12

  const handleSearch = async (type: 'collection' | 'address', value: string) => {
    setIsLoading(true)
    setError(null)
    setNfts([])
    setNextOffset(undefined)
    setHasMore(false)
    setSearchType(type)
    setSearchValue(value)

    try {
        if (type === 'collection') {
            const response = await fetchCollectionNFTs(value, { limit: ITEMS_PER_PAGE })
            setNfts(response.nfts)
            setHasMore(response.hasMore)
            setNextOffset(response.nextOffset)
        } else {
            // Handle address search
        }
    } catch (error) {
        console.error('Search error:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch NFTs')
    } finally {
        setIsLoading(false)
    }
  }

  const loadMore = async () => {
    if (!nextOffset || loadingMore) return
    
    setLoadingMore(true)
    try {
        const response = await fetchCollectionNFTs(searchValue, {
            limit: ITEMS_PER_PAGE,
            offset: nextOffset
        })
        
        setNfts(prev => [...prev, ...response.nfts])
        setHasMore(response.hasMore)
        setNextOffset(response.nextOffset)
    } catch (error) {
        console.error('Load more error:', error)
        setError(error instanceof Error ? error.message : 'Failed to load more NFTs')
    } finally {
        setLoadingMore(false)
    }
  }

  const processedNFTs = nfts.map(nft => ({
    ...nft,
  }))

  return (
    <>
      <Hero 
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      <Inspiration 
        nfts={processedNFTs}
        isLoading={isLoading}
        isLoadingMore={loadingMore}
        error={error}
        searchType={searchType}
        searchValue={searchValue}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
      <Carousel />
    </>
  )
}
