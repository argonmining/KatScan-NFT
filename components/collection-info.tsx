import { CollectionInfo as CollectionInfoType } from '@/types/nft'

interface CollectionInfoProps {
  collection: CollectionInfoType;
}

export default function CollectionInfo({ collection }: CollectionInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-8">
      {/* Collection Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-bold text-gray-900">
            {collection.metadata?.name || 
             `${collection.tick} Collection`}
          </h3>
          <p className="text-gray-500 mt-2">
            {collection.metadata?.description || 
             `A collection of ${collection.max} NFTs`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Collection Ticker</div>
          <div className="text-lg font-semibold">{collection.tick}</div>
          <span className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium ${
            collection.state === 'deployed' 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {collection.state}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Supply</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">{collection.minted}</span>
            <span className="text-gray-600 ml-1">/ {collection.max}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Mint Cost</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {collection.royaltyFee 
                ? `${(parseInt(collection.royaltyFee) / 100000000).toFixed(0)}`
                : '0'}
            </span>
            <span className="text-gray-600 ml-1">KAS</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Pre-Minted</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">{collection.premint || '0'}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">DAA Mint Start</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {collection.daaMintStart || '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Deployer Address</div>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm break-all">
            {collection.deployer}
          </div>
        </div>
        
        {collection.royaltyTo && (
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Royalty Recipient</div>
            <div className="bg-gray-50 rounded p-3 font-mono text-sm break-all">
              {collection.royaltyTo}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 