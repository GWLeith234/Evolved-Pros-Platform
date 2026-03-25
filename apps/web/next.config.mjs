/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: 'image.mux.com' },
    ],
  },
}

export default nextConfig
