import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Allow file uploads up to 100 MB through the proxy (middleware).
    // Default is 10 MB which truncates large multipart bodies silently.
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
