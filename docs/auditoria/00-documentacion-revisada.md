# 00 · Documentación revisada

Resumen de los archivos `.md` más relevantes y su estado actual tras la auditoría.

| Archivo | Enfoque | Estado | Observaciones / Pendientes |
| --- | --- | --- | --- |
| `README.md` | Presentación general, scripts, setup y despliegue | ✅ Actualizado | Cubre monorepo, scripts `pnpm`, e2e y export mínimo. Falta checklist explícito para mock vs producción y sección de troubleshooting de Flow/SendGrid. |
| `ARQUITECTURA.MD` | Arquitectura lógica, flujos y stack | ✅ Completo | Define flujos (reserva, pago, cron, admin). Mantiene lista de optimizaciones pendientes (Redis, CDN, RLS) que aún no se han ejecutado. |
| `COMO-VER-EL-PROYECTO.md` | Guía rápida para levantar el proyecto original | ⚠️ Desactualizado | Continúa mencionando hold de 20 min (hoy son 45 min), rutas antiguas (`POST /api/bookings`) y `npm run dev`. Debe alinearse con monorepo (`pnpm dev` en `apps/web`) y nueva estructura. |
| `PLAN_ITERATIVO.md` | Backlog estratégico por fases | ✅ Vigente | Lista acciones por área (observabilidad, despliegue, pagos, emails, UX, seguridad). No existe un tablero que refleje su avance; varios puntos siguen abiertos. |
| `docs/technical/MONOREPO-GUIDE.md` | Manual técnico del monorepo | ✅ Detallado | Explica workspaces, alias, envs y flujos de desarrollo. Pendiente añadir guardas para consumo fuera de Next (p. ej. `auth/admin` depende de `next/headers`). |
| `docs/technical/observability.md` | Monitoreo y respuesta a incidentes | ⚠️ Incompleto | Define pasos de logging/Sentry pero referencia `docs/business/incidents.md` inexistente. Falta instructivo para métricas de pagos y alarmas en Flow. |
| `deploy/README.md` | Guías de App Platform, Droplet + Nginx/Apache | ✅ Vigente | Incluye `.do/app.yaml`, `Procfile` y comandos. No documenta cómo versionar `.env.local` dividido por workspace ni cómo automatizar `pnpm clear:bookings`. |
| `ARQUITECTURA.MD` + `README.md` (presentación cliente) | Cara pública del repo | ✅ Orientado a cliente | Requiere sincronizar narrativa con nuevas mejoras (p. ej. horarios check-in/out). |

> Conclusión: la base documental está completa para onboarding técnico, pero existen archivos heredados (`COMO-VER-EL-PROYECTO.md`, observabilidad) que deben actualizarse antes de compartir el paquete como “plantilla” definitiva.


