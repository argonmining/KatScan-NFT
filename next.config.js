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
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  }
}

module.exports = nextConfig
