import { CollectionInfo as CollectionInfoType } from '@/types/nft'
import Image from 'next/image'
import { useState } from 'react'
import { 
    FaTwitter, FaDiscord, FaTelegram, FaYoutube, FaTiktok,
    FaFacebook, FaInstagram, FaMedium, FaLinkedin, FaTwitch,
    FaReddit, FaGithub, FaGlobe
} from 'react-icons/fa'

interface CollectionInfoProps {
  collection: CollectionInfoType;
}

export default function CollectionInfo({ collection }: CollectionInfoProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const metadata = collection.collectionMetadata;
  const videoFile = metadata?.properties.files.find(f => f.type === 'video/mp4');
  const mintedCount = parseInt(collection.minted);
  const totalSupply = parseInt(collection.max);
  const progress = (mintedCount / totalSupply) * 100;

  // Helper function to convert IPFS URLs
  const getProperUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    return ipfsUrl.replace(/^ipfs:\/+/, '/api/ipfs/');
  };

  // Add placeholder image component
  const PlaceholderImage = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-center p-6">
        <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 font-medium">No collection image available</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Image and Video */}
        <div className="w-full md:w-1/3 min-h-[300px] md:min-h-[400px]">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-50">
            {metadata?.image ? (
              <>
                <Image
                  src={metadata.image.startsWith('ipfs://') 
                    ? `/api/ipfs/${metadata.image.replace('ipfs://', '')}`
                    : metadata.image}
                  alt={metadata.name}
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {videoFile && (
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg 
                      hover:bg-black/80 backdrop-blur-sm transition-all duration-200 
                      flex items-center gap-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    Play Video
                  </button>
                )}
              </>
            ) : (
              <PlaceholderImage />
            )}
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {metadata?.name || `${collection.tick} Collection`}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  {collection.tick}
                </span>
              </div>
              <p className="text-gray-600 line-clamp-2">
                {metadata?.description || `A collection of ${collection.max} NFTs`}
              </p>
            </div>
            <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
              collection.state === 'deployed' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {collection.state}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">Minting Progress</span>
              <span className="text-sm font-medium text-gray-600">
                {mintedCount.toLocaleString()} / {totalSupply.toLocaleString()} ({progress.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Mint Cost</div>
              <div className="text-xl font-bold text-gray-900">
                {collection.royaltyFee 
                  ? `${(parseInt(collection.royaltyFee) / 100000000).toFixed(0)} KAS`
                  : 'Free'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Pre-Minted</div>
              <div className="text-xl font-bold text-gray-900">
                {parseInt(collection.premint || '0') > 0 
                  ? collection.premint 
                  : 'Fair Launch'}
              </div>
            </div>
          </div>

          {/* Royalty Recipient */}
          {collection.royaltyTo && (
            <div className="mb-8">
              <div className="text-sm font-medium text-gray-500 mb-2">Royalty Recipient</div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4">
                <a 
                  href={`https://kas.fyi/address/${collection.royaltyTo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-gray-600 hover:text-blue-600 break-all transition-colors"
                >
                  {collection.royaltyTo}
                </a>
                <button 
                  onClick={() => collection.royaltyTo && navigator.clipboard.writeText(collection.royaltyTo)}
                  className="shrink-0 text-blue-500 hover:text-blue-600 transition-colors"
                  title="Copy address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Social Links */}
          {metadata?.extensions && (
            <div className="flex gap-3 flex-wrap">
              {Object.entries(metadata.extensions).map(([key, value]) => {
                if (!value) return null;
                return (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors duration-200"
                  >
                    {getSocialIcon(key)}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && videoFile && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white 
                transition-colors duration-200 text-sm font-medium flex items-center gap-2"
            >
              <span>Close</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              controls
              autoPlay
              className="w-full rounded-xl shadow-2xl"
              src={getProperUrl(videoFile.uri)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

function getSocialIcon(platform: string) {
  const iconProps = { className: "w-6 h-6" };
  switch (platform) {
    case 'twitter': return <FaTwitter {...iconProps} />;
    case 'discord': return <FaDiscord {...iconProps} />;
    case 'telegram': return <FaTelegram {...iconProps} />;
    case 'youtube': return <FaYoutube {...iconProps} />;
    case 'tiktok': return <FaTiktok {...iconProps} />;
    case 'facebook': return <FaFacebook {...iconProps} />;
    case 'instagram': return <FaInstagram {...iconProps} />;
    case 'medium': return <FaMedium {...iconProps} />;
    case 'linkedin': return <FaLinkedin {...iconProps} />;
    case 'twitch': return <FaTwitch {...iconProps} />;
    case 'reddit': return <FaReddit {...iconProps} />;
    case 'github': return <FaGithub {...iconProps} />;
    case 'website': return <FaGlobe {...iconProps} />;
    default: return null;
  }
} 