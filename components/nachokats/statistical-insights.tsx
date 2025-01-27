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
              rarity_segments: {
                [key: string]: number;
              };
            };
            central_tendency: {
              mean: number;
              median: number;
              mode: number;
              std_dev: number;
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
  
  const processedData = useMemo<{
    distributionMetrics: Array<{ name: string; value: number }>;
    raritySegments: Array<{ name: string; value: number }>;
    statisticalMeasures: Array<{ name: string; value: number }>;
    traitCorrelations: Array<{ category: string; diversity: number; rarity: number }>;
  }>(() => {
    const traitCategories = Object.entries(data.statistical_overview.outliers);
    
    // Distribution metrics across traits
    const distributionMetrics = traitCategories.map(([name, info]) => ({
      name,
      value: info.statistics.trait_metrics.diversity_score || 0
    }));

    // Rarity segments
    const raritySegments = Object.entries(
      traitCategories[0]?.[1].statistics.distribution.rarity_segments || {}
    ).map(([name, value]) => ({
      name,
      value: value || 0
    }));

    // Statistical measures
    const firstCategory = traitCategories[0]?.[1].statistics.central_tendency;
    const statisticalMeasures = [
      { name: 'Mean', value: firstCategory?.mean || 0 },
      { name: 'Median', value: firstCategory?.median || 0 },
      { name: 'Mode', value: firstCategory?.mode || 0 },
      { name: 'Standard Deviation', value: firstCategory?.std_dev || 0 }
    ];

    // Add trait correlations calculation
    const traitCorrelations = traitCategories.map(([category, info]) => ({
      category,
      diversity: info.statistics.trait_metrics.diversity_score || 0,
      rarity: info.statistics.trait_metrics.concentration_index * 100 || 0
    }));

    return {
      distributionMetrics,
      raritySegments,
      statisticalMeasures,
      traitCorrelations
    };
  }, [data])

  const insights = useMemo(() => [
    {
      title: 'Distribution Analysis',
      icon: ChartBarIcon,
      metrics: [
        {
          label: 'Most Diverse Category',
          value: processedData.distributionMetrics
            .reduce((prev, curr) => prev.value > curr.value ? prev : curr).name,
          detail: 'Highest trait variation'
        },
        {
          label: 'Most Concentrated Category',
          value: processedData.distributionMetrics
            .reduce((prev, curr) => prev.value > curr.value ? prev : curr).name,
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
            .reduce((prev, curr) => prev.value > curr.value ? prev : curr).name,
          detail: 'Most spread in distribution'
        },
        {
          label: 'Most Balanced',
          value: processedData.statisticalMeasures
            .reduce((prev, curr) => 
              Math.abs(curr.value - processedData.statisticalMeasures[1].value) < Math.abs(prev.value - processedData.statisticalMeasures[1].value) ? curr : prev
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
                <Bar dataKey="value" fill="#3B82F6" name="Diversity Score" />
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
              <BarChart data={processedData.distributionMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6" 
                  name="Distribution Score"
                />
              </BarChart>
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
                dataKey="value" 
                stroke="#3B82F6" 
                name="Value"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
} 