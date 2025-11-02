import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de imágenes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "emrgqbrqnqpbkrpruwts.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compresión de assets
  compress: true,

  // React optimizations
  reactStrictMode: true,

  // Poweredby header removal (seguridad)
  poweredByHeader: false,

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        // Assets estáticos de KeyShot - caché agresivo
        source: "/keyshotAssets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JavaScript estático - caché agresivo
        source: "/js/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Headers de seguridad para todas las rutas
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Experimental features para mejor performance
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr"],
    serverActions: {
      bodySizeLimit: "2mb", // Límite aumentado a 2MB (por defecto es 1MB)
    },
  },
};

export default nextConfig;
