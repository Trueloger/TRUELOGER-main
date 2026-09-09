import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin/auth (used by src/lib/auth/verify-request.ts for
  // every protected API route) pulls in jwks-rsa -> jose, a
  // dual-ESM/CJS package pair that Vercel's serverless bundler fails
  // to interop correctly when bundled inline — every protected route
  // 500'd in production with "ERR_REQUIRE_ESM: require() of ES Module
  // .../jose/dist/webapi/index.js ... not supported" despite building
  // and running cleanly locally (`next build` + `next start`), because
  // Vercel's actual serverless runtime bundles differently than a
  // local `next start`. Marking these external makes Next.js resolve
  // them directly from node_modules at runtime instead of bundling
  // them, which sidesteps the interop failure entirely.
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
  images: {
    // Next 16 restricts next/image `quality` to an explicit allowlist
    // (default is just [75]). This site uses several custom quality
    // values across sections — list them all so none silently 400.
    qualities: [75, 90, 92, 95, 100],
    // Site imagery is hosted in Firebase Storage (public GCS objects
    // under site-images/, mirroring the old public/ paths) rather than
    // bundled locally — see scripts/upload-images-to-firebase.mjs.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/trueloger-d4432.firebasestorage.app/site-images/**",
      },
    ],
  },
};

export default nextConfig;
