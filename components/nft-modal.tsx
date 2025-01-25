'use client'

import { useState } from 'react'
import { NFTDisplay } from '@/types/nft'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface NFTModalProps {
    nft: NFTDisplay;
    isOpen: boolean;
    onCloseAction: () => Promise<void>;
}

export default function NFTModal({ nft, isOpen, onCloseAction }: NFTModalProps) {
    const [showTraits, setShowTraits] = useState(false);

    const handleClose = async () => {
        await onCloseAction();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
                <div className="relative w-full max-w-3xl">
                    <div className="relative bg-[#1a1b23]/95 backdrop-blur-md rounded-2xl shadow-2xl">
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-800/50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl sm:text-2xl font-bold text-white">
                                    {nft.metadata.name}
                                </h2>
                                <div className="flex gap-2 sm:gap-4 items-center">
                                    <button
                                        onClick={() => setShowTraits(!showTraits)}
                                        className="text-gray-400 hover:text-white transition-colors px-3 py-1.5 text-sm"
                                    >
                                        {showTraits ? 'Overview' : 'View Traits'}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-white transition-colors p-2"
                                    >
                                        <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
                                {/* Image Container */}
                                <div className="relative">
                                    <div className="rounded-xl overflow-hidden bg-black/20 h-auto">
                                        <img
                                            src={nft.metadata.imageUrl}
                                            alt={nft.metadata.name}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            nft.isMinted 
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                        }`}>
                                            {nft.isMinted ? 'Minted' : 'Not Minted'}
                                        </div>
                                    </div>
                                </div>

                                {/* Info/Traits Panel */}
                                <div className="flex flex-col h-full">
                                    {!showTraits ? (
                                        // Info View
                                        <div className="space-y-4">
                                            {typeof nft.metadata.overallRarity === 'number' && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                                        Rarity Ranking
                                                    </h3>
                                                    <div className="mt-2">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className={`text-2xl font-bold ${
                                                                nft.metadata.overallRarity < 1 ? 'text-purple-400' :
                                                                nft.metadata.overallRarity < 5 ? 'text-blue-400' :
                                                                nft.metadata.overallRarity < 15 ? 'text-green-400' :
                                                                'text-gray-400'
                                                            }`}>
                                                                {nft.metadata.overallRarity < 1 ? 'Legendary' :
                                                                 nft.metadata.overallRarity < 5 ? 'Rare' :
                                                                 nft.metadata.overallRarity < 15 ? 'Uncommon' :
                                                                 'Common'}
                                                            </span>
                                                            <span className="text-sm text-gray-400">
                                                                ({nft.metadata.overallRarity}% Occurrence)
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Based on trait combination rarity
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Description</h3>
                                                <p className="mt-2 text-gray-200">{nft.metadata.description}</p>
                                            </div>
                                            {nft.isMinted && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Owner</h3>
                                                    <p className="mt-2 text-gray-200 font-mono text-sm break-all">
                                                        {nft.owner}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Traits View
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-2">
                                                TRAITS
                                            </h3>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {nft.metadata.attributes?.map((attr, index) => (
                                                    <div 
                                                        key={index}
                                                        className="bg-[#1e1f2a] rounded-lg p-2.5 flex justify-between items-start"
                                                    >
                                                        <div>
                                                            <div className="text-gray-500 text-[11px] uppercase leading-tight">
                                                                {attr.trait_type}
                                                            </div>
                                                            <div className="text-white text-[13px] mt-0.5">
                                                                {attr.value}
                                                            </div>
                                                        </div>
                                                        {typeof attr.rarity === 'number' && (
                                                            <div className="text-gray-400 text-[11px] ml-2">
                                                                {attr.rarity}% Occurrence
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 