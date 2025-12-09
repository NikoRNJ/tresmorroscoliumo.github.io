const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const disabledRaw = normalize(
  process.env.SENTRY_DISABLED ?? process.env.NEXT_PUBLIC_SENTRY_DISABLED
);

const disabledTokens = new Set(['1', 'true', 'yes', 'on']);

export const isSentryExplicitlyDisabled = disabledTokens.has(disabledRaw);

const serverDsn = (process.env.SENTRY_DSN ?? '').trim();
const publicDsn = (process.env.NEXT_PUBLIC_SENTRY_DSN ?? '').trim();

export const hasServerDsn = Boolean(serverDsn || publicDsn);
export const hasPublicDsn = Boolean(publicDsn);

export const shouldInitServerSentry = hasServerDsn && !isSentryExplicitlyDisabled;
export const shouldInitClientSentry = hasPublicDsn && !isSentryExplicitlyDisabled;

export const resolveServerDsn = () => serverDsn || publicDsn;
export const resolvePublicDsn = () => publicDsn;

export const logSentryDisabled = (target: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(
      `[Sentry] Deshabilitado para ${target}. ` +
        'Define SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN y desactiva SENTRY_DISABLED para habilitarlo.'
    );
  }
};

