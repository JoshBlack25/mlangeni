import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const SUPABASE = "https://hzifwowfenglxigvpalb.supabase.co";

// Content Security Policy. Every origin here is one the browser really talks
// to — add to it when a new third party is introduced, or that feature will be
// blocked (the browser console names the directive that blocked it).
//
// script-src keeps 'unsafe-inline' because the homepage is statically
// prerendered and Next's inline bootstrap scripts can only carry a nonce on
// dynamically rendered pages. Everything else is locked to this origin.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  // Flags in the phone-number field come from the country-flag-icons CDN.
  `img-src 'self' data: blob: ${SUPABASE} https://purecatamphetamine.github.io`,
  `font-src 'self' data:`,
  `media-src 'self'`,
  `connect-src 'self' ${SUPABASE} ${SUPABASE.replace("https://", "wss://")}${isDev ? " ws:" : ""}`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  // The PayFast checkout is a form POST to PayFast's own domain.
  `form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za`,
  `frame-ancestors 'none'`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS only, for two years, once a browser has seen the site over HTTPS.
  // Ignored on plain-http localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  // The default, stated so it is not switched on by accident: production
  // source maps would publish the original source to anyone.
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hzifwowfenglxigvpalb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
