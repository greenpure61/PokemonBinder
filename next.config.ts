import type { NextConfig } from "next";

// A conservative Content-Security-Policy: it blocks the high-impact, low-risk
// vectors (clickjacking, <base>/​<object> hijacking) without constraining
// script-src/style-src — those need a nonce-based policy (see PRODUCTION.md),
// which the inline styles from framer-motion / recharts / html2canvas make a
// separate, browser-tested effort.
const contentSecurityPolicy = ["base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'"].join("; ");

const securityHeaders = [
  // HSTS is ignored over plain HTTP, so it's a no-op in local dev and only
  // takes effect once served over HTTPS in production.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Card art (TCGdex is the catalog source — see src/lib/pokemontcg.ts).
      { protocol: "https", hostname: "assets.tcgdex.net" },
      // Fallback card art for cards TCGdex has no image for (mostly promos).
      { protocol: "https", hostname: "images.pokemontcg.io" },
      // Google account avatars (NextAuth profile images).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
