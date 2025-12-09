# 01 · Funciones y sistemas implementados

Inventario funcional agrupado por dominio. Cada entrada incluye la ruta principal y las dependencias clave.

## 1. Reservas y disponibilidad
- `apps/web/app/api/availability/route.ts` · Calcula disponibilidad mensual por cabaña cruzando `bookings` (pending/paid) y `admin_blocks`, genera marcadores de llegada/salida y expone `occupancy`. Depende de `supabaseAdmin`, `availabilityQuerySchema` y `getDatesBetween`.
- `packages/core/src/lib/hooks/useAvailability.ts` · Hook cliente que consume `/api/availability`, gestiona loading/errors y expone `arrivals`/`departures` para el UI.
- `packages/ui/src/booking/AvailabilityCalendar.tsx` · Calendario de dos meses con validaciones de mínimo 1 noche, reacomodo de rangos si hay conflictos y etiquetas AM/PM para check-in/out.
- `packages/ui/src/booking/BookingWizard.tsx` · Orquesta el flujo en tres pasos (fechas → personas → datos), controla estados y reinicia el proceso ante `DATES_UNAVAILABLE`.
- `packages/ui/src/booking/BookingForm.tsx` · Formulario completo con validación Zod, reconfirmación de disponibilidad (`ensureDatesStillAvailable`), conversión 12 h↔24 h de horarios, selector de jacuzzi y extras como toallas/eventos.
- `packages/ui/src/booking/JacuzziSelector.tsx` · Permite seleccionar días específicos de jacuzzi dentro del rango.
- `packages/ui/src/booking/BookingSummary.tsx` · Muestra desglose de noches, extras y total a pagar.
- `packages/core/src/lib/utils/pricing.ts` (`calculatePrice`, `formatPriceBreakdown`, `getIncludedGuests`) · Motor de precios que considera noches, personas extra, jacuzzi y toallas.
- `packages/core/src/lib/validations/booking.ts` · Schemas y helpers (`availabilityQuerySchema`, `createBookingHoldSchema`, `validateJacuzziDays`, `getDatesBetween`) para validar inputs y fechas.
- `apps/web/app/api/bookings/hold/route.ts` · Endpoint crítico que valida capacidad, bloqueos, conflictos y crea holds de 45 min con cálculo de precio y logging en `api_events`.
- `packages/core/src/lib/data/bookings.ts` (`getBookingWithMeta`) · Devuelve reservas con cabin join + metadatos (`isExpired`, `timeRemaining`) para pago y confirmación.

## 2. Flujo de pagos (Flow / Webpay)
- `packages/core/src/lib/flow/client.ts` · Cliente singleton con firma HMAC, modos mock/live, creación de pagos (`createPayment`), consulta de estado (`getPaymentStatus`) y validación de webhooks (`validateWebhookSignature`).
- `apps/web/app/api/payments/flow/create/route.ts` · Valida booking, reusa Flow tokens existentes, crea órdenes nuevas, guarda `flow_order_id`, marca pago como `paid` en modo mock y registra eventos.
- `apps/web/app/api/payments/flow/webhook/route.ts` · Entrada oficial de Flow. Valida firma, consulta estado, actualiza booking (`paid`/`canceled`), dispara `sendBookingConfirmationForBooking` y loggea `api_events`.
- `apps/web/app/api/payments/flow/confirm/route.ts` · Endpoint manual utilizado por `PaymentConfirmationClient` para forzar verificación cuando Flow demora; actualiza estado y registra eventos.
- `apps/web/app/api/payments/flow/status/route.ts` · Health-check de credenciales Flow expuesto para monitoreo.
- `apps/web/app/pago/PaymentPageClient.tsx` · Página interactiva que muestra cuenta regresiva del hold, crea la orden en Flow y gestiona errores/reintentos.
- `apps/web/app/pago/confirmacion/PaymentConfirmationClient.tsx` · Hace polling hasta 10 veces contra `/api/bookings/[id]`, fuerza confirmación manual y muestra estado final (paid/canceled/pending/error).

## 3. Emails y comunicación
- `packages/core/src/lib/email/client.ts` (`EmailClient`) · Wrapper lazy sobre SendGrid (`emailClient`) con modo mock cuando faltan claves.
- `packages/core/src/lib/email/service.ts` · Servicio de alto nivel (`sendBookingConfirmation`, `sendBookingConfirmationForBooking`) que arma el template, invoca SendGrid y registra `api_events`.
- `apps/web/app/api/contact/route.ts` · Recibe mensajes del formulario, reenvía al correo configurado y guarda el resultado en `api_events`.
- `apps/web/app/api/events/special/route.ts` · Endpoint para eventos especiales (aniversarios, etc.) que dispara correo interno y logging.

## 4. Panel administrativo y autenticación
- `packages/core/src/lib/auth/admin.ts` (`verifyAdminPassword`, `createAdminSession`, `isAdminAuthenticated`, `requireAdmin`, `destroyAdminSession`) · Sistema básico de login basado en cookie firmada con HMAC.
- `apps/web/app/api/admin/login/logout/route.ts` · APIs que consumen los helpers anteriores y registran los intentos en `api_events`.
- `apps/web/app/admin/layout.tsx` + `AdminNav` · Restringen acceso al panel y muestran navegación con enlaces a Dashboard/Reservas/etc.
- `apps/web/app/admin/page.tsx` · Dashboard con métricas del mes (ingresos, reservas, ocupación) y próximas llegadas.
- `apps/web/app/admin/reservas/*.tsx` · Listado y detalle de reservas con filtros por estado y link a cada booking.

## 5. Scripts y herramientas operativas
- `tools/scripts/clear-bookings.mjs` · Limpia tablas `api_events`, `admin_blocks` y `bookings` usando service role (útil para resetear calendario).
- `tools/scripts/check-env.mjs` · Verifica presencia de variables críticas antes de build/deploy.
- `tools/scripts/export-minimal.mjs` · Empaqueta el sistema esencial en `dist/deployable` para crear un repo limpio.
- `pnpm test` / `pnpm test:e2e` · Vitest unitario y e2e (con `vitest.e2e.config.ts` y `FLOW_FORCE_MOCK=true`).

## 6. Observabilidad y despliegue
- `apps/web/app/api/health` y `health-lite` · Proveen endpoints de monitoreo rápido/lento para App Platform.
- `deploy/README.md`, `.do/app.yaml`, `Procfile` · Automatizan builds en DigitalOcean App Platform o servidores propios.

> Este inventario cubre la funcionalidad efectiva actualmente desplegada en DigitalOcean. Cualquier nuevo servicio debería reutilizar estos módulos antes de crear lógica duplicada.


