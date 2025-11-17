# 03 · Plan de soluciones priorizadas

Soluciones propuestas para las incidencias del documento 02. Cada acción incluye entregable esperado.

## 1. Bloqueo real de traslapes en reservas (Crítica)
- **Acción**: Reemplazar `idx_bookings_no_overlap` por un `EXCLUDE USING gist` sobre `daterange(start_date, end_date, '[]')` con constraint parcial `WHERE status IN ('pending','paid')`.
- **Pasos**:
  1. Crear migración en `packages/database/migrations/` que elimine el índice actual y añada el constraint `booking_no_overlap`.
  2. En `apps/web/app/api/bookings/hold/route.ts`, envolver la inserción en `supabaseAdmin.rpc` o capturar `SQLSTATE 23P01` del constraint para seguir retornando 409 sin 500.
  3. Añadir prueba de concurrencia en `tests/booking-hold.test.ts`.
- **Resultado**: No habrá doble booking aunque dos holds se creen en paralelo con fechas distintas.

## 2. Normalizar horarios de check-in/out (Alta)
- **Acción**: Agregar columnas `arrival_time` y `departure_time` (tipo `TIME`) en `bookings`.
- **Pasos**:
  1. Migración SQL que añada columnas y backfill con los valores default (15:00 y 12:00).
  2. Actualizar `createBookingHoldSchema` + insert para usar las nuevas columnas en lugar de concatenar en `customer_notes`.
  3. Ajustar `/api/availability` para leer directamente las columnas y eliminar el parser regex.
  4. Mostrar los horarios normalizados en Admin y en correos de confirmación.
- **Resultado**: El calendario siempre mostrará horas consistentes y auditables.

## 3. Reemisión controlada de órdenes Flow (Alta)
- **Acción**: Permitir regenerar tokens cuando el anterior expira.
- **Pasos**:
  1. En `POST /api/payments/flow/create`, si Flow devolvió 409 y `flow_payment_data.createdAt` es mayor a 30 min, limpiar `flow_order_id` y crear una orden nueva.
  2. Registrar evento `flow_payment_regenerated` en `api_events` para trazabilidad.
  3. Informar al usuario en `PaymentPageClient` cuando se reutiliza una orden caducada.
- **Resultado**: Los huéspedes pueden reintentar el pago sin soporte manual.

## 4. Completar o esconder secciones del panel (Media)
- **Acción**: Implementar vistas mínimas para `/admin/cabanas`, `/admin/bloqueos`, `/admin/configuracion` o, si no estarán disponibles en esta iteración, ocultar los enlaces.
- **Pasos**:
  1. Crear páginas que al menos muestren un estado “En construcción” con links al backlog.
  2. Opcional: implementar `/admin/bloqueos` consumiendo `admin_blocks` para crear/eliminar bloqueos.
  3. Actualizar `AdminNav` para render condicional basado en flags.
- **Resultado**: El panel deja de mostrar rutas rotas y gana coherencia en demos.

## 5. Script de limpieza seguro (Media)
- **Acción**: Separar `pnpm clear:bookings` en dos scripts (`clear:bookings` y `clear:blocks`).
- **Pasos**:
  1. Modificar `tools/scripts/clear-bookings.mjs` para limpiar únicamente `bookings` + `api_events`.
  2. Crear `clear-blocks.mjs` independiente con confirmación adicional.
- **Resultado**: Evitamos borrar bloqueos críticos por accidente.

## 6. Hardening de autenticación admin (Media)
- **Acción**: Mover el módulo de auth a `apps/web` o exponerlo como subpath separado, además de añadir rate limiting.
- **Pasos**:
  1. Crear wrapper `@/lib/admin/auth` que use `next/headers` y dejar de exportarlo desde `@tresmorros/core`.
  2. Hash persistente: almacenar `ADMIN_PASSWORD_HASH` y comparar contra `bcrypt.compare`.
  3. Implementar throttling básico (p. ej. Redis, Upstash o Supabase) para limitar intentos por IP.
- **Resultado**: Se elimina el acoplamiento con Next al reutilizar paquetes y se reduce el riesgo de fuerza bruta.

> Ejecutar estas acciones en orden asegura que el front “verde” nunca falle al llegar al pago, que Flow pueda recuperarse solo y que el equipo operativo confíe en el panel.


