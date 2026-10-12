import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Crawlers look for /sitemap.xml first; serve the index of sitemap slices there
  async rewrites() {
    return [{ source: "/sitemap.xml", destination: "/sitemap-index.xml" }];
  },
};

export default nextConfig;
