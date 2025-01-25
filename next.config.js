/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'w3s.link',
      'cloudflare-ipfs.com',
      'ipfs.io',
      'gateway.pinata.cloud'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/krc721/:path*',
        destination: '/api/krc721/:path*',
      }
    ]
  }
}

module.exports = nextConfig
