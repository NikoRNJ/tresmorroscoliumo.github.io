<!-- 85e54f6c-e01a-4bc3-a489-373a4349c381 09f45090-cb6b-4952-89d9-c274f4b728ea -->
# Plan para blindar reservas, pagos y UI

1. Auditar las respuestas que provocan `Unexpected token '<'…`

- Capturar qué endpoint devuelve HTML al refrescar disponibilidad o crear el pago (`/api/availability`, `/api/bookings/hold`, `/api/payments/flow/create`).
- Revisar logs (`api_events`, consola Next) para entender si hay 500/502 o timeouts.

2. Corregir la lógica de reserva y pago

- Endurecer `useAvailability`, `BookingForm` y las rutas API para evitar respuestas cacheadas/obsoletas, manejar errores de red y mostrar mensajes claros.
- Revisar el pipeline Flow (creación + webhook) para asegurarse de que no devuelva HTML por credenciales o redirecciones.

3. Ajustar UI del calendario

- Corregir el overflow de las etiquetas “Llegan/Se retiran” para que la celda no se deforme.
- Validar que los estados visuales del calendario coincidan con la data y que no se permita avanzar con días ya tomados.

4. Validación end-to-end

- Ejecutar `pnpm test:e2e` y, si es posible, un smoke test manual en el despliegue activo para confirmar que el flujo completo (selección de fechas → hold → pago) funciona.

### To-dos

- [ ] Reproducir bug calendario vs hold
- [x] Arreglar lógica disponibilidad/colores
- [x] Diagnosticar y corregir error /pago prod
- [x] Re-test E2E + smoke manual