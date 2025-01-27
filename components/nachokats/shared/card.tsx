'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export default function Card({ title, subtitle, children, className = '', gradient = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden
        ${gradient ? 'bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="p-6 border-b border-gray-100">
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  )
} 