'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { 
  ChartPieIcon, ChartBarIcon, 
  BeakerIcon, LightBulbIcon 
} from '@heroicons/react/24/outline'

interface StatisticalInsightsProps {
  data: {
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
        };
      };
    };
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function StatisticalInsights({ data }: StatisticalInsightsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('diversity')
  
  const processedData = useMemo(() => {
    const traitCategories = Object.entries(data.statistical_overview.outliers)
    
    // Distribution metrics across traits
    const distributionMetrics = traitCategories.map(([category, info]) => ({
      name: category,
      diversity: info.statistics.trait_metrics.diversity_score,
      concentration: info.statistics.trait_metrics.concentration_index,
      uniqueCount: info.statistics.trait_metrics.unique_count,
      standardDeviation: info.statistics.central_tendency.std_dev
    }))

    // Rarity segment distribution
    const raritySegments = traitCategories.map(([category, info]) => ({
      name: category,
      ...info.statistics.distribution.rarity_segments
    }))

    // Statistical measures
    const statisticalMeasures = traitCategories.map(([category, info]) => ({
      name: category,
      mean: info.statistics.central_tendency.mean,
      median: info.statistics.distribution.median,
      mode: info.statistics.central_tendency.mode,
      stdDev: info.statistics.central_tendency.std_dev
    }))

    return {
      distributionMetrics,
      raritySegments,
      statisticalMeasures
    }
  }, [data])

  const insights = useMemo(() => [
    {
      title: 'Distribution Analysis',
      icon: ChartBarIcon,
      metrics: [
        {
          label: 'Most Diverse Category',
          value: processedData.distributionMetrics
            .reduce((prev, curr) => prev.diversity > curr.diversity ? prev : curr).name,
          detail: 'Highest trait variation'
        },
        {
          label: 'Most Concentrated Category',
          value: processedData.distributionMetrics
            .reduce((prev, curr) => prev.concentration > curr.concentration ? prev : curr).name,
          detail: 'Highest trait concentration'
        }
      ]
    },
    {
      title: 'Statistical Patterns',
      icon: BeakerIcon,
      metrics: [
        {
          label: 'Highest Variance',
          value: processedData.statisticalMeasures
            .reduce((prev, curr) => prev.stdDev > curr.stdDev ? prev : curr).name,
          detail: 'Most spread in distribution'
        },
        {
          label: 'Most Balanced',
          value: processedData.statisticalMeasures
            .reduce((prev, curr) => 
              Math.abs(curr.mean - curr.median) < Math.abs(prev.mean - prev.median) ? curr : prev
            ).name,
          detail: 'Closest to normal distribution'
        }
      ]
    }
  ], [processedData])

  return (
    <div className="space-y-8">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((section) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.metrics.map((metric) => (
                <div key={metric.label} className="border-l-4 border-blue-500 pl-4">
                  <div className="text-sm font-medium text-gray-500">{metric.label}</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-500">{metric.detail}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trait Metrics Distribution</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.distributionMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="diversity" fill="#3B82F6" name="Diversity Score" />
                <Bar dataKey="concentration" fill="#10B981" name="Concentration Index" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trait Category Analysis</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={processedData.traitCorrelations}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Diversity"
                  dataKey="diversity"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Rarity"
                  dataKey="rarity"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Statistical Measures */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Measures</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData.statisticalMeasures}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="mean" 
                stroke="#3B82F6" 
                name="Mean"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="median" 
                stroke="#10B981" 
                name="Median"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="mode" 
                stroke="#F59E0B" 
                name="Mode"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
} 