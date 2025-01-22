/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'chocolate-select-beetle-364.mypinata.cloud',
      'gateway.pinata.cloud',
      'ipfs.io',
      'w3s.link',
      'cf-ipfs.com',
      'gateway.ipfs.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/krc721/:path*',
        destination: '/api/krc721/:path*',
      },
    ]
  }
}

module.exports = nextConfig
