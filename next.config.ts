import type { NextConfig } from "next";

const CDN_BASE_URL = "https://sbike-scroll.s3.us-east-1.amazonaws.com";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [1, 2, 3, 4, 5].map((i) => ({
          key: "Link",
          value: `<${CDN_BASE_URL}/frames/${i}.webp>; rel=preload; as=image; type=image/webp`,
        })),
      },
    ];
  },
};

export default nextConfig;