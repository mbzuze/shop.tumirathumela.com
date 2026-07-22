import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Pin explicitly: /cms is a separate, independently-deployed Next app
  // nested in this repo, and its own lockfile makes Next.js misinfer a
  // shared monorepo workspace root otherwise.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
      },
      {
        protocol: "https",
        hostname: "admin.tumirathumela.com",
        port: "",
      },
    ]
  }
};

export default nextConfig;
