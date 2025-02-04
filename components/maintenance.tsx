'use client'

import Link from 'next/link'
import Image from 'next/image'
import Preview2 from '@/public/images/Preview2.png'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        {/* Preview Image */}
        <div className="mb-8 relative">
          <div className="relative w-48 h-48 mx-auto mb-6 
                        animate-float" // Custom animation for subtle floating effect
          >
            <Image
              src={Preview2}
              alt="Maintenance Illustration"
              width={192}
              height={192}
              className="rounded-full border-4 border-gray-800/50"
            />
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 
                         bg-gradient-to-r from-white via-blue-400 to-white bg-clip-text text-transparent">
            Under Maintenance
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            We're currently updating our systems to serve you better.
          </p>
        </div>

        {/* Links Section */}
        <div className="space-y-6">
          <h2 className="text-xl text-gray-300 font-medium mb-8">In the meantime:</h2>
          
          <div className="space-y-4">
            <Link 
              href="https://katscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-6 py-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg 
                       transition-all duration-200 group backdrop-blur-sm
                       border border-gray-700/50 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">KatScan KRC-20 Explorer</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </div>
            </Link>

            <Link 
              href="https://krcscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-6 py-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg 
                       transition-all duration-200 group backdrop-blur-sm
                       border border-gray-700/50 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">KRC-721 NFT Collections</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </div>
            </Link>

            <Link 
              href="https://nachokats.katscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-6 py-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg 
                       transition-all duration-200 group backdrop-blur-sm
                       border border-gray-700/50 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Nacho Kats NFT Rarity Search</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 