/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
<<<<<<< HEAD
  output: 'export',          // enables static export
=======
  // output: 'export',          // enables static export
>>>>>>> feature/docker-setup
  trailingSlash: true        // optional, useful for S3
};

// ✅ Use ONLY ESM export (no module.exports in .mjs)
export default nextConfig;
