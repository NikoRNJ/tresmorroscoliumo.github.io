# 04 · Pendientes para la fase Codex

Backlog consolidado con orden de criticidad (1 = urgente). Incluye tareas tomadas de la auditoría y de los planes previos (`PLAN_ITERATIVO.md`).

## Crítica
1. **Constraint anti-traslapes** · Implementar `EXCLUDE USING gist` y manejar `SQLSTATE 23P01` en `/api/bookings/hold`. Sin esto seguimos expuestos a dobles reservas si dos huéspedes confirman minutos antes del pago.
2. **Reemisión automática de órdenes Flow** · Permitir regenerar tokens caducados y bloquear despliegues si `FLOW_FORCE_MOCK` está activo en producción.
3. **Normalización de horarios** · Guardar `arrival_time`/`departure_time` en columnas dedicadas y mostrar esa data en disponibilidad, emails y panel.

## Alta
4. **Correo transaccional confiable** · Verificar dominio en SendGrid/Resend, registrar errores en `api_events` con reintentos y exponer un test manual en `/api/health`.
5. **Rate limiting y captcha** · Aplicar límites (ej. `@upstash/ratelimit`) a `/api/bookings/hold`, `/api/contact` y `/api/admin/login`; evaluar hCaptcha en formularios públicos.
6. **Cron `expire-holds` gestionado** · Automatizar el job en DigitalOcean Scheduler y agregar alertas si encuentra >0 holds expirados por ejecución.
7. **Documentación pública al día** · Actualizar `COMO-VER-EL-PROYECTO.md`, `README.md (Features)` y `docs/observability` para reflejar los cambios anteriores.

## Media
8. **Panel admin completo** · Implementar vistas funcionales para `cabanas`, `bloqueos` y `configuracion` o esconderlas tras feature-flag; añadir edición de bloqueos y exportaciones.
9. **Scripts seguros** · Separar `clear-blocks` de `clear-bookings`, añadir confirmaciones y documentar el flujo en `README`.
10. **Hardening auth admin** · Migrar helpers a `apps/web`, usar hashes persistentes y throttling básico.
11. **Monitoreo de pagos** · Sumar panel (Supabase o dashboard) que liste eventos `payment_*`, junto con alertas Sentry por `flow_payment_error`.

## Baja
12. **docs/business/incidents.md** · Crear el registro de incidentes mencionado en `observability.md`.
13. **Storybook o catálogo UI** · Para `packages/ui`, habilitar documentación visual que facilite futuras iteraciones.
14. **Roadmap público en GitHub Projects** · Volcar este archivo y `PLAN_ITERATIVO` a un tablero que Codex pueda seguir sprint a sprint.

> Una vez completados los puntos críticos y altos, el sistema estará listo para la integración con la pasarela Flow en modo producción y para las automatizaciones que requiere la fase “Codex”.


