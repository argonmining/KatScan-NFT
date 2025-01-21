'use client'

import { useState, useRef, useEffect } from 'react'
import { Network, krc721Api } from '@/api/krc721'

interface NetworkSelectorProps {
    onNetworkChange?: (network: Network) => void;
}

export default function NetworkSelector({ onNetworkChange }: NetworkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedNetwork, setSelectedNetwork] = useState<Network>(krc721Api.getNetwork())
    const dropdownRef = useRef<HTMLDivElement>(null)

    const networks: { id: Network; label: string }[] = [
        { id: 'mainnet', label: 'Mainnet' },
        { id: 'testnet-10', label: 'Testnet 10' },
        { id: 'testnet-11', label: 'Testnet 11' },
    ]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNetworkChange = (network: Network) => {
        setSelectedNetwork(network)
        krc721Api.setNetwork(network)
        onNetworkChange?.(network)
        setIsOpen(false)
    }

    return (
        <select
            className="block rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            defaultValue="testnet-10"
        >
            <option value="testnet-10">Testnet 10</option>
            <option value="mainnet" disabled>Mainnet (Coming Soon)</option>
        </select>
    )
} 