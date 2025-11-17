#!/usr/bin/env node
import process from 'node:process';

const normalize = (value) => String(value ?? '').trim();
const isTruthy = (value) => normalize(value).length > 0;

const shouldSkip = ['1', 'true', 'yes'].includes(
  normalize(process.env.CHECK_ENV_SKIP).toLowerCase()
);

if (shouldSkip) {
  process.exit(0);
}

const needsRealFlow =
  normalize(process.env.FLOW_FORCE_MOCK).toLowerCase() !== 'true';

const requiredKeys = [
  { key: 'NEXT_PUBLIC_SITE_URL', label: 'URL pública del sitio (SEO & links)' },
  { key: 'PUBLIC_EXTERNAL_URL', label: 'URL pública usada en callbacks (Flow, emails)' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL pública' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role key' },
  { key: 'SENDGRID_API_KEY', label: 'API Key de SendGrid' },
  { key: 'SENDGRID_FROM_EMAIL', label: 'Remitente (email) para SendGrid' },
  { key: 'SENDGRID_FROM_NAME', label: 'Remitente (nombre) para SendGrid' },
];

const flowKeys = [
  { key: 'FLOW_API_KEY', label: 'Flow API Key' },
  { key: 'FLOW_SECRET_KEY', label: 'Flow Secret Key' },
  { key: 'FLOW_BASE_URL', label: 'Flow Base URL (sandbox o producción)' },
  { key: 'FLOW_WEBHOOK_SECRET', label: 'Secret interno para validar webhooks de Flow' },
];

const optionalKeys = [
  { key: 'SENTRY_DSN', label: 'Sentry DSN (recomendado en producción)' },
  { key: 'NEXT_PUBLIC_SENTRY_DSN', label: 'Sentry DSN público para Replay' },
  { key: 'SENTRY_AUTH_TOKEN', label: 'Token para subir sourcemaps' },
  { key: 'SENTRY_ORG', label: 'Identificador de la organización en Sentry' },
  { key: 'SENTRY_PROJECT', label: 'Proyecto en Sentry' },
];

const missing = [];

const track = ({ key, label }) => {
  if (!isTruthy(process.env[key])) {
    missing.push({ key, label });
  }
};

requiredKeys.forEach(track);
if (needsRealFlow) {
  flowKeys.forEach(track);
}

if (missing.length > 0) {
  console.error('❌ Variables de entorno obligatorias faltantes:\n');
  missing.forEach(({ key, label }) => {
    console.error(`  - ${key}: ${label}`);
  });
  console.error(
    '\nDefine estas variables en tu `.env` local o en App Platform antes de volver a ejecutar `pnpm build`.'
  );
  console.error(
    'Consulta `env/example.env` o la documentación en `docs/technical/observability.md` para más contexto.'
  );
  process.exit(1);
}

const missingOptionals = optionalKeys
  .filter(({ key }) => !isTruthy(process.env[key]))
  .map(({ key, label }) => ({ key, label }));

if (missingOptionals.length > 0) {
  console.warn('⚠️ Variables opcionales ausentes (recomendado configurarlas):');
  missingOptionals.forEach(({ key, label }) => {
    console.warn(`  - ${key}: ${label}`);
  });
}

console.log('✅ Variables críticas presentes. Continuando con el build...');


