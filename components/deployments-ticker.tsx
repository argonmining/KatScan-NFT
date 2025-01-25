'use client'

import { useEffect, useState, useRef } from 'react'
import { ArrowRight } from 'lucide-react'

interface Deployment {
  tick: string;
  max: string;
  mtsAdd: string;
  deployer: string;
}

interface DeploymentsTickerProps {
  onTickerClick: (tick: string) => void;
}

export default function DeploymentsTicker({ onTickerClick }: DeploymentsTickerProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const response = await fetch('/api/krc721/deployments');
        const data = await response.json();
        if (data.result) {
          setDeployments(data.result);
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
      }
    };

    fetchDeployments();
    // Fetch every 30 seconds
    const interval = setInterval(fetchDeployments, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-transparent to-gray-50 pointer-events-none z-10" />
      
      {/* Ticker content */}
      <div className="py-4 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex space-x-8 animate-scroll whitespace-nowrap"
        >
          <div className="flex space-x-8 items-center min-w-full">
            <span className="font-medium flex items-center text-gray-500 pl-2">
              <ArrowRight className="w-4 h-4 mr-2" />
              Latest
            </span>
            {deployments.map((deployment, index) => (
              <button
                key={`${deployment.tick}-${deployment.mtsAdd}`}
                onClick={() => onTickerClick(deployment.tick)}
                className="group flex items-center space-x-3 hover:bg-blue-500 hover:text-white px-4 py-1.5 rounded-full transition-all duration-200"
              >
                <span className="font-mono text-sm font-medium text-gray-900 group-hover:text-white">
                  {deployment.tick}
                </span>
                <div className="flex items-center space-x-3 border-l border-gray-200 pl-3 group-hover:border-blue-400">
                  <span className="text-xs text-gray-500 group-hover:text-blue-100">
                    {`Count: ${deployment.max}`}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-blue-100">
                    {new Date(parseInt(deployment.mtsAdd)).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 