'use client'

import { useState } from 'react'
import Image from 'next/image'
import { NFTDisplay } from '@/types/nft'

interface NFTCardProps {
    nft: NFTDisplay;
}

export default function NFTCard({ nft }: NFTCardProps) {
    return (
        <div className="relative group">
            <div className="relative">
                {nft.metadata.imageUrl && (
                    <Image
                        src={nft.metadata.imageUrl}
                        alt={nft.metadata.name}
                        width={300}
                        height={300}
                        className="rounded-lg"
                    />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-semibold">{nft.metadata.name}</h3>
                    {nft.isMinted ? (
                        <p className="text-white/80 text-sm truncate">
                            Owner: {nft.owner}
                        </p>
                    ) : (
                        <p className="text-white/80 text-sm">
                            Not minted yet
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
} 