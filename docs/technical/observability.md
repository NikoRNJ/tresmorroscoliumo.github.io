# Observabilidad y Contención Operativa

Este documento resume los mecanismos habilitados para monitorear `tresmorroscoliumo.cl` y cómo responder ante incidentes. Actualízalo cada vez que se agreguen nuevas herramientas de monitoreo.

## 1. Recolección de logs en tiempo real

- **DigitalOcean App Platform**  
  ```powershell
  doctl apps logs --app tres-morros-app --type build --type run --tail
  ```
  Usa `--type deploy` para revisar problemas de despliegue y `--no-follow` cuando solo necesites un snapshot.
- **Persistencia**: exporta sesiones críticas a almacenamiento seguro (`doctl apps logs ... > logs-YYYYMMDD.txt`) para análisis posterior.

## 1.1 Verificación previa al build

- Ejecuta `pnpm check:env` antes de `pnpm build`.  
  - El script (`tools/scripts/check-env.mjs`) falla si faltan variables críticas (Supabase, Flow, SendGrid, URLs públicas).  
  - Variables opcionales (Sentry) solo generan advertencias.  
  - Usa `CHECK_ENV_SKIP=true pnpm build` únicamente en entornos controlados (no recomendado para producción).

## 2. Instrumentación con Sentry

- Se integró `@sentry/nextjs` en la app (`sentry.client/server/edge.config.ts`).  
- Configura las siguientes variables en App Platform (Build y Run):
  - `SENTRY_DSN` (también copiar en `NEXT_PUBLIC_SENTRY_DSN` si quieres exponerlo a Replay).
  - `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (0.1 recomendado).
  - Opcional: `SENTRY_PROFILES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`.
- Para subir sourcemaps, define variables solo en **build time**:
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Releases: usa `SENTRY_RELEASE` o exporta `GIT_COMMIT_SHA`. Se propaga automáticamente a Sentry y al endpoint `health-lite`.

## 3. Health checks

- `GET /api/health-lite`: responde rápido sin tocar la base de datos y entrega `uptime`, `release`, `region` y `environment`. Configurado para monitoreos cada 30 s.
- `GET /api/health`: realiza una consulta real a Supabase. Úsalo en consultas menos frecuentes (p. ej. cada 5 min) para validar conectividad de base de datos.
- Ambos responden con `Cache-Control: no-store` para que los monitores siempre obtengan datos frescos.

## 4. Dashboard y alertas sugeridas

- **Panel de errores**: En Sentry, crea alertas por tasa de errores > 5 % y por eventos de tipo `payment_*`.
- **Métricas de disponibilidad**: UptimeRobot / Better Stack con tres monitors:
  1. `https://tresmorroscoliumo.cl/api/health-lite` (30 s, tiempo de respuesta).
  2. `https://tresmorroscoliumo.cl/api/health` (5 min, DB reachability).
  3. `https://tresmorroscoliumo.cl` (HTTP básico desde otra región).
- **Registros de pagos**: crea una consulta programada en Supabase (`api_events` donde `event_type` como `'payment_*'`) y envía resumen diario a Slack/Email.

## 5. Procedimiento ante incidentes

1. Revisar monitores → confirmar alerta (Sentry, UptimeRobot, logs DO).
2. Capturar contexto (`doctl apps logs --tail --since 10m`).
3. Registrar en `docs/business/incidents.md` (pendiente de crear) con tiempo, causa y mitigación.
4. Abrir issue en GitHub y vincular commit de corrección.

Mantén esta guía actualizada para que cualquier integrante pueda ejecutar la fase 0 en minutos.


