'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ChartWrapperProps {
  children: ReactNode
  className?: string
}

export default function ChartWrapper({ children, className = '' }: ChartWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-lg" />
      <div className="relative">
        {children}
      </div>
    </motion.div>
  )
} 