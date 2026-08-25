import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 restricts next/image `quality` to an explicit allowlist
    // (default is just [75]). This site uses several custom quality
    // values across sections — list them all so none silently 400.
    qualities: [75, 90, 92, 95, 100],
  },
};

export default nextConfig;
