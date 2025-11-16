## Objetivos y Alcance

* Corregir bugs y problemas detectados, elevar la calidad del código y verificar la lógica de todas las funciones críticas.

* Asegurar que los flujos: disponibilidad → hold → pago → confirmación → administración funcionen sin solapamientos ni estados inconsistentes.

* Entregar pruebas automatizadas (unitarias, integración y E2E) y documentación técnica de verificación.

## Inventario y Auditoría Inicial

* Levantar inventario de endpoints y componentes clave con sus ubicaciones:

  * Disponibilidad: `app/api/availability/route.ts`

  * Holds/Reservas: `app/api/bookings/hold/route.ts`, `app/api/bookings/[id]/route.ts`

  * Pagos Flow: `app/api/payments/flow/create/route.ts`, `app/api/payments/flow/webhook/route.ts`, `lib/flow/client.ts`

  * Emails confirmación: `lib/email/service.ts`, `lib/email/templates/booking-confirmation.ts`

  * Pricing y utilidades: `lib/utils/pricing.ts`, `lib/validations/booking.ts`, `lib/utils/format.ts`

  * Administración: `app/admin/page.tsx`, `app/admin/reservas/page.tsx`, `app/admin/reservas/[id]/page.tsx`

  * Supabase clientes: `lib/supabase/server.ts`, `lib/supabase/client.ts`

* Auditoría de dependencias y versiones:

  * Actualidad: Next 14.2.18 (EOL), React 18, Supabase JS 2.81.x, Zod 4.1.x, Tailwind 3.4.1.

  * Proponer plan de migración a Next 16 (LTS) y React 19; evaluar Tailwind v4.

* Revisar variables de entorno y secretos: `.env.example` (incluir `ADMIN_PASSWORD`), `FLOW_*`, `SENDGRID_*`, `CRON_SECRET`.

## Mapeo de Arquitectura y Flujos

* Flujo usuario: Home (`app/page.tsx`) → detalle cabaña (`app/cabanas/[slug]/page.tsx`) → wizard (`components/booking/BookingWizard.tsx`) → hold (`/api/bookings/hold`) → pago (`/api/payments/flow/create`) → confirmación (`/api/payments/flow/webhook`) → página de confirmación (`app/pago/confirmacion/page.tsx`).

* Flujo admin: login (`app/api/admin/login/route.ts`) → dashboard (`app/admin/page.tsx`) → reservas (`app/admin/reservas/page.tsx`) → detalle (`app/admin/reservas/[id]/page.tsx`).

* Datos: `cabins`, `bookings`, `admin_blocks`, `api_events`; índices y constraints en `supabase-schema.sql`.

## Revisión Lógica Función por Función

* Disponibilidad (`app/api/availability/route.ts:27`):

  * Validación de query (Zod) y cálculo del rango mensual.

  * Consulta de reservas `pending|paid` y bloqueos admin; categorización de días.

  * Verificación de no incluir días fuera del mes; consistencia con `getDatesBetween` (`lib/validations/booking.ts:91`).

* Crear Hold (`app/api/bookings/hold/route.ts:36`):

  * Validación de capacidad y jacuzziDays (`lib/validations/booking.ts:71`).

  * Detección de solapamientos: pagadas siempre conflictivas; `pending` solo si `expires_at` > now.

  * Bloqueos admin y pricing (`lib/utils/pricing.ts:32`), set de `expires_at` (+20 min) y logging `api_events`.

  * Verificar condición `.or(and(start_date.lt.endDate,end_date.gt.startDate))` contra casos borde.

* Estado de Reserva (`app/api/bookings/[id]/route.ts:18`):

  * Enriquecimiento con `isExpired` y `timeRemaining`; exactitud de cálculo y casos igualdad.

* Crear Pago (`app/api/payments/flow/create/route.ts:34`):

  * Guardas: reserva existe, `status=pending`, no expiró, no duplicar `flow_order_id`.

  * Modo mock si Flow no configurado; actualización de booking y logging.

* Webhook Flow (`app/api/payments/flow/webhook/route.ts:19`):

  * Validación de firma HMAC, consulta de estado (`lib/flow/client.ts:133`).

  * Transiciones de estado: PAID (update + email + `confirmation_sent_at`), REJECTED, CANCELLED, PENDING.

  * Manejo de errores y registros en `api_events`.

* Emails (`lib/email/service.ts:18` y `lib/email/templates/booking-confirmation.ts:8`):

  * Plantilla y texto coherentes; asegurar no exponer secretos; robustez ante fallo de SendGrid.

* Pricing (`lib/utils/pricing.ts:32`):

  * `differenceInDays` (mínimo 1 noche), `includedGuests` (`getIncludedGuests`: `lib/utils/pricing.ts:89`).

  * Casos borde: misma fecha con check-out al día siguiente, partySize límites, jacuzziDays.

* Admin Métricas (`app/admin/page.tsx:23`):

  * Cálculo ingresos, reservas del mes, próximas llegadas, ocupación; revisar filtros y joins.

## Plan de Pruebas Automatizadas

* Unitarias (Vitest):

  * `pricing.ts`: cálculos de noches, extras, jacuzzi, `includedGuests`.

  * `validations/booking.ts`: `availabilityQuerySchema`, `createBookingHoldSchema`, `validateJacuzziDays`, `getDatesBetween`.

  * `format.ts`: formatos de precio y fechas.

* Integración (Node/Next test runner + Supabase stub):

  * `GET /api/availability`: matrices de estados por mes con fixtures.

  * `POST /api/bookings/hold`: crear hold y rechazar solapamientos; casos `expired` vs `pending`.

  * `POST /api/payments/flow/create`: guardas de expiración y `flow_order_id` existente.

  * `POST /api/payments/flow/webhook`: simular PAID/REJECTED/CANCELLED/PENDING y verificar actualizaciones y logs.

  * `GET /api/bookings/[id]`: tiempos restantes y expiración.

* E2E (Playwright):

  * Flujo completo: seleccionar fechas → personas → formulario → hold → pago mock → confirmación.

  * Verificaciones UI y estados en `pago/page.tsx` y `pago/confirmacion/page.tsx`.

* Observabilidad:

  * Asserts sobre `api_events` para cada evento esperado.

## Correcciones y Mejoras Prioritarias

* Migraciones:

  * Next 16 + React 19: revisar `next.config.mjs` (proxy.ts/middleware cambios, Cache Components), compatibilidades y deprecaciones.

  * Tailwind v4: migrar config y clases; usar herramienta oficial.

* Seguridad y entorno:

  * Añadir `ADMIN_PASSWORD` a `.env.example` y guías; validar no exponer service role.

  * Revisar `CRON_SECRET` y firma de webhook.

* Limpieza:

  * Retirar `@vitejs/plugin-react` si no se usa; alinear Playwright/Vitest con suites reales.

* UX/Accesibilidad:

  * Mensajes de error consistentes; labels y contraste en componentes.

## Entregables

* Informe técnico con hallazgos y lista de bugs corregidos.

* Suite de pruebas (unitarias, integración, E2E) con cobertura de flujos críticos.

* Plan y notas de migración Next/Tailwind.

* Documentación actualizada (README estado del proyecto, `.env.example`).

## Cronograma Tentativo

* Semana 1: Auditoría, mapeo y plan de pruebas; triage de bugs.

* Semana 2: Implementación de pruebas unitarias e integración; correcciones lógicas.

* Semana 3: E2E, mejoras de seguridad/entorno; quick wins (CSV, galería, bloqueos UI) si aplica.

* Semana 4: Migración Next/Tailwind (si se aprueba), QA/regresión y documentación.

## Criterios de Aceptación

* Todas las pruebas pasan y cubren los casos borde.

* No hay solapamientos de reservas y los estados se actualizan correctamente en pagos/webhooks.

* Logging en `api_events` refleja los eventos sin errores.

* Documentación coherente y entorno seguro.

## Riesgos y Mitigación

* Migración Next/Tailwind: ejecutar en rama aparte con pruebas exhaustivas antes de merge.

* Integraciones externas (Flow/SendGrid): usar modo mock en tests y validaciones de firma.

## Siguiente Paso

* Tras tu confirmación, ejecutamos la fase de auditoría y pruebas (Semana 1) y te compartimos un informe inicial con el backlog priorizado de correcciones y mejoras.

