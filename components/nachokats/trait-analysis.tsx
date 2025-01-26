'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts'
import { Tab } from '@headlessui/react'
import { TooltipWrapper, TooltipHeader, TooltipRow } from './shared/tooltips'
import { ChartBarIcon, ChartPieIcon, BeakerIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { ChartErrorBoundary } from './shared/chart-error-boundary'
import Card from './shared/card'

interface TraitAnalysisProps {
  data: {
    [key: string]: {
      statistics: {
        distribution: {
          min: number;
          max: number;
          median: number;
          quartiles: number[];
          rarity_segments: {
            [key: string]: number;
          };
        };
        central_tendency: {
          mean: number;
          mode: number;
          std_dev: number;
        };
        trait_metrics: {
          unique_count: number;
          diversity_score: number;
          concentration_index: number;
        };
      };
      outliers: {
        [key: string]: number;
      };
      summary: {
        trait_count: number;
        outlier_count: number;
        distribution_type: string;
      };
    };
  }
}

const RARITY_TIERS = {
  legendary: {
    color: '#FF6B6B',
    label: 'Legendary',
    description: 'Extremely rare traits (<1%)'
  },
  epic: {
    color: '#9775FA',
    label: 'Epic',
    description: 'Very rare traits (1-5%)'
  },
  rare: {
    color: '#4DABF7',
    label: 'Rare',
    description: 'Rare traits (5-15%)'
  },
  uncommon: {
    color: '#51CF66',
    label: 'Uncommon',
    description: 'Less common traits (15-35%)'
  },
  common: {
    color: '#868E96',
    label: 'Common',
    description: 'Frequently occurring traits (>35%)'
  }
} as const

const getFormattedTierLabel = (value: string) => {
  if (!value || !RARITY_TIERS[value as keyof typeof RARITY_TIERS]) {
    return value || 'Unknown';
  }
  return RARITY_TIERS[value as keyof typeof RARITY_TIERS].label;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={data.name}
        subtitle={data.description}
      />
      <div className="space-y-2">
        <TooltipRow 
          label="Total Traits"
          value={data.total}
          highlight
        />
        {data.traits.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-600 mb-1">Traits:</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {data.traits.map((trait: any, index: number) => (
                <div 
                  key={index} 
                  className="text-sm flex justify-between items-center"
                >
                  <span className="text-gray-600 mr-4">{trait.trait}</span>
                  <span className="text-gray-900 font-medium">
                    {trait.rarity.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipWrapper>
  );
};

const StatisticsTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title="Distribution Statistics"
        subtitle={data.name}
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Mean"
          value={data.mean.toFixed(2)}
          highlight
        />
        <TooltipRow 
          label="Median"
          value={data.median.toFixed(2)}
        />
        <TooltipRow 
          label="Standard Deviation"
          value={data.std_dev.toFixed(2)}
        />
        <TooltipRow 
          label="Diversity Score"
          value={`${data.diversity_score.toFixed(2)}%`}
        />
      </div>
    </TooltipWrapper>
  );
};

// Add this wrapper function for consistent error handling
const ChartContainer = ({ children }: { children: React.ReactNode }) => (
  <ChartErrorBoundary>
    <div className="h-[400px] w-full">
      <ResponsiveContainer>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  </ChartErrorBoundary>
)

// First, add this helper function to determine rarity tier
const getRarityTier = (percentage: number): keyof typeof RARITY_TIERS => {
  if (percentage < 1) return 'legendary';
  if (percentage < 5) return 'epic';
  if (percentage < 15) return 'rare';
  if (percentage < 35) return 'uncommon';
  return 'common';
};

export default function TraitAnalysis({ data }: TraitAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState(() => 
    data && Object.keys(data).length > 0 ? Object.keys(data)[0] : ''
  )
  const [selectedView, setSelectedView] = useState('distribution')

  const processedData = useMemo(() => {
    if (!data || !selectedCategory || !data[selectedCategory]) {
      return {
        statistics: {
          mean: 0,
          median: 0,
          mode: 0,
          std_dev: 0,
          diversity_score: 0,
          concentration_index: 0
        },
        distributionCurve: [],
        radarData: [],
        traitDistribution: []
      };
    }

    try {
      const categoryData = data[selectedCategory];
      const { statistics, outliers } = categoryData;

      // Process traits by rarity tier using the rarity_segments
      const traitDistribution = Object.entries(RARITY_TIERS).map(([tier, config]) => {
        const segmentCount = statistics.distribution.rarity_segments[tier] || 0;
        const traitList = Object.entries(outliers || {})
          .filter(([_, rarity]) => {
            const percentage = rarity * 100;
            const traitTier = getRarityTier(percentage);
            return traitTier === tier;
          })
          .map(([trait, rarity]) => ({
            trait,
            rarity: rarity * 100
          }))
          .sort((a, b) => a.rarity - b.rarity);

        return {
          name: config.label,
          color: config.color,
          traits: traitList,
          total: segmentCount,
          description: config.description
        };
      });

      // Process rarity segments with validation
      const raritySegments = Object.entries(statistics.distribution.rarity_segments || {})
        .map(([key, value]: [string, number]) => {
          if (typeof value !== 'number') {
            console.warn(`Invalid value for rarity segment ${key}:`, value);
            return null;
          }
          return {
            name: key,
            value,
            color: RARITY_TIERS[key as keyof typeof RARITY_TIERS]?.color || '#868E96'
          };
        })
        .filter((segment): segment is NonNullable<typeof segment> => segment !== null);

      // Validate statistical values
      const validatedStats = {
        mean: Number(statistics.central_tendency.mean) || 0,
        median: Number(statistics.distribution.median) || 0,
        mode: Number(statistics.central_tendency.mode) || 0,
        std_dev: Number(statistics.central_tendency.std_dev) || 0,
        diversity_score: Number(statistics.trait_metrics.diversity_score) || 0,
        concentration_index: Number(statistics.trait_metrics.concentration_index) || 0
      };

      // Create distribution curve data with validation
      const distributionCurve = Array.from({ length: 100 }, (_, i) => {
        const x = i;
        const mean = validatedStats.mean;
        const stdDev = validatedStats.std_dev;
        
        if (stdDev === 0) return { x, y: 0 };
        
        const y = Math.exp(-(Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2))));
        return { x, y };
      });

      // Update the radar data calculation to not rely on summary
      const radarData = [
        {
          metric: 'Diversity',
          value: statistics.trait_metrics.diversity_score,
          fullMark: 100
        },
        {
          metric: 'Uniqueness',
          value: (statistics.trait_metrics.unique_count / 
            Object.keys(outliers || {}).length) * 100,
          fullMark: 100
        },
        {
          metric: 'Rarity',
          value: (1 - statistics.trait_metrics.concentration_index) * 100,
          fullMark: 100
        }
      ];

      console.log('Processed data for category:', selectedCategory, {
        statistics: validatedStats,
        raritySegments,
        radarData
      });

      return {
        statistics: validatedStats,
        distributionCurve,
        radarData,
        raritySegments,
        traitDistribution
      };
    } catch (error) {
      console.error('Error processing data:', error);
      return {
        statistics: {
          mean: 0,
          median: 0,
          mode: 0,
          std_dev: 0,
          diversity_score: 0,
          concentration_index: 0
        },
        distributionCurve: [],
        radarData: [],
        traitDistribution: []
      };
    }
  }, [data, selectedCategory])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No trait data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trait Categories</h3>
        <Tab.Group 
          selectedIndex={Object.keys(data).indexOf(selectedCategory)}
          onChange={(index) => {
            const categories = Object.keys(data);
            const newCategory = categories[index];
            if (newCategory) {
              setSelectedCategory(newCategory);
            }
          }}
        >
          <Tab.List className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Object.keys(data).map((category) => (
              <Tab
                key={category}
                className={({ selected }) => `
                  px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${selected 
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-700/10' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span>{category}</span>
                  <span className="text-xs opacity-75">
                    {data[category].statistics.trait_metrics.unique_count} variations
                  </span>
                </div>
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
      </div>

      {/* View Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Tab.Group 
          selectedIndex={selectedView === 'distribution' ? 0 : 1}
          onChange={(index) => setSelectedView(index === 0 ? 'distribution' : 'statistics')}
        >
          <Tab.List className="flex space-x-4">
            <Tab className={({ selected }) => `
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selected 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}>
              Distribution
            </Tab>
            <Tab className={({ selected }) => `
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selected 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}>
              Statistics
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel>
              <ChartContainer>
                <BarChart 
                  data={processedData.traitDistribution}
                  margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 12 }}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    label={{ 
                      value: 'Number of Traits', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                  >
                    {processedData.traitDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Tab.Panel>

            <Tab.Panel>
              <ChartContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(processedData.statistics).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-500">
                        {key.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </div>
                      <div className="mt-1 text-2xl font-bold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
} 