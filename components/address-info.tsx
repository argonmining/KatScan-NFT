interface AddressInfoProps {
  address: string;
  totalNFTs: number;
  collections: string[];
}

export default function AddressInfo({ address, totalNFTs, collections }: AddressInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Address Overview</h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-mono text-sm break-all">{address}</span>
            <button onClick={() => navigator.clipboard.writeText(address)} className="text-blue-500 hover:text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total NFTs</div>
            <div className="text-xl font-bold">{totalNFTs}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Collections</div>
            <div className="text-xl font-bold">{collections.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 