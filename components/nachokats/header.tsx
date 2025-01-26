'use client'

import { motion } from 'framer-motion'
import { useCallback } from 'react'

interface NavItem {
  id: string;
  label: string;
  description: string;
}

interface HeaderProps {
  activeSection: string;
  onSectionChangeAction: (section: string) => void;
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Collection Overview',
    description: 'High-level statistics and key metrics'
  },
  {
    id: 'traits',
    label: 'Trait Analysis',
    description: 'Deep dive into trait distributions and rarity'
  },
  {
    id: 'rarity',
    label: 'Rarity Distribution',
    description: 'Explore rarity scores and rankings'
  },
  {
    id: 'statistics',
    label: 'Statistical Insights',
    description: 'Advanced statistical analysis and patterns'
  },
  {
    id: 'realms',
    label: 'Realm Explorer',
    description: 'Analysis by realm distribution'
  }
]

export default function NachoKatsHeader({ activeSection, onSectionChangeAction }: HeaderProps) {
  const handleNavClick = useCallback((section: string) => {
    onSectionChangeAction(section)
  }, [onSectionChangeAction])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nacho Kats Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive collection analysis and insights
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Explorer
              </a>
            </div>
          </div>

          <nav className="mt-6">
            <ul className="flex space-x-4 overflow-x-auto pb-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
} 