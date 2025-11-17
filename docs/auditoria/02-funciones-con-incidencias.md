# 02 · Funciones con incidencias activas

Listado de funciones/sistemas que requieren corrección inmediata. La severidad se ordena de crítica → media.

| # | Área / Archivo | Problema detectado | Impacto |
| --- | --- | --- | --- |
| 1 | Reservas · `packages/database/supabase-schema.sql` (`idx_bookings_no_overlap`) + `apps/web/app/api/bookings/hold/route.ts` | El índice `idx_bookings_no_overlap` sólo evita registros con el mismo `start_date` + `end_date`, pero no impide traslapes parciales entre reservas distintas. El API verifica conflictos antes de insertar, pero no hay bloqueo a nivel DB, por lo que dos holds concurrentes con fechas solapadas pero no idénticas pueden pasar si se crean en paralelo. | **Crítica** · Riesgo real de doble reserva y cobro duplicado. |
| 2 | Reservas · `apps/web/app/api/availability/route.ts` | Las horas de llegada/salida se deducen de `customer_notes` con regex (`Entrada:` / `Salida:`). Es un campo editable por el huésped y no existe columna dedicada, por lo que basta que alguien escriba “Entrada 8 PM” en notas para que el parser falle o muestre datos inconsistentes. | **Alta** · Calendario puede mostrar horarios incorrectos y confundir al personal. |
| 3 | Pagos Flow · `apps/web/app/api/payments/flow/create/route.ts` & `PaymentPageClient` | Cuando Flow ya tiene `flow_order_id`, el endpoint responde 409 y devuelve la URL guardada; si el token original expiró (Flow la invalida tras ~30 min), no hay mecanismo para regenerar una orden sin intervención manual (borrar campos en DB). Los clientes quedan bloqueados aunque el hold siga vigente. | **Alta** · Checkout se atasca y obliga a soporte manual. |
| 4 | Admin · `packages/ui/src/admin/AdminNav.tsx` + rutas `/admin/cabanas`, `/admin/bloqueos`, `/admin/configuracion` | El menú expone secciones inexistentes (las carpetas no tienen `page.tsx`). Hacer clic produce 404 tras pasar por el layout protegido, lo que transmite sensación de panel incompleto. | **Media** · Mala UX para el operador, dificulta demos. |
| 5 | Operaciones · `tools/scripts/clear-bookings.mjs` | El script elimina `admin_blocks` junto con `bookings` y `api_events`. Ejecutarlo para “limpiar reservas” borra también bloqueos de mantenimiento que deberían conservarse. | **Media** · Riesgo de abrir fechas que estaban bloqueadas intencionalmente. |
| 6 | Seguridad admin · `packages/core/src/lib/auth/admin.ts` exportado vía `@tresmorros/core` | El módulo depende de `next/headers` pero se expone en el paquete compartido. Cualquier uso del paquete en scripts o Storybook provocará errores en tiempo de compilación. No hay rate limiting ni hashing independiente (se compara la contraseña en texto plano del `.env`). | **Media** · Riesgo de romper builds externos y debilidad frente a fuerza bruta. |

> Estos puntos están priorizados porque afectan la promesa de “reservas inteligentes”, la experiencia del cliente al pagar y la confianza del administrador al operar el panel.


