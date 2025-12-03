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
  logSentryDisabled('server');
} else {
  const tracesSampleRate = parseNumber(
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    0.1
  );
  const profilesSampleRate = parseNumber(
    process.env.SENTRY_PROFILES_SAMPLE_RATE,
    0.1
  );

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        enabled: true,
        environment:
          process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.NODE_ENV ?? 'development',
        tracesSampleRate,
        profilesSampleRate,
        sendDefaultPii: false,
        maxBreadcrumbs: 50,
      });
    })
    .catch((error) => {
      console.error('[Sentry] No se pudo inicializar en server:', error);
    });
}