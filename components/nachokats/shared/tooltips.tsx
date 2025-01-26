'use client'

import { ReactNode } from 'react'

interface TooltipWrapperProps {
  children: ReactNode;
  className?: string;
}

export const TooltipWrapper = ({ children, className = '' }: TooltipWrapperProps) => (
  <div className={`
    bg-white p-4 rounded-lg shadow-lg border border-gray-200
    min-w-[200px] max-w-[300px] ${className}
  `}>
    {children}
  </div>
)

interface TooltipRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export const TooltipRow = ({ label, value, highlight = false }: TooltipRowProps) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}:</span>
    <span className={`
      text-sm font-medium
      ${highlight ? 'text-blue-600' : 'text-gray-900'}
    `}>
      {value}
    </span>
  </div>
)

interface TooltipHeaderProps {
  title: string;
  subtitle?: string;
}

export const TooltipHeader = ({ title, subtitle }: TooltipHeaderProps) => (
  <div className="mb-2">
    <h4 className="font-semibold text-gray-900">{title}</h4>
    {subtitle && (
      <p className="text-sm text-gray-500">{subtitle}</p>
    )}
  </div>
)

// Reusable tooltip formatters
export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
}

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return value.toLocaleString();
}

export const formatRarity = (score: number) => {
  if (score < 1) return 'Legendary'
  if (score < 5) return 'Epic'
  if (score < 15) return 'Rare'
  if (score < 35) return 'Uncommon'
  return 'Common'
} 