'use client'

import { useState } from 'react'
import Image from 'next/image'
import { NFTDisplay } from '@/types/nft'

interface NFTCardProps {
    nft: NFTDisplay;
}

export default function NFTCard({ nft }: NFTCardProps) {
    return (
        <div className="flip-card w-full h-full">
            <div className="flip-card-inner relative w-full h-full">
                {/* Front of card */}
                <div className="flip-card-front absolute w-full h-full">
                    {nft.metadata.imageUrl && (
                        <div className="relative w-full h-full group">
                            {/* Decorative frame */}
                            <div className="absolute inset-0 rounded-lg border-4 border-gray-100 shadow-lg bg-white">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <Image
                                        src={nft.metadata.imageUrl}
                                        alt={nft.metadata.name}
                                        className="rounded-md max-h-full max-w-full w-auto h-auto"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            </div>
                            
                            {/* Minting status badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium shadow-md ${
                                nft.isMinted 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {nft.isMinted ? 'Minted' : 'Not Minted'}
                            </div>

                            {/* Title overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                                <h3 className="text-white font-semibold truncate">
                                    {nft.metadata.name}
                                </h3>
                                {nft.isMinted && (
                                    <p className="text-white/80 text-sm truncate mt-1">
                                        Owner: {nft.owner}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Updated back card */}
                <div className="flip-card-back absolute w-full h-full rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-3">
                    <div className="h-full flex flex-col">
                        {/* More compact header */}
                        <div className="mb-2">
                            <h3 className="text-base font-bold text-white leading-tight">
                                {nft.metadata.name}
                            </h3>
                            <p className="text-gray-300 text-[11px] line-clamp-1 mt-0.5">
                                {nft.metadata.description}
                            </p>
                        </div>

                        {/* Tighter attributes grid */}
                        {nft.metadata.attributes && (
                            <div className="grid grid-cols-2 gap-1.5">
                                {nft.metadata.attributes.map((attr, index) => (
                                    <div 
                                        key={index}
                                        className="bg-white/10 rounded-md p-1.5"
                                    >
                                        <div className="text-gray-400 text-[9px] uppercase tracking-wider leading-none">
                                            {attr.trait_type}
                                        </div>
                                        <div className="text-white text-[11px] font-medium truncate mt-0.5">
                                            {attr.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 