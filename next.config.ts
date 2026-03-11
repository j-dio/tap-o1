import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/dashboard/timeline",
        destination: "/dashboard/calendar",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
