import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes read the register and enrichment cache from public/data at
  // runtime, which serverless bundles don't include unless traced explicitly
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/data/**/*"],
    "/": ["./public/data/**/*"],
  },
};

export default nextConfig;
