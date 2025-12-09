## Visión General del Proyecto
- Monorepo con workspaces: `apps/web` (Next.js 14, App Router), `packages/core` (lógica), `packages/ui` (componentes), `packages/database` (SQL Supabase)
- Datos: Supabase (tablas `bookings`, `cabins`, `admin_blocks`, `api_events`)
- Pagos: Integración Flow (Webpay) con rutas API en Next
- Emails: SendGrid para confirmaciones de reserva
- Observabilidad: Sentry
- Deploy: DigitalOcean App Platform con buildpacks y `Procfile`

## Flujo de Reserva y Pago
- Selección en calendario → validación disponibilidad → creación de hold `pending` (+45 min) → página `/pago`
- Crear orden Flow → redirigir a Webpay → retorno a `/pago/confirmacion` + webhook Flow
- Webhook marca `paid/cancelled/rejected` y envía email de confirmación

## Puntos Críticos Identificados
- Políticas de mock inconsistentes en producción:
  - `create` permite mock en prod si `FLOW_ALLOW_MOCK_IN_PROD=true` (apps/web/app/api/payments/flow/create/route.ts:87–117)
  - `webhook` bloquea totalmente mock en prod (apps/web/app/api/payments/flow/webhook/route.ts:22–37)
  - `confirm` también bloquea mock en prod (apps/web/app/api/payments/flow/confirm/route.ts:12–28)
- Webhook público depende de `PUBLIC_EXTERNAL_URL` correcto; si es erróneo, Flow no llega
- Token de Flow puede no estar en el `urlReturn`; la confirmación cliente depende de `sessionStorage` como fallback
- Riesgo de caducidad de hold antes de terminar el pago si el usuario demora
- Reutilización/regeneración de orden controlada por TTL; TTL inadecuado puede confundir al usuario
- Firma HMAC del webhook correcta pero sin `FLOW_WEBHOOK_SECRET` (clave presente en entorno pero no utilizada) puede inducir a error operativo

## Objetivos del Arreglo
- Alinear y endurecer políticas de ejecución entre `create`, `confirm` y `webhook`
- Garantizar recepción y procesamiento estable del webhook en producción
- Mejorar resiliencia del retorno/confirmación cuando falte `token`
- Endurecer validaciones de estado/expiración para evitar reservas atascadas
- Fortalecer observabilidad (eventos y alertas) y pruebas locales/e2e

## Plan de Implementación

### Fase 1: Salud del Entorno y Configuración
- Verificar y documentar variables clave: `PUBLIC_EXTERNAL_URL`, `NEXT_PUBLIC_SITE_URL`, `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_FORCE_MOCK`, `FLOW_ALLOW_MOCK_IN_PROD`
- En App Platform, definir política: producción siempre con Flow real (desactivar `FLOW_FORCE_MOCK`) y sandbox en entornos de pruebas
- Añadir verificación en `check-env` para detectar incoherencias de mock en producción, y mensajes más claros

### Fase 2: Alineación de Políticas Flow
- Homogeneizar lógica en `webhook` para respetar `FLOW_ALLOW_MOCK_IN_PROD` cuando se defina conscientemente; o prohibir mock en prod en todo el stack
- Estandarizar detección de entorno (`NEXT_PUBLIC_SITE_ENV`/`NODE_ENV`) en una utilidad compartida para los tres handlers
- Asegurar que `create` marque error solo cuando realmente no puede crear orden; loguear y devolver pista de remediación

### Fase 3: Robustez del Retorno y Confirmación
- Incluir fallback server-side cuando falte `token`: permitir re-confirmar por `flow_order_id` si existe y está fresco
- Mejorar la página de `confirmación` para manejar casos sin `sessionStorage` y offline
- Exponer `GET /api/payments/flow/status` para diagnóstico en la UI admin con configuración efectiva

### Fase 4: Estabilidad de Holds y Disponibilidad
- Revisar expiración de hold en `create`: si el hold expira en el intento de crear orden, mover a `expired` y guiar al usuario
- Asegurar consistencia de cálculo de disponibilidad ignorando `pending` vencidos (apps/web/app/api/availability/route.ts:122–131, 169–177)
- Verificar que precios (`calculatePrice`) retornan enteros en CLP (packages/core/src/lib/utils/pricing.ts:60–76)

### Fase 5: Seguridad y Firma
- Documentar que la firma usa `FLOW_SECRET_KEY` y retirar `FLOW_WEBHOOK_SECRET` del checklist o implementarlo opcionalmente como firma secundaria
- Validar `Content-Type` entrante del webhook `application/x-www-form-urlencoded` y manejar errores

### Fase 6: Observabilidad y Alertas
- Normalizar eventos `api_events` y severidades para:
  - `flow_payment_error`, `webhook_invalid_signature`, `payment_success`, `payment_cancelled`, `payment_rejected`
- Integrar alertas Sentry con tags de entorno y bookingId
- Añadir endpoint de health `GET /api/payments/flow/webhook` (ya presente) a panel de verificación

### Fase 7: Pruebas Locales y QA
- Local dev con sandbox Flow: configurar claves sandbox y `FLOW_FORCE_MOCK=false`
- Exponer webhook local con `ngrok` usando `PUBLIC_EXTERNAL_URL` temporal
- Pruebas unitarias:
  - Firma HMAC (`FlowClient.sign` y `validateWebhookSignature`) (packages/core/src/lib/flow/client.ts:45–64, 175–191)
  - Transiciones de estado de reserva en handlers (`pending→paid/canceled/rejected`)
- Pruebas e2e:
  - Selección de fechas → hold → `create` → retorno + webhook
  - Caducidad del hold y regeneración de orden con TTL
- Pruebas manuales en staging con sandbox, confirmando correos SendGrid y disponibilidad

### Fase 8: Despliegue y Verificación
- Pipeline: commit → build App Platform → smoke tests `/api/health-lite` y `/api/payments/flow/status`
- Validar webhook en producción con una transacción de prueba (sandbox/real según política)
- Activar alertas de fallo en `payment_error` y firma inválida

## Riesgos y Mitigaciones
- Webhook inaccesible: verificar DNS y `PUBLIC_EXTERNAL_URL`; usar `GET` de health
- Mock en producción: decidir política única y hacerla cumplir transversalmente
- Token ausente en retorno: agregar confirmación por orden y reintentos con backoff
- Concurrencia de reservas: rely en constraints y chequeos de solape; mantener logs

## Entregables y Verificación
- Políticas de entorno corregidas y documentadas
- Handlers de Flow alineados y probados unit/e2e
- Mejoras de confirmación y resiliencia de retorno
- Observabilidad lista con eventos claros y alertas
- Checklist de verificación para producción y staging

## Referencias de Código
- Cliente Flow y firma: `packages/core/src/lib/flow/client.ts:20–25, 45–64, 72–121, 133–169, 175–191, 193–215`
- Crear orden Flow: `apps/web/app/api/payments/flow/create/route.ts:87–117, 189–205, 207–237, 267–273`
- Webhook Flow: `apps/web/app/api/payments/flow/webhook/route.ts:20–37, 39–70, 72–94, 104–137, 157–194`
- Confirmación manual: `apps/web/app/api/payments/flow/confirm/route.ts:12–28, 30–44, 46–60`
- Disponibilidad: `apps/web/app/api/availability/route.ts:61–88, 113–131, 169–177, 209–223`
- Hold de reserva: `apps/web/app/api/bookings/hold/route.ts:106–144, 163–188, 250–261`
- Página pago (cliente): `apps/web/app/pago/PaymentPageClient.tsx:55–100`
- Página confirmación (cliente): `apps/web/app/pago/confirmacion/PaymentConfirmationClient.tsx:60–70, 70–90, 104–108`

## Próximo Paso
- Confirmar la política deseada para mock en producción (recomendado: desactivado) y proceder a implementar las correcciones arriba descritas, con pruebas locales y en staging antes de push a producción.