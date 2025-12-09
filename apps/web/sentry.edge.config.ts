import {
  logSentryDisabled,
  resolveServerDsn,
  shouldInitServerSentry,
} from './lib/sentry/env';

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dsn = resolveServerDsn();

if (!shouldInitServerSentry || !dsn) {
  logSentryDisabled('edge');
} else {
  const tracesSampleRate = parseNumber(
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    0.1
  );

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        enabled: true,
        tracesSampleRate,
        environment:
          process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.NODE_ENV ?? 'development',
      });
    })
    .catch((error) => {
      console.error('[Sentry] No se pudo inicializar en edge:', error);
    });
}


