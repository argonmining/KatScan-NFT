'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import NachoKatsHeader from '@/components/nachokats/header'
import CollectionOverview from '@/components/nachokats/collection-overview'
import TraitAnalysis from '@/components/nachokats/trait-analysis'
import RarityDistribution from '@/components/nachokats/rarity-distribution'
import StatisticalInsights from '@/components/nachokats/statistical-insights'
import RealmExplorer from '@/components/nachokats/realm-explorer'

interface CollectionData {
  collection_stats: {
    images_folder_uri: string;
    total_supply: number;
    total_traits: number;
    types: {
      random: number;
      rare: number;
      unique: number;
    };
    statistical_overview: {
      outliers: {
        [key: string]: {
          statistics: {
            distribution: {
              min: number;
              max: number;
              median: number;
              quartiles: number[];
              iqr: number;
              rarity_segments: {
                [key: string]: number;
              };
            };
            central_tendency: {
              mean: number;
              mode: number;
              std_dev: number;
              variance: number;
            };
            trait_metrics: {
              unique_count: number;
              diversity_score: number;
              concentration_index: number;
            };
          };
          outliers: any;
          summary: any;
        };
      };
    };
  };
}

export default function NachoKatsPage() {
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/nachokats/collection.json')
        const data = await response.json()
        console.log('Fetched collection data:', data); // Debug log
        setCollectionData(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading collection data:', error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!collectionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Data</h2>
          <p className="mt-2 text-gray-600">Unable to load collection analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NachoKatsHeader 
        activeSection={activeSection}
        onSectionChangeAction={setActiveSection}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeSection === 'overview' && (
            <CollectionOverview data={collectionData.collection_stats} />
          )}
          
          {activeSection === 'traits' && (
            <TraitAnalysis data={collectionData.collection_stats.statistical_overview.outliers} />
          )}
          
          {activeSection === 'rarity' && (
            <RarityDistribution data={collectionData.collection_stats} />
          )}
          
          {activeSection === 'statistics' && (
            <StatisticalInsights data={collectionData.collection_stats} />
          )}
          
          {activeSection === 'realms' && (
            <RealmExplorer data={collectionData.collection_stats} />
          )}
        </motion.div>
      </main>
    </div>
  )
} 