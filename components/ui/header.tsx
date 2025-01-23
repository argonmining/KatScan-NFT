import Link from 'next/link'

export default function Header({ nav = true }: {
  nav?: boolean
}) {
  return (
    <header className="absolute w-full z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Site branding */}
          <div className="shrink-0 mr-4">
            <a 
              href="https://katscan.xyz" 
              className="inline-flex items-center text-blue-500 hover:text-blue-600 font-medium transition duration-150 ease-in-out"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to KatScan
            </a>
          </div>
          {/* Desktop navigation */}
          {nav &&
            <nav className="flex grow">
            </nav>
          }
        </div>
      </div>
    </header>
  )
}
