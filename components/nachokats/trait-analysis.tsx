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
  common: {
    color: '#868E96',
    label: 'Common',
    description: 'Frequently occurring traits (>35%)'
  },
  uncommon: {
    color: '#51CF66',
    label: 'Uncommon',
    description: 'Less common traits (15-35%)'
  },
  rare: {
    color: '#4DABF7',
    label: 'Rare',
    description: 'Uncommon traits (5-15%)'
  },
  epic: {
    color: '#9775FA',
    label: 'Epic',
    description: 'Very rare traits (1-5%)'
  },
  legendary: {
    color: '#FF6B6B',
    label: 'Legendary',
    description: 'Extremely rare traits (< 1%)'
  }
} as const

const getFormattedTierLabel = (value: string) => {
  if (!value || !RARITY_TIERS[value as keyof typeof RARITY_TIERS]) {
    return value || 'Unknown';
  }
  return RARITY_TIERS[value as keyof typeof RARITY_TIERS].label;
}

const CustomTooltip = ({ active, payload, label, category }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={category}
        subtitle={`Trait: ${label}`}
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Count"
          value={data.value}
          highlight
        />
        <TooltipRow 
          label="Percentage"
          value={`${((data.value / data.total) * 100).toFixed(2)}%`}
        />
        <TooltipRow 
          label="Rarity Tier"
          value={RARITY_TIERS[data.rarityTier].label}
        />
        <div className="mt-2 text-xs text-gray-500">
          {RARITY_TIERS[data.rarityTier].description}
        </div>
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

export default function TraitAnalysis({ data }: TraitAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(data)[0])
  const [selectedView, setSelectedView] = useState('distribution')

  const processedData = useMemo(() => {
    try {
      const categoryData = data[selectedCategory];
      const total = Object.values(categoryData.statistics.distribution.rarity_segments)
        .reduce((a, b) => a + b, 0);

      // Distribution data
      const getRarityTier = (percentage: number): keyof typeof RARITY_TIERS => {
        if (percentage < 1) return 'legendary'
        if (percentage < 5) return 'epic'
        if (percentage < 15) return 'rare'
        if (percentage < 35) return 'uncommon'
        return 'common'
      }

      const distribution = Object.entries(categoryData.statistics.distribution.rarity_segments)
        .map(([tier, count]) => {
          const percentage = (count / total) * 100
          const rarityTier = getRarityTier(percentage)
          return {
            name: tier,
            value: count,
            total,
            rarityTier,
            percentage
          }
        })
        .sort((a, b) => b.value - a.value);

      // Statistical metrics
      const statistics = {
        mean: categoryData.statistics.central_tendency.mean,
        median: categoryData.statistics.distribution.median,
        std_dev: categoryData.statistics.central_tendency.std_dev,
        diversity_score: categoryData.statistics.trait_metrics.diversity_score,
        concentration_index: categoryData.statistics.trait_metrics.concentration_index,
        quartiles: categoryData.statistics.distribution.quartiles
      };

      // Distribution curve data
      const distributionCurve = Array.from({ length: 100 }, (_, i) => {
        const x = i;
        const y = (1 / (statistics.std_dev * Math.sqrt(2 * Math.PI))) * 
                  Math.exp(-0.5 * Math.pow((x - statistics.mean) / statistics.std_dev, 2));
        return { x, y };
      });

      // Radar chart data
      const radarData = [{
        category: selectedCategory,
        diversity: statistics.diversity_score,
        concentration: statistics.concentration_index,
        variance: Math.min(100, (statistics.std_dev / statistics.mean) * 100),
        uniqueness: (categoryData.statistics.trait_metrics.unique_count / total) * 100
      }];

      return {
        distribution,
        statistics,
        distributionCurve,
        radarData
      };
    } catch (error) {
      console.error('Error processing trait data:', error);
      // Return default/empty data structure
      return {
        distribution: [],
        statistics: {
          mean: 0,
          median: 0,
          std_dev: 0,
          diversity_score: 0,
          concentration_index: 0,
          quartiles: []
        },
        distributionCurve: [],
        radarData: []
      };
    }
  }, [data, selectedCategory]);

  // Add error boundary for the entire component
  if (!data || !selectedCategory || !data[selectedCategory]) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No trait data available</p>
        </div>
      </div>
    );
  }

  const viewOptions = [
    { id: 'distribution', name: 'Distribution', icon: ChartBarIcon },
    { id: 'statistics', name: 'Statistics', icon: BeakerIcon },
    { id: 'patterns', name: 'Patterns', icon: ChartPieIcon },
    { id: 'trends', name: 'Trends', icon: ArrowTrendingUpIcon }
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Category Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Trait Categories</h3>
          <Tab.Group onChange={setSelectedCategory}>
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
      </div>

      {/* View Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-2">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedView(option.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedView === option.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <option.icon className="h-5 w-5" />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart (existing, enhanced styling) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribution for {selectedCategory}
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer>
                <BarChart data={processedData.distribution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={getFormattedTierLabel}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    label={{ 
                      value: 'Count',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#6B7280' }
                    }}
                  />
                  <Tooltip content={(props) => 
                    <CustomTooltip {...props} category={selectedCategory} />
                  } />
                  <Bar dataKey="value">
                    {processedData.distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={RARITY_TIERS[entry.rarityTier].color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Statistical Pattern Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pattern Analysis
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer>
                <RadarChart data={processedData.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Metrics"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<StatisticsTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Distribution Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribution Curve
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer>
                <AreaChart data={processedData.distributionCurve}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="x" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Statistical Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(processedData.statistics).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 