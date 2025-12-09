import {
  logSentryDisabled,
  shouldInitServerSentry,
} from './lib/sentry/env';

export async function register() {
  if (!shouldInitServerSentry) {
    logSentryDisabled(process.env.NEXT_RUNTIME === 'edge' ? 'edge runtime' : 'node runtime');
    return;
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  } else {
    await import('./sentry.server.config');
  }
}


