'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

const colorClasses = {
  blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
  purple: 'from-purple-500/10 to-purple-500/5 text-purple-600',
  green: 'from-green-500/10 to-green-500/5 text-green-600',
  orange: 'from-orange-500/10 to-orange-500/5 text-orange-600',
  red: 'from-red-500/10 to-red-500/5 text-red-600'
}

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  color = 'blue'
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-xl border border-gray-200 
        bg-gradient-to-br ${colorClasses[color]} p-6 shadow-sm
      `}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`
            rounded-lg p-3 
            ${color}-gradient bg-opacity-10
          `}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </motion.div>
  )
} 