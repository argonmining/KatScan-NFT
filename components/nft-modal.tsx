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
                                <div className="flex gap-2 sm:gap-4">
                                    <button
                                        onClick={() => setShowTraits(!showTraits)}
                                        className="text-gray-400 hover:text-white transition-colors p-2"
                                    >
                                        <ArrowPathIcon className="h-5 w-5 sm:h-6 sm:w-6" />
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
                                            <h3 className="text-sm font-medium text-gray-400 mb-3">
                                                ATTRIBUTES
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {nft.metadata.attributes?.map((attr, index) => (
                                                    <div 
                                                        key={index}
                                                        className="bg-[#1e1f2a] rounded-lg p-2.5"
                                                    >
                                                        <div className="text-gray-500 text-xs uppercase">
                                                            {attr.trait_type}
                                                        </div>
                                                        <div className="flex justify-between items-baseline mt-0.5">
                                                            <span className="text-white text-sm">
                                                                {attr.value}
                                                            </span>
                                                            {attr.rarity && (
                                                                <span className="text-gray-400 text-xs">
                                                                    {attr.rarity}%
                                                                </span>
                                                            )}
                                                        </div>
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