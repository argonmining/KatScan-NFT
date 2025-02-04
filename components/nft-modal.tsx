'use client'

import { useState, useEffect } from 'react'
import { NFTDisplay } from '@/types/nft'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface NFTModalProps {
    nft: NFTDisplay;
    isOpen: boolean;
    onCloseAction: () => Promise<void>;
}

export default function NFTModal({ nft, isOpen, onCloseAction }: NFTModalProps) {
    const [showTraits, setShowTraits] = useState(false);
    const [ownerStatus, setOwnerStatus] = useState<string | null>(null);
    const [isLoadingOwner, setIsLoadingOwner] = useState(false);
    const [owners, setOwners] = useState<string[]>([]);
    const [isLoadingOwners, setIsLoadingOwners] = useState(false);

    // Load owner information when modal opens
    useEffect(() => {
        async function loadOwnerData() {
            if (!isOpen || ownerStatus) return;
            
            setIsLoadingOwner(true);
            try {
                const ownerResponse = await fetch(`/api/krc721/nfts/${nft.tick}/token/${nft.id}`);
                if (ownerResponse.ok) {
                    const ownerData = await ownerResponse.json();
                    setOwnerStatus(ownerData.result?.owner || null);
                }
            } catch (error) {
                console.error('Failed to load owner data:', error);
            } finally {
                setIsLoadingOwner(false);
            }
        }

        loadOwnerData();
    }, [isOpen, nft.id, nft.tick, ownerStatus]);

    useEffect(() => {
        async function fetchOwners() {
            if (!isOpen) return; // Only fetch when modal is opened
            
            setIsLoadingOwners(true);
            try {
                const response = await fetch(`/api/nft/${nft.tick}/${nft.id}/owners`);
                if (response.ok) {
                    const data = await response.json();
                    setOwners(data.owners);
                }
            } catch (error) {
                console.error('Error fetching owners:', error);
            } finally {
                setIsLoadingOwners(false);
            }
        }

        fetchOwners();
    }, [isOpen, nft.tick, nft.id]); // Only re-fetch when modal opens or NFT changes

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
            
            {/* Modal content */}
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
                                                                (nft.metadata.overallRarity || 100) < 1 ? 'text-red-600' :      // Mythic (Crimson)
                                                                (nft.metadata.overallRarity || 100) < 5 ? 'text-amber-400' :    // Legendary (Yellow/Gold)
                                                                (nft.metadata.overallRarity || 100) < 15 ? 'text-purple-400' :  // Epic (Purple)
                                                                (nft.metadata.overallRarity || 100) < 35 ? 'text-blue-400' :    // Rare (Blue)
                                                                (nft.metadata.overallRarity || 100) < 60 ? 'text-teal-400' :    // Uncommon (Teal)
                                                                'text-gray-400'                                                  // Common (Grey)
                                                            }`}>
                                                                {(nft.metadata.overallRarity || 100) < 1 ? 'Mythic' :
                                                                 (nft.metadata.overallRarity || 100) < 5 ? 'Legendary' :
                                                                 (nft.metadata.overallRarity || 100) < 15 ? 'Epic' :
                                                                 (nft.metadata.overallRarity || 100) < 35 ? 'Rare' :
                                                                 (nft.metadata.overallRarity || 100) < 60 ? 'Uncommon' :
                                                                 'Common'}
                                                            </span>
                                                            <span className="text-sm text-gray-400">
                                                                ({nft.metadata.overallRarity}%)
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
                                                                {attr.rarity}%
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

                        {/* Update owner display section */}
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                            <div className="mt-1">
                                {isLoadingOwner ? (
                                    <div className="animate-pulse h-6 bg-gray-200 rounded w-48" />
                                ) : ownerStatus ? (
                                    <a
                                        href={`https://kas.fyi/address/${ownerStatus}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-600 break-all"
                                    >
                                        {ownerStatus}
                                    </a>
                                ) : (
                                    <span className="text-gray-500">Not available</span>
                                )}
                            </div>
                        </div>

                        {isLoadingOwners ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        ) : (
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-white mb-2">Owners</h3>
                                <div className="space-y-2">
                                    {owners.map((owner, index) => (
                                        <div key={index} className="text-gray-400 text-sm">
                                            {owner}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 