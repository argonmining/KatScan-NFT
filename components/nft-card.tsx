'use client'

import { useState } from 'react'
import Image from 'next/image'
import { NFTDisplay } from '@/types/nft'

interface NFTCardProps {
    nft: NFTDisplay;
}

export default function NFTCard({ nft }: NFTCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Debug log to see what we're getting
    console.log('NFT metadata:', nft.metadata);
    console.log('Image URL:', nft.metadata?.imageUrl);

    return (
        <div className="flip-card">
            <div className="flip-card-inner relative">
                {/* Front */}
                <div className="flip-card-front relative">
                    <div className="relative">
                        {nft.metadata?.imageUrl ? (
                            <Image
                                className={`w-full rounded-lg ${isLoading ? 'blur-sm' : ''}`}
                                src={nft.metadata.imageUrl}
                                width={400}
                                height={400}
                                alt={nft.metadata.name}
                                onLoadingComplete={() => setIsLoading(false)}
                                onError={() => {
                                    setIsLoading(false);
                                    setImageError(true);
                                }}
                                style={{ display: 'block' }}
                            />
                        ) : (
                            <Image
                                className={`w-full rounded-lg ${isLoading ? 'blur-sm' : ''}`}
                                src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${nft.metadata?.image?.replace('ipfs://', '')}.png`}
                                width={400}
                                height={400}
                                alt={nft.metadata?.name || 'NFT'}
                                onLoadingComplete={() => setIsLoading(false)}
                                onError={() => {
                                    setIsLoading(false);
                                    setImageError(true);
                                }}
                                style={{ display: 'block' }}
                            />
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white rounded-b-lg">
                            <h3 className="font-semibold text-sm truncate">
                                {nft.metadata?.name || `${nft.tick} #${nft.id}`}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div className="flip-card-back absolute top-0 left-0 w-full h-full">
                    {nft.metadata?.attributes && (
                        <div className="grid grid-cols-2 gap-2 p-3 overflow-y-auto max-h-full text-xs">
                            {nft.metadata.attributes.map((attr, index) => (
                                <div key={index} className="bg-gray-700/50 rounded p-1.5">
                                    <p className="font-medium text-gray-300 truncate">{attr.trait_type}</p>
                                    <p className="text-white truncate">{attr.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 