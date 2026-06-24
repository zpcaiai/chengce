import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};
export default nextConfig;
