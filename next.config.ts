import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/second-campus",
        assetPrefix: "/second-campus/",
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
