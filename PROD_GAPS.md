# Gaps antes de producción

## Pagos Flow
- Implementar lógica real en `/api/flow/confirmation`: validar firma (`s`), idempotencia por token/flowOrder y transición de booking a `paid/canceled/rejected` con logging en `api_events`.
- Confirmar que `flowClient.createPayment` siempre devuelva URL con token y que frontend redirija usando esa URL; cubrir retorno con `bookingId` (via `optional` o session) para evitar depender solo del token.
- Proteger/deshabilitar mock gateway en prod; exigir secret en dev.

## Holds y disponibilidad
- Hacer atómico el hold: transacción o RPC que haga check+insert+log para evitar carreras.
- Garantizar expiración de holds en entorno real (cron/trigger ejecutando `/api/jobs/expire-holds` o job en DB).
- En `/pago` y `/pago/confirmacion`, refrescar estado del booking y redirigir según `paid/expired/canceled`.

## Base de datos
- Alinear schema aplicado en prod con migraciones (towels, price_per_extra_person, arrival/departure times).
- Verificar constraint `bookings_no_overlap` y añadir idempotencia por `flow_order_id`/token si falta.

## Emails
- Validar credenciales y dominio verificado en SendGrid; manejar errores de envío sin bloquear la transición a `paid`.
- Revisar plantillas y destinatarios en prod (evitar correos reales en dev).

## Seguridad
- Limpiar claves reales de repositorio y rotarlas antes de prod.
- Fortalecer autenticación admin (hash de password, rate limiting persistente, CSRF/2FA o migrar a proveedor de auth).
- Separar variables públicas (`NEXT_PUBLIC_*`) de las privadas en la configuración de despliegue.

## Observabilidad y CI
- Activar Sentry con DSN y sourcemaps; normalizar eventos en `api_events`.
- Añadir pipeline CI para `pnpm test`, `pnpm lint`, build.

## Documentación y operaciones
- Actualizar documentación de endpoints de pago con `/api/flow/confirmation`.
- Instrucciones claras de `NEXT_PUBLIC_SITE_URL` por entorno (ngrok en dev, dominio en prod) y scheduler de expiración.
