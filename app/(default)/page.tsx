'use client'

import { useState } from 'react'
import Hero from '@/components/hero'
import Inspiration from '@/components/inspiration'
import Carousel from '@/components/carousel'
import Faqs from '@/components/faqs'
import { NFTDisplay, PaginatedNFTs } from '@/types/nft'
import { krc721Api } from '@/api/krc721'
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

  const fetchNFTMetadata = async (tick: string, id: string, buri?: string) => {
    if (!buri) return null;
    
    try {
      const metadata = await getIPFSContent(buri.replace('{id}', id));
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

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
            console.log('Searching collection:', value); // Debug log
            const { nfts, hasMore, nextOffset } = await fetchCollectionNFTs(value, { limit: ITEMS_PER_PAGE });
            console.log('Search results:', { nfts, hasMore, nextOffset }); // Debug log
            setNfts(nfts);
            setHasMore(hasMore);
            setNextOffset(nextOffset);
        } else {
            // Handle address search similarly...
        }
    } catch (error) {
        console.error('Search error:', error); // Debug log
        setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
        setIsLoading(false);
    }
  }

  const fetchNFTsPage = async (type: 'collection' | 'address', value: string, offset?: string): Promise<PaginatedNFTs> => {
    if (type === 'collection') {
        const collectionResponse = await krc721Api.getCollectionDetails(value);
        
        if (collectionResponse.message !== 'success' || !collectionResponse.result) {
            throw new Error('Collection not found');
        }

        const collection = collectionResponse.result;
        const totalMinted = parseInt(collection.minted);
        const limit = ITEMS_PER_PAGE;
        const startId = offset ? parseInt(offset) : 0;

        // Get NFTs for this page
        const nftResponses = await krc721Api.getCollectionNFTs(value, startId + 1, limit);
        const nftList: NFTDisplay[] = [];

        // Get metadata for each token
        for (const response of nftResponses) {
            if (!response?.result) continue;
            
            const metadata = await getIPFSContent(collection.buri?.replace('{id}', response.result.id));
            
            nftList.push({
                tick: value,
                id: response.result.id,
                owner: response.result.owner,
                buri: collection.buri,
                metadata: metadata
            });
        }

        return {
            nfts: nftList,
            hasMore: startId + limit < totalMinted,
            nextOffset: startId + limit < totalMinted ? (startId + limit).toString() : undefined
        };
    } else {
        const holdingsResponse = await krc721Api.getAddressNFTs(value, {
            limit: ITEMS_PER_PAGE,
            offset
        });

        if (holdingsResponse.message !== 'success' || !holdingsResponse.result) {
            throw new Error('No NFTs found for this address');
        }

        const holdings = holdingsResponse.result;
        const nftList: NFTDisplay[] = [];

        for (const token of holdings) {
            const metadata = await getIPFSContent(token.buri?.replace('{id}', token.id));
            
            nftList.push({
                ...token,
                metadata: metadata
            });
        }

        return {
            nfts: nftList,
            hasMore: !!holdingsResponse.next,
            nextOffset: holdingsResponse.next
        };
    }
  }

  const loadMore = async () => {
    if (!searchValue || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const result = await fetchNFTsPage(searchType, searchValue, nextOffset);
      setNfts(prev => [...prev, ...result.nfts]);
      setNextOffset(result.nextOffset);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading more items');
    } finally {
      setLoadingMore(false);
    }
  }

  const processedNFTs = nfts.map(nft => ({
    ...nft,
  }));

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
