import type { NextConfig } from "next";

// Served from https://<user>.github.io/global-melt-belt/ — GitHub Pages has
// no way to serve project pages from the domain root, so every asset path
// needs the repo name prefixed. Set via the deploy workflow; empty locally.
const REPO_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: REPO_BASE_PATH,
  assetPrefix: REPO_BASE_PATH,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
