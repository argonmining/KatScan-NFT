'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap
} from 'recharts'
import { Tab } from '@headlessui/react'

interface RealmExplorerProps {
  data: {
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

const RARITY_TIERS = {
  legendary: {
    color: '#FF6B6B',
    gradient: 'from-red-500/20 to-red-500/5',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50'
  },
  epic: {
    color: '#9775FA',
    gradient: 'from-purple-500/20 to-purple-500/5',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50'
  },
  rare: {
    color: '#4DABF7',
    gradient: 'from-blue-500/20 to-blue-500/5',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50'
  },
  uncommon: {
    color: '#51CF66',
    gradient: 'from-green-500/20 to-green-500/5',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50'
  },
  common: {
    color: '#868E96',
    gradient: 'from-gray-500/20 to-gray-500/5',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50'
  }
}

export default function RealmExplorer({ data }: RealmExplorerProps) {
  const [selectedRealm, setSelectedRealm] = useState<string>('1')

  const realmData = useMemo(() => {
    const realmStats = data.statistical_overview.outliers[selectedRealm]

    // Process realm distribution data with correct rarity terms
    const distribution = Object.entries(realmStats.statistics.distribution.rarity_segments)
      .map(([key, count]) => {
        // Map the old terms to new ones
        const rarityTier = key === 'ultra_rare' ? 'legendary' :
                          key === 'very_rare' ? 'epic' :
                          key === 'rare' ? 'rare' :
                          key === 'uncommon' ? 'uncommon' : 'common'
        
        return {
          name: rarityTier.charAt(0).toUpperCase() + rarityTier.slice(1),
          value: count,
          color: RARITY_TIERS[rarityTier as keyof typeof RARITY_TIERS].color
        }
      })

    // Calculate realm metrics
    const metrics = {
      totalRealms: realmStats.summary.trait_count,
      averageSize: realmStats.statistics.central_tendency.mean,
      diversityScore: realmStats.statistics.trait_metrics.diversity_score,
      distributionType: realmStats.summary.distribution_type
    }

    return {
      distribution,
      metrics,
      realmStats
    }
  }, [data, selectedRealm])

  return (
    <div className="space-y-8">
      {/* Enhanced Realm Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Realm Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(realmData.metrics).map(([key, value]) => (
              <div 
                key={key}
                className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"/>
                <div className="relative">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Realm Distribution</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={realmData.distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percent }) => 
                      `${name} (${(percent * 100).toFixed(1)}%)`
                    }
                  >
                    {realmData.distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <div className="font-medium text-gray-900">{data.name}</div>
                          <div className="text-gray-500">Count: {data.value}</div>
                          <div className="text-gray-500">
                            Percentage: {((data.value / realmData.metrics.totalRealms) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {payload?.map((entry, index) => (
                          <div key={`legend-${index}`} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-600">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Realm Size Comparison</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realmData.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Population">
                  {realmData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Realm Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Realm Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realm
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Population
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rarity Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {realmData.distribution.map((realm) => {
                const total = realmData.distribution.reduce((sum: number, r) => sum + r.value, 0)
                const percentage = ((realm.value / total) * 100).toFixed(1)
                return (
                  <tr key={realm.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {realm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {realm.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(10000 / realm.value).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
} 