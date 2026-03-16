/** @type {import('next').NextConfig} */
// Yerel: .env.local + npm run dev (veya npm run dev:clean ile cache temiz başlatma)
// Production (www.nabz-ai.com): Vercel env + Git deploy; her deploy temiz build.
const nextConfig = {
  // Geliştirmede cache bozulması (chunk 404, pack.gz ENOENT) yaşanırsa: npm run dev:clean
  experimental: {
    // Geliştirme sırasında webpack cache bazen bozuluyor; optimizePackageImports ile yük hafifler
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
