interface CollectionFilterProps {
  collections: Array<{
    tick: string;
    count: number;
  }>;
  selectedCollections: Set<string>;
  onChange: (collections: Set<string>) => void;
}

export default function CollectionFilter({ collections, selectedCollections, onChange }: CollectionFilterProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Collections ({collections.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {collections.map(({ tick, count }) => (
          <button
            key={tick}
            onClick={() => {
              const newSelected = new Set(selectedCollections);
              if (newSelected.has(tick)) {
                newSelected.delete(tick);
              } else {
                newSelected.add(tick);
              }
              onChange(newSelected);
            }}
            className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
              selectedCollections.has(tick)
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
          >
            <span className="font-medium truncate">{tick}</span>
            <span className="ml-2 text-sm text-gray-500">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 