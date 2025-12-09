import {
  logSentryDisabled,
  resolvePublicDsn,
  shouldInitClientSentry,
} from './lib/sentry/env';

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dsn = resolvePublicDsn();

if (!shouldInitClientSentry || !dsn) {
  logSentryDisabled('client');
} else {
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

  import('@sentry/nextjs')
    .then((SentryModule) => {
      const enableReplay = replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0;
      const replayIntegration =
        enableReplay && typeof (SentryModule as any).replayIntegration === 'function'
          ? (SentryModule as any).replayIntegration()
          : null;

      SentryModule.init({
        dsn,
        enabled: true,
        environment:
          process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.NODE_ENV ?? 'development',
        tracesSampleRate,
        replaysSessionSampleRate,
        replaysOnErrorSampleRate,
        integrations: replayIntegration ? [replayIntegration] : [],
      });
    })
    .catch((error) => {
      console.error('[Sentry] No se pudo inicializar en client:', error);
    });
}


