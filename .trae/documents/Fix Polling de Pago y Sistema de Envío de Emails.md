## Problemas Detectados
- Polling de pago: la página de confirmación queda en “Intento 1 de 10” sin avanzar; causa probable:
  - Llamadas fetch a `/api/bookings/:id` y `/api/payments/flow/confirm` desde el cliente sin cabecera `ngrok-skip-browser-warning`, devolviendo HTML de ngrok y rompiendo el ciclo.
  - En algunos casos, ausencia de `token` en retorno y sesión; aunque se agregó fallback server-side, el cliente puede no conseguir el estado si las llamadas son bloqueadas por ngrok.
- Envío de emails (SendGrid): formulario de contacto falla con “No se pudo enviar el mensaje”; causas probables:
  - `SENDGRID_API_KEY` y/o `SENDGRID_FROM_EMAIL`/`SENDGRID_FROM_NAME` no configurados (cliente entra en modo mock y retorna `SENDGRID_NOT_CONFIGURED`).
  - Credenciales invalidas o errores de red; ruta de contacto retorna 500 si `emailClient.send(...)` falla.

## Solución Propuesta

### A. Fix del Polling de Webpay (Confirmación de Pago)
1. Añadir cabecera `ngrok-skip-browser-warning: true` en los fetch del cliente (PaymentConfirmationClient):
   - `POST /api/payments/flow/confirm` y `GET /api/bookings/:id`.
   - Esto evita que ngrok devuelva una página HTML en lugar de JSON cuando navegamos por la URL pública.
2. Añadir timeout por llamada (AbortController) para evitar bloqueos; incrementar intentos ante timeout.
3. Mejorar fallback de token:
   - Mantener confirmación manual inicial con `token` de `sessionStorage` y, si no existe, usar el `token` persistido en `flow_payment_data` (ya implementado en servidor).
4. Asegurar reintentos cada 3s y que el contador avance siempre, con manejo de errores robusto.

### B. Sistema de Envío de Mensajes (SendGrid)
1. Validar y asegurar credenciales en entorno:
   - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` deben estar presentes y válidos.
   - En dev, permitir testeos con API key real o detectar modo mock y mostrar mensaje claro en UI.
2. Mejorar la ruta de contacto `POST /api/contact`:
   - Capturar y registrar el error detallado del cliente SendGrid en `api_events`.
   - Retornar códigos de error más específicos (`SENDGRID_NOT_CONFIGURED`, `SENDGRID_SEND_FAILED`) para informar al usuario y depurar.
3. Añadir reintentos y backoff ya existentes, pero exponer en respuesta el número de intentos y el `messageId` si éxito.
4. Agregar test unitario para `emailClient` (mock de sgMail) y prueba de la ruta de contacto.

### C. Verificación y Pruebas
1. Local con ngrok:
   - Confirmar que la página `/pago/confirmacion` avanza de 1→10 intentos y marca `paid`.
   - Probar `GET /api/bookings/:id` desde navegador (sin cabecera) y desde fetch con cabecera, verificando respuesta JSON.
2. SendGrid:
   - Ejecutar envío del formulario de contacto; validar en logs y recepción.
   - Si se usa mock, mostrar mensaje amigable indicando “entorno de pruebas”.
3. Flow sandbox real (opcional tras fix):
   - Desactivar mock, usar email permitido por Flow para crear la orden.
   - Validar webhook `POST /api/payments/flow/webhook` y que la reserva pase a `paid` vía evento.

## Cambios Específicos en Código
- `apps/web/app/pago/confirmacion/PaymentConfirmationClient.tsx`:
  - Añadir `headers: { 'ngrok-skip-browser-warning': 'true' }` a ambos fetch.
  - Incorporar `AbortController` con timeout (ej. 5s) y manejo de cancelación para avanzar intentos.
  - Asegurar incremento de `attempts` en todos los caminos (éxito parcial, error, timeout).
- `apps/web/app/api/contact/route.ts`:
  - Propagar `mailResult.error` (código específico) en la respuesta.
  - Mantener `api_events` con detalle del error; agregar `attempts` y `messageId` si éxito.
- Tests:
  - Añadir prueba para `emailClient.send` en modo configurado/mode mock.
  - Añadir prueba para polling (unitario pequeño simulando aumento de `attempts`).

## Entorno y Configuración
- Dev: usar `ngrok` y cabecera de skip en cliente, mantener `FLOW_FORCE_MOCK=true` para flujo UI.
- Producción/Staging: credenciales SendGrid reales, `FLOW_FORCE_MOCK=false`, `FLOW_BASE_URL` correcto, `PUBLIC_EXTERNAL_URL` público.

## Entregables
- Fix de polling en confirmación con ngrok.
- Sistema de envío de mensajes con errores manejados y envío funcionando.
- Pruebas y validaciones realizadas.

¿Confirmas que avance con estos cambios? Tras aplicar, validamos juntos en la URL pública y con el formulario de contacto.