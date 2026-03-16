/** @type {import('next').NextConfig} */
// Yerel: .env.local + npm run dev:clean. Production: Vercel env + deploy.
// Tüm asset ve API yolları ana dizinden (/) – basePath/assetPrefix yok.
const nextConfig = {
  // basePath ve assetPrefix yok; chunk/static yolları her zaman /_next/... ile root'tan
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
