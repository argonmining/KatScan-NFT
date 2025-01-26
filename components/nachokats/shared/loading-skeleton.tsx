'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  type?: 'card' | 'chart' | 'grid'
  count?: number
}

export default function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array(count).fill(null)

  const variants = {
    card: "h-32 rounded-xl",
    chart: "h-[300px] rounded-xl",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
  }

  return (
    <div className={type === 'grid' ? variants.grid : 'space-y-6'}>
      {skeletons.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut" 
          }}
          className={`
            bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
            ${variants[type]}
          `}
        />
      ))}
    </div>
  )
} 