import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const tracesSampleRate = parseNumber(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE,
  0.1
);
const replaysSessionSampleRate = parseNumber(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  0
);
const replaysOnErrorSampleRate = parseNumber(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  1
);

const enableReplay = replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0;
const replayIntegration =
  enableReplay && typeof (Sentry as typeof Sentry & { replayIntegration?: () => any }).replayIntegration === 'function'
    ? (Sentry as typeof Sentry & { replayIntegration: () => any }).replayIntegration()
    : null;

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate,
  replaysSessionSampleRate,
  replaysOnErrorSampleRate,
  integrations: replayIntegration ? [replayIntegration] : [],
});


