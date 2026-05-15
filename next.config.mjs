/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/eerr",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
