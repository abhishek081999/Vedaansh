import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow native addons like sweph
      config.externals = [...(config.externals || []), 'sweph', 'better-sqlite3']
    }
    return config
  },

  cacheMaxMemorySize: 0, // Disable ISR memory cache to prevent OOM
  serverExternalPackages: ['sweph'],
  experimental: {
    // Reduce Webpack workers to prevent OOM on memory-constrained platforms like Render Free Tier
    cpus: 1,
    memoryBasedWorkersCount: true,
  },
  transpilePackages: ['next-auth', 'remotion', '@remotion/player'],

  // Block open remote image optimizer SSRF (GHSA-9g9p-9gw9-jx7f)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Permanent redirects
  async redirects() {
    return [
      {
        source:      '/asrology',
        destination: '/',
        permanent:   true,
      },
      {
        source:      '/asrology/:path*',
        destination: '/',
        permanent:   true,
      },
      {
        source:      '/astrology',
        destination: '/',
        permanent:   true,
      },
      {
        source:      '/astrology/:path*',
        destination: '/',
        permanent:   true,
      },
      {
        source:      '/home',
        destination: '/',
        permanent:   true,
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)

