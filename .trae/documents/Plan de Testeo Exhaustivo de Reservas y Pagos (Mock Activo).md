## Objetivo

Validar de forma exhaustiva la lógica de reservas por cabaña y el flujo de pago con Flow en entorno de desarrollo con mock activo. Detectar y documentar cualquier bug o inconsistencia y proponer correcciones concretas.

## Preparación

* Verificar entorno:

  * `GET /api/payments/flow/status` debe mostrar `configured=false`, `forceMock=true`.

  * `.env.local` con `NEXT_PUBLIC_SITE_URL=http://localhost:3000` y `FLOW_FORCE_MOCK=true`.

* Confirmar build y arranque: `npm run dev` (ya corriendo) y salud: `GET /api/health-lite`.

## Inventario de Endpoints y Fuentes

* `GET /api/cabins` → app/api/cabins/route.ts

* `GET /api/availability` → app/api/availability/route.ts

* `POST /api/bookings/hold` → app/api/bookings/hold/route.ts

* `GET /api/bookings/[id]` → app/api/bookings/\[id]/route.ts

* `POST /api/payments/flow/create` → app/api/payments/flow/create/route.ts

* `POST /api/payments/flow/confirm` → app/api/payments/flow/confirm/route.ts (dev/token)

* `POST /api/events/special` → app/api/events/special/route.ts

* `POST /api/contact` → app/api/contact/route.ts

* Cron: `POST /api/jobs/expire-holds` con `x-cron-secret`

* UI clave:

  * Calendario: `components/booking/AvailabilityCalendar.tsx`

  * Formulario: `components/booking/BookingForm.tsx`

  * Pago: `app/pago/page.tsx`, Confirmación: `app/pago/confirmacion/page.tsx`

## Matriz de Pruebas (por cabaña)

1. Disponibilidad mensual y detección de días no disponibles.
2. Selección de rango que cruza bloqueos → ajuste automático a subrango continuo válido (1–2 noches) en el calendario.
3. Creación de hold (45 minutos) con horas de entrada/salida obligatorias y extras (toallas/jacuzzi).
4. Pago mock:

   * Crear orden → `paymentUrl` interna.

   * Estado `paid` y envío de correos.
5. Conflicto posterior:

   * Intentar reservar sobre los mismos días → backend 409; UI debe impedir antes.
6. Expiración:

   * Forzar expiración (simulando el paso del tiempo) → estado `expired` (410 en pago).
7. Eventos y contacto:

   * `POST /api/events/special` y `POST /api/contact` validan datos y registran en `api_events`.

## Procedimiento de Ejecución (Consola/HTTP)

* Paso A: Catalogar cabañas

  * `GET /api/cabins` → obtener `id` y `slug` de las 3 cabañas.

* Paso B: Disponibilidad

  * Para mes actual y siguiente: `GET /api/availability?cabinId=<id>&year=<YYYY>&month=<M>`.

  * Identificar `available`, `pending`, `booked`, `blocked`.

* Paso C: Selección con conflicto (UI)

  * En cada cabaña, seleccionar un rango que cruce días no disponibles.

  * Validar que el calendario ajuste automáticamente a un subrango continuo válido (mensaje y nueva selección mostrada) antes de avanzar.

* Paso D: Crear hold

  * `POST /api/bookings/hold` con cuerpo:

    * `{ cabinId, startDate, endDate, partySize, jacuzziDays, towelsCount, arrivalTime, departureTime, customerName, customerEmail, customerPhone }`.

  * Esperado: `201` y `expiresAt ≈ now + 45min`.

* Paso E: Pago mock

  * `POST /api/payments/flow/create` con `{ bookingId }` → `200` y `paymentUrl` interna.

  * `GET /api/bookings/[id]` → `status=paid`.

* Paso F: Emails

  * Verificar envío de confirmación (SendGrid), con horas de entrada/salida y extras.

* Paso G: Conflictos

  * Intentar nuevo `POST /api/bookings/hold` sobre los mismos días → backend `409`; UI debe evitarlo previamente.

* Paso H: Expiración (opcional)

  * Simular expiración (espera/cron) → `POST /api/jobs/expire-holds` con `x-cron-secret`.

## Casos Límite y Regresiones

* Selección de un único día → 1 noche por defecto.

* Rangos demasiado largos (>30 noches) → rechazo en validación.

* `arrivalTime`/`departureTime` faltantes → rechazo del hold.

* `jacuzziDays` fuera del rango → rechazo.

* Contacto/evento especial datos inválidos → `400` con `issues`.

## Observabilidad y Logs

* Monitorizar consola del servidor durante las acciones:

  * Pagos: `flow_payment_created`, `flow_payment_mock_paid`, errores de Flow si no configurado.

  * Holds: `booking_hold_created`, expiración.

  * Emails: `email_sent_confirmation` / `email_error_confirmation`.

* Confirmar `api_events` en Supabase con metadatos de cada operación.

## Criterios de Aceptación

* UI nunca permite avanzar con rangos que incluyan días no disponibles; ajuste automático realizado.

* Holds de 45 minutos creados con horas obligatorias.

* Pagos mock confirman `paid`; correos enviados con horas/extras.

* Backend protege contra conflictos y expiraciones; UI previene los conflictos antes de pago.

## Correcciones (si aparecen fallos)

* Calendario (selección inteligente): `components/booking/AvailabilityCalendar.tsx` → verificación de `disabledSet` y cálculo de `segments` (ya implementado); refinar heurística si el “mejor” segmento no se alinea con la intención del usuario.

* Disponibilidad: `app/api/availability/route.ts:68` solapamiento `or(and(start_date.lt.end, end_date.gt.start))` correcto.

* Hold: `app/api/bookings/hold/route.ts` → detección de conflictos en `pending/paid`, expiración (45 min), persistencia de horas en `customer_notes`.

* Pago: `app/api/payments/flow/create/route.ts` → mock/live; mostrar `error` detallado en 500.

* Email confirmación: `lib/email/templates/booking-confirmation.ts` → incluir horas entrada/salida.

* Confirmación por token/webhook: parse de `customer_notes` para horas y extras.

## Entregables

* Informe de resultados por cabaña y endpoint: estados, tiempos y evidencias luego de solucionarlos.

* Lista de bugs con severidad y acciones correctivas y ejecutar la solucion perfectamente.

* Validación de comportamiento del calendario (capturas/observaciones) y lógica de backend luego de haber implementado una logica profesional de doctorado de alto nivel.

> Si confirmas este plan, ejecuto las pruebas en mock primero (tres cabañas) y luego sandbox con token, reportando todo con evidencias y aplicando correcciones necesarias donde corresponda.

