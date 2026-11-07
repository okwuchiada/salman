import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  images: {
    // Sanity image CDN. No `search` key, so Sanity's transform params (?w=…) are allowed.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/izshu8iy/**" }],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
