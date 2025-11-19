import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tfztguqsdeolxxskumjg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // OPTIMIZACIONES DE RENDIMIENTO PARA DESARROLLO
  reactStrictMode: true,

  // Experimental: Pre-compilar rutas comunes
  experimental: {
    optimizePackageImports: ['@sendgrid/mail', 'date-fns', 'react-day-picker'],
  },
  transpilePackages: ['@tresmorros/ui', '@tresmorros/core'],
  output: 'standalone',

  async headers() {
    return [
      // Regla general (sin X-Frame-Options para permitir retorno desde Flow)
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'ngrok-skip-browser-warning', value: 'true' },
        ],
      },
      // Permitir que Flow/Webpay emboquen la página de retorno si su flujo lo requiere
      {
        source: '/pago/confirmacion',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' https: data: blob:; " +
              "script-src 'self' 'unsafe-eval' https:; " +
              "style-src 'self' 'unsafe-inline' https:; " +
              "img-src 'self' https: data: blob:; " +
              "connect-src 'self' https:; " +
              "frame-ancestors 'self' https://*.flow.cl https://flow.cl https://*.webpay.cl https://webpay.cl"
          },
          { key: 'ngrok-skip-browser-warning', value: 'true' },
        ],
      },
      {
        source: '/pago/:path*',
        headers: [
          { key: 'ngrok-skip-browser-warning', value: 'true' },
        ],
      },
    ]
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
};

const sentryBuildOptions = {
  hideSourceMaps: true,
};

const normalize = (value) => (value ?? '').trim().toLowerCase();
const sentryDisabledTokens = new Set(['1', 'true', 'yes', 'on']);
const forcedSentryDisabled = sentryDisabledTokens.has(
  normalize(process.env.SENTRY_DISABLED ?? process.env.NEXT_PUBLIC_SENTRY_DISABLED)
);
const hasSentryDsn =
  Boolean((process.env.SENTRY_DSN ?? '').trim()) ||
  Boolean((process.env.NEXT_PUBLIC_SENTRY_DSN ?? '').trim());

const enableSentry = hasSentryDsn && !forcedSentryDisabled;

if (!enableSentry && process.env.NODE_ENV !== 'production') {
  console.info('[Sentry] Integración de build deshabilitada (faltan DSN o SENTRY_DISABLED=true).');
}

export default enableSentry
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryBuildOptions)
  : nextConfig;
