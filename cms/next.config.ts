import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Pin explicitly: this app is nested inside the shop.tumirathumela.com
  // repo but deploys independently; its own lockfile makes Next.js misinfer
  // a shared monorepo workspace root (the parent) otherwise.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.tumirathumela.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
