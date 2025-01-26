'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from './shared/card'
import StatCard from './shared/stat-card'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts'
import { 
  SparklesIcon, ChartBarIcon, 
  TagIcon, GlobeAltIcon,
  ChartPieIcon, BeakerIcon
} from '@heroicons/react/24/outline'
import ErrorBoundary from './shared/error-boundary'
import LoadingSkeleton from './shared/loading-skeleton'
import ChartWrapper from './shared/chart-wrapper'
import { chartTheme, tooltipStyle, chartAnimationConfig } from '@/utils/chart-config'
import { 
  TypeDistributionTooltip, 
  TraitDistributionTooltip 
} from './shared/chart-tooltips'
import { ChartErrorBoundary } from './shared/chart-error-boundary'

interface TraitInfo {
  statistics: {
    trait_metrics: {
      unique_count: number;
      diversity_score: number;
      rarest_variation?: string;
    };
  };
}

interface CollectionOverviewProps {
  data: {
    total_supply: number;
    total_traits: number;
    types: {
      random: number;
      rare: number;
      unique: number;
    };
    statistical_overview: {
      outliers: {
        [key: string]: TraitInfo;
      };
    };
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
const RARITY_COLORS = {
  random: '#3B82F6',
  rare: '#10B981',
  unique: '#F59E0B'
}

export default function CollectionOverview({ data }: CollectionOverviewProps) {
  // 1. All useState hooks first
  const [isLoading, setIsLoading] = useState(true)

  // 2. All useMemo hooks
  const statsCards = useMemo(() => [
    {
      title: 'Total Supply',
      value: data.total_supply.toLocaleString(),
      icon: ChartBarIcon,
      description: 'Total NFTs in collection',
      color: 'blue' as const
    },
    {
      title: 'Total Traits',
      value: data.total_traits.toLocaleString(),
      icon: TagIcon,
      description: 'Unique trait variations',
      color: 'purple' as const
    },
    {
      title: 'Rare NFTs',
      value: (data.types.rare + data.types.unique).toLocaleString(),
      icon: SparklesIcon,
      description: 'Rare and unique items',
      color: 'orange' as const
    },
    {
      title: 'Realms',
      value: '9',
      icon: GlobeAltIcon,
      description: 'Distinct realms',
      color: 'green' as const
    }
  ], [data])

  const distributionData = useMemo(() => {
    console.log('Types data:', data.types); // Debug log
    const total = data.types.random + data.types.rare + data.types.unique;
    const result = [
      { 
        name: 'Random', 
        value: data.types.random,
        percentage: (data.types.random / total) * 100
      },
      { 
        name: 'Rare', 
        value: data.types.rare,
        percentage: (data.types.rare / total) * 100
      },
      { 
        name: 'Unique', 
        value: data.types.unique,
        percentage: (data.types.unique / total) * 100
      }
    ];
    console.log('Processed distribution data:', result); // Debug log
    return result;
  }, [data])

  const traitData = useMemo(() => {
    console.log('Outliers data:', data.statistical_overview.outliers); // Debug log
    const result = Object.entries(data.statistical_overview.outliers)
      .map(([trait, info]) => ({
        trait,
        count: info.statistics.trait_metrics.unique_count,
        diversityScore: info.statistics.trait_metrics.diversity_score,
        percentage: (info.statistics.trait_metrics.unique_count / data.total_traits) * 100
      }))
      .sort((a, b) => b.count - a.count);
    console.log('Processed trait data:', result); // Debug log
    return result;
  }, [data])

  const traitHighlights = useMemo(() => {
    const traits = Object.entries(data.statistical_overview.outliers)
      .map(([trait, info]) => ({
        name: trait,
        uniqueVariations: info.statistics.trait_metrics.unique_count,
        diversityScore: info.statistics.trait_metrics.diversity_score
      }))
      .sort((a, b) => b.uniqueVariations - a.uniqueVariations);

    return traits;
  }, [data]);

  // 3. useEffect hooks last
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <LoadingSkeleton type="grid" count={4} />
        <LoadingSkeleton type="chart" count={2} />
        <LoadingSkeleton type="card" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="space-y-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Type Distribution"
            subtitle="Distribution of NFTs by rarity type"
            gradient
          >
            <ChartErrorBoundary>
              <ChartWrapper className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} ${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={RARITY_COLORS[entry.name.toLowerCase() as keyof typeof RARITY_COLORS]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<TypeDistributionTooltip />} />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm font-medium text-gray-700">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartErrorBoundary>
          </Card>

          <Card
            title="Trait Distribution"
            subtitle="Distribution of unique trait variations across categories"
          >
            <ChartErrorBoundary>
              <ChartWrapper className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={traitData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="trait"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickLine={{ stroke: '#E5E7EB' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      height={60}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickLine={{ stroke: '#E5E7EB' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      label={{ 
                        value: 'Unique Variations',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: '#6B7280', fontSize: 12 }
                      }}
                    />
                    <Tooltip content={<TraitDistributionTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      {traitData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={`hsl(${220 + (index * 5)}, 84%, 66%)`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </ChartErrorBoundary>
          </Card>
        </div>

        {/* Collection Highlights */}
        <Card title="Collection Highlights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {traitHighlights.map((trait) => (
              <div 
                key={trait.name}
                className="p-6 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-4">
                  {trait.name} Traits
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Unique Variations:</span>
                    <span className="font-medium text-gray-900">
                      {trait.uniqueVariations}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Diversity Score:</span>
                    <span className="font-medium text-gray-900">
                      {trait.diversityScore.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </ErrorBoundary>
  )
} 