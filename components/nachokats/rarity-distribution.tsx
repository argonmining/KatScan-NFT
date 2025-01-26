'use client'

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell
} from 'recharts'
import { Tab } from '@headlessui/react'
import { RarityDistributionTooltip } from './shared/chart-tooltips'
import Card from './shared/card'
import { SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface RarityDistributionProps {
  data: {
    statistical_overview: {
      outliers: {
        [key: string]: {
          statistics: {
            distribution: {
              rarity_segments: {
                [key: string]: number;
              };
            };
            trait_metrics: {
              unique_count: number;
              diversity_score: number;
              concentration_index: number;
            };
          };
        };
      };
    };
    rarest_nfts?: Array<{
      id: number;
      image_url: string;
      rarity_score: number;
      traits: Array<{
        type: string;
        value: string;
        rarity: number;
      }>;
    }>;
  }
}

const RARITY_COLORS = {
  legendary: '#FF6B6B',
  epic: '#9775FA',
  rare: '#4DABF7',
  uncommon: '#51CF66',
  common: '#868E96'
}

export default function RarityDistribution({ data }: RarityDistributionProps) {
  const [selectedCategory, setSelectedCategory] = useState('Head')

  const processedData = useMemo(() => {
    if (!data?.statistical_overview?.outliers) {
      console.log('Missing data structure:', data)
      return {
        rarityDistribution: [],
        scatterData: []
      }
    }

    // Process rarity distribution from all trait categories
    const rarityDistribution = Object.entries(data.statistical_overview.outliers)
      .flatMap(([category, info]) => {
        return Object.entries(info.statistics.distribution.rarity_segments)
          .map(([rarity, count]) => {
            const total = Object.values(info.statistics.distribution.rarity_segments)
              .reduce((a, b) => a + b, 0)
            const percentage = (count / total) * 100
            return {
              category,
              rarity,
              count,
              total,
              percentage,
              color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#868E96'
            }
          })
      })

    // Create scatter data from trait metrics
    const scatterData = Object.entries(data.statistical_overview.outliers)
      .map(([category, info]) => ({
        category,
        x: info.statistics.trait_metrics.diversity_score || 0,
        y: info.statistics.trait_metrics.concentration_index || 0,
        uniqueCount: info.statistics.trait_metrics.unique_count || 0
      }))

    return {
      rarityDistribution,
      scatterData
    }
  }, [data])

  const rarestNFTs = useMemo(() => {
    return data.rarest_nfts?.slice(0, 5) || []
  }, [data.rarest_nfts])

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Rarity Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rarity Distribution Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.rarityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="rarity" 
                    tickFormatter={(value) => value.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  />
                  <YAxis />
                  <Tooltip 
                    content={<RarityDistributionTooltip />}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="count">
                    {processedData.rarityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trait Distribution Scatter Plot */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Diversity Score"
                    label={{ value: 'Diversity Score', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Concentration Index"
                    label={{ value: 'Concentration Index', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <div className="font-medium text-gray-900">{data.category}</div>
                          <div className="text-gray-500">Diversity Score: {data.x.toFixed(2)}</div>
                          <div className="text-gray-500">Concentration: {data.y.toFixed(2)}</div>
                          <div className="text-gray-500">Unique Traits: {data.uniqueCount}</div>
                        </div>
                      )
                    }}
                  />
                  <Scatter
                    data={processedData.scatterData}
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Rarest NFTs Section */}
      <Card
        title="Rarest NFTs"
        subtitle="Top 5 rarest NFTs in the collection"
        className="mt-6"
      >
        {data.rarest_nfts && data.rarest_nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.rarest_nfts.map((nft) => (
              <div 
                key={nft.id}
                className="relative flex flex-col bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
              >
                {/* NFT Image */}
                <div className="relative aspect-square">
                  <Image
                    src={nft.image_url}
                    alt={`NFT #${nft.id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* NFT Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">
                      #{nft.id}
                    </h4>
                    <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                      {nft.rarity_score.toFixed(2)}
                    </span>
                  </div>

                  {/* Traits */}
                  <div className="space-y-1">
                    {nft.traits.map((trait, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600">{trait.type}:</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-900">
                            {trait.value}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(trait.rarity * 100).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No rarest NFTs data available
          </div>
        )}
      </Card>

      {/* Add Rarity Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Distribution Insights">
          <div className="space-y-4">
            {Object.entries(RARITY_COLORS).map(([tier, color]) => (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize text-gray-700">{tier}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {processedData.rarityDistribution
                    .filter(d => d.rarity === tier)
                    .reduce((acc, curr) => acc + curr.count, 0)
                    .toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Statistical Highlights">
          {/* Add statistical highlights here */}
        </Card>
      </div>
    </div>
  )
} 