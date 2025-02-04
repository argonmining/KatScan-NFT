'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { NFTDisplay, TraitFilter, FilterState } from '@/types/nft'

interface NFTFiltersProps {
    nfts: NFTDisplay[];
    selectedFilters: FilterState;
    onFilterToggleAction: (trait_type: string, value: string) => void;
    onResetAction: () => void;
}

export default function NFTFilters({ 
    nfts, 
    selectedFilters, 
    onFilterToggleAction, 
    onResetAction 
}: NFTFiltersProps) {
    const availableTraits = useMemo(() => {
        const traits: { trait_type: string; values: Set<string> }[] = [];
        const traitMap = new Map<string, Set<string>>();

        nfts.forEach(nft => {
            nft.metadata?.attributes?.forEach(attr => {
                if (!traitMap.has(attr.trait_type)) {
                    traitMap.set(attr.trait_type, new Set());
                }
                traitMap.get(attr.trait_type)?.add(attr.value);
            });
        });

        traitMap.forEach((values, trait_type) => {
            traits.push({ trait_type, values });
        });

        return traits;
    }, [nfts]);

    if (availableTraits.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                {Object.keys(selectedFilters).length > 0 && (
                    <button 
                        onClick={onResetAction}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        Reset All
                    </button>
                )}
            </div>
            {availableTraits.map(({ trait_type, values }) => (
                <div key={trait_type} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-300">{trait_type}</h4>
                        {selectedFilters[trait_type] && (
                            <span className="text-xs text-gray-500">
                                {selectedFilters[trait_type].size} selected
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(values).map(value => (
                            <button
                                key={value}
                                onClick={() => onFilterToggleAction(trait_type, value)}
                                className={`px-3 py-1 rounded-full text-sm ${
                                    selectedFilters[trait_type]?.has(value)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                }`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
} 