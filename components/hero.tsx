'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import NetworkSelector from './network-selector'

import HeroImage from '@/public/images/hero-image.png'

interface HeroProps {
  onSearch: (type: 'collection' | 'address', value: string) => void;
  isLoading: boolean;
}

export default function Hero({ onSearch, isLoading }: HeroProps) {
  const [searchType, setSearchType] = useState<'collection' | 'address'>('collection')
  const [searchValue, setSearchValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      onSearch(searchType, searchValue.trim())
    }
  }

  return (
    <section className="relative">
      {/* Bg */}
      <div className="absolute inset-0 rounded-bl-[100px] bg-gray-50 pointer-events-none -z-10" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">
          {/* Hero content */}
          <div className="text-center pb-12 md:pb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4">
              Explore <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">KRC-721</span> NFTs
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 mb-8">
                Search for KRC-721 NFTs by collection or address
              </p>
              
              {/* Search form */}
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="flex flex-col space-y-4">
                  {/* Search type and network selector row */}
                  <div className="flex items-center justify-center space-x-4">
                    {/* Search type buttons */}
                    <div className="flex rounded-md shadow-sm" role="group">
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                          searchType === 'collection'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setSearchType('collection')}
                      >
                        Collection
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                          searchType === 'address'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setSearchType('address')}
                      >
                        Address
                      </button>
                    </div>
                    
                    {/* Network selector */}
                    <NetworkSelector />
                  </div>

                  {/* Search input */}
                  <div className="flex">
                    <input
                      type="text"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={searchType === 'collection' ? "Enter collection ticker..." : "Enter Kaspa address..."}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isLoading || !searchValue.trim()}
                    >
                      {isLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}