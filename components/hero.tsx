'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import NetworkSelector from './network-selector'
import { ArrowRight } from 'lucide-react'
import DeploymentsTicker from './deployments-ticker'

import HeroImage from '@/public/images/hero-image.png'

interface HeroProps {
  onSearchAction: (type: 'collection' | 'address', value: string) => void;
  isLoading: boolean;
  searchType: 'collection' | 'address';
  searchValue: string;
  onSearchValueChangeAction: (value: string) => void;
  onSearchTypeChangeAction: (type: 'collection' | 'address') => void;
}

export default function Hero({ 
  onSearchAction, 
  isLoading, 
  searchType,
  searchValue,
  onSearchValueChangeAction,
  onSearchTypeChangeAction
}: HeroProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearchAction(searchType, searchValue.trim());
    }
  };

  const handleTickerClick = (tick: string) => {
    onSearchTypeChangeAction('collection');
    onSearchValueChangeAction(tick);
    onSearchAction('collection', tick);
  };

  return (
    <section className="relative">
      {/* Bg */}
      <div className="absolute inset-0 bg-gray-50 pointer-events-none -z-10" aria-hidden="true" />
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
              <div className="flex flex-col items-center">
                {/* Search Type Toggle */}
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => onSearchTypeChangeAction('collection')}
                    className={`px-4 py-2 rounded ${
                      searchType === 'collection' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200'
                    }`}
                  >
                    Collection
                  </button>
                  <button
                    onClick={() => onSearchTypeChangeAction('address')}
                    className={`px-4 py-2 rounded ${
                      searchType === 'address' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200'
                    }`}
                  >
                    Address
                  </button>
                </div>

                {/* Search Input */}
                <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
                  <div className="relative group">
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => onSearchValueChangeAction(e.target.value)}
                      placeholder={
                        searchType === 'collection'
                          ? 'Enter a collection ticker to search...'
                          : 'Enter a Kaspa address to search...'
                      }
                      className="w-full px-6 py-4 text-sm font-mono bg-white border-2 border-gray-200 
                               rounded-xl shadow-sm transition-all duration-200 
                               focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                               disabled:bg-gray-50 disabled:cursor-not-allowed
                               placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !searchValue.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                               text-gray-400 hover:text-blue-500 disabled:text-gray-300
                               transition-colors duration-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add ticker at the bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <DeploymentsTicker onTickerClick={handleTickerClick} />
      </div>
    </section>
  )
}