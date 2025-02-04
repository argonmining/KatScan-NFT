'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { NFTDisplay } from '@/types/nft'
import NFTModal from './nft-modal'
import NFTCardSkeleton from './nft-card-skeleton'

interface NFTCardProps {
    nft: NFTDisplay;
    loadMetadata?: boolean;
}

export default function NFTCard({ nft, loadMetadata = false }: NFTCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageHeight, setImageHeight] = useState<number>(0);
    const [metadata, setMetadata] = useState(nft.metadata);
    const [isLoading, setIsLoading] = useState(false);

    const handleCloseAction = async () => {
        setIsModalOpen(false);
    };

    // Add image load handler to get natural dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;
        const aspectRatio = (img.naturalHeight / img.naturalWidth) * 100;
        setImageHeight(aspectRatio);
    };

    useEffect(() => {
        async function loadNFTData() {
            if (!loadMetadata || metadata) return;
            
            setIsLoading(true);
            try {
                // Only load metadata when card becomes visible
                const metadataResponse = await fetch(`/api/ipfs/${nft.tick}/${nft.id}`);

                if (metadataResponse.ok) {
                    const newMetadata = await metadataResponse.json();
                    setMetadata(newMetadata);
                }
            } catch (error) {
                console.error('Failed to load NFT metadata:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadNFTData();
    }, [loadMetadata, nft.id, nft.tick, metadata]);

    // Show loading skeleton while fetching data
    if (isLoading) {
        return <NFTCardSkeleton />;
    }

    return (
        <>
            <div 
                className="flip-card w-full cursor-pointer"
                style={{ paddingBottom: `${imageHeight}%` }} // Dynamic padding based on image
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flip-card-inner absolute inset-0">
                    {/* Front of card */}
                    <div className="flip-card-front absolute w-full h-full">
                        {nft.metadata.imageUrl && (
                            <div className="relative w-full h-full group">
                                {/* Decorative frame */}
                                <div className="absolute inset-0 rounded-lg border-4 border-gray-800 shadow-lg bg-gray-900">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img
                                            src={nft.metadata.imageUrl}
                                            alt={nft.metadata.name}
                                            className="rounded-md w-full h-full object-contain"
                                            onLoad={handleImageLoad}
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
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent rounded-b-lg">
                                    <h3 className="text-white font-semibold truncate">
                                        {nft.metadata.name}
                                    </h3>
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

            <NFTModal 
                nft={nft}
                isOpen={isModalOpen}
                onCloseAction={handleCloseAction}
            />
        </>
    )
} 