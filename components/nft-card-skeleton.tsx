export default function NFTCardSkeleton() {
    return (
        <div className="relative group">
            {/* Card wrapper with aspect ratio */}
            <div className="relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" 
                    style={{ backgroundSize: '200% 100%' }}
                />
            </div>

            {/* Metadata skeleton */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                <div className="space-y-2">
                    {/* Title skeleton */}
                    <div className="h-4 bg-gray-200/20 rounded w-3/4 animate-pulse" />
                    
                    {/* Description skeleton */}
                    <div className="h-3 bg-gray-300/20 rounded w-1/2 animate-pulse" />
                    
                    {/* Attributes grid skeleton */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/10 rounded-md p-1.5 space-y-1">
                                <div className="h-2 bg-gray-200/20 rounded w-1/2 animate-pulse" />
                                <div className="h-2 bg-gray-300/20 rounded w-3/4 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
} 