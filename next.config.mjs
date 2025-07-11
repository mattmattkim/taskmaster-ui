/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enhanced development experience
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Enable fast refresh for better hot reload
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve hot reload performance
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      }
      
      // Enable fast refresh
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-refresh/runtime': require.resolve('react-refresh/runtime'),
      }
    }
    return config
  },

  // Optimize for development
  env: {
    FAST_REFRESH: 'true',
  },
}
 
export default nextConfig 