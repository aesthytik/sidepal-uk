import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      ...["/api/:path*", "/ingest/:path*", "/data/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
        ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
        : []),
    ];
  },
  // Crawlers look for /sitemap.xml first; serve the index of sitemap slices there
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/sitemap-index.xml" },
      // PostHog reverse proxy, so analytics isn't blocked as a third-party domain
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // PostHog API paths use trailing slashes
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
