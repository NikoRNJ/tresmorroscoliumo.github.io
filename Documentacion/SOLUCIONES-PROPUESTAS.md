# Soluciones Propuestas

Plan de acción para cada bug detectado. Las tareas incluyen referencias de archivo y consideraciones técnicas adicionales.

## 1. Ajustar el Wizard de Reservas
- **Acción**: inicializar `partySize` con `initialPartySize` y mostrar el mínimo real derivado de `getIncludedGuests`.  
  - Editar `components/booking/BookingWizard.tsx` (líneas 25-33) para que `useState(initialPartySize)` y actualizar el copy “Mínimo X personas” con ese valor.  
  - Añadir una prueba manual: seleccionar una cabaña cuyo `capacity_base` ≠ 2.

## 2. Reanudar órdenes de Flow y validar mock
- **Reutilizar órdenes existentes**:  
  - En `app/api/payments/flow/create/route.ts:84-105`, si `flow_order_id` existe, devolver también `booking.flow_payment_data?.url` y `token` para que el frontend pueda redirigir.  
  - En `app/pago/page.tsx`, detectar el error 409 y, si llega `paymentUrl`, abrirlo automáticamente o mostrar un botón “Volver a Webpay”.
- **Enviar confirmaciones en modo mock**:  
  - Después de marcar la reserva `paid` en modo sandbox (mismo archivo, líneas 95-128), invocar `sendBookingConfirmation()` reutilizando la misma lógica que usa el webhook o, alternativamente, simular un llamado interno al endpoint del webhook con un payload mínimo.

## 3. Sanear el Panel de Administración
- **Navegación segura**:  
  - Mientras no existan páginas reales, reemplazar los links a `/admin/cabanas`, `/admin/bloqueos`, `/admin/configuracion` por placeholders deshabilitados o por mensajes “Próximamente” (`components/admin/AdminNav.tsx:15-20`).  
  - Crear tareas de backlog para dichas secciones y documentarlas en `Plan.md` o similar.
- **Variables de entorno documentadas**:  
  - Añadir `ADMIN_PASSWORD=` al bloque de seguridad de `.env.example` y mencionarlo en `README.md` / `COMO-VER-EL-PROYECTO.md`.  
  - Opcional: hacer que `verifyAdminPassword` arroje un error claro en vez de solo un `console.warn` cuando la variable no esté definida en entornos `development`.

## 4. Habilitar el Formulario de Contacto
- **Implementar `/api/contact`**:  
  - Crear `app/api/contact/route.ts` con un `POST` que valide los campos, envíe un email vía `sendBookingConfirmation` (adaptado) o registre la consulta en una nueva tabla `contact_messages`.  
  - Actualizar `components/forms/ContactForm.tsx` para mostrar mensajes de éxito reales y loggear errores descriptivos.

## 5. Validar expiraciones de hold
- (Opcional pero recomendado) Programar el endpoint `POST /api/jobs/expire-holds` con un cron real (GitHub Actions, CronJob en DO App Platform) usando `CRON_SECRET`. Documentar el procedimiento en `README.md`.

Implementar estas acciones deja la experiencia de reserva/pago redonda, evita enlaces rotos en el panel y vuelve operativo el embudo de contacto.
