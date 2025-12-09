## Plan Iterativo de Mejora para tresmorroscoliumo.cl

Este documento consolida el plan completo detectado durante la auditoría inicial. Sirve como guía viva para priorizar e iterar sobre las mejoras del proyecto. Cada fase incluye acciones sugeridas y el objetivo que resuelve. Actualiza este archivo conforme se completen hitos o se agreguen nuevas necesidades.

---

### 0. Observabilidad y Contención
- Activar `doctl apps logs --tail` y documentar patrones de error.
- Configurar Sentry y/o Logtail para capturar excepciones de Next y API.
- Publicar `GET /api/health-lite` como health check y monitorearlo (UptimeRobot, Better Stack).
- Añadir dashboard que combine métricas (tiempo de respuesta, errores 5xx, eventos de pago).

### 1. Infraestructura y Despliegue
- Aumentar la instancia de App Platform al menos a `apps-s-1vcpu-1gb` (ideal 2 GB) y habilitar autoescalado 1–2.
- Limpiar `.do/app.yaml`: mover llaves a DigitalOcean Secrets, evitar credenciales versionadas.
- Ajustar `run_command` para exponer correctamente el puerto y declarar `health_check`.
- Validar DNS (A/AAAA a DO, CNAME para `www`) y habilitar HTTPS forzado + HSTS desde DO.
- Revisar tiempos de build (`pnpm fetch` + cache) y crear pipeline que falle si variables críticas faltan.

### 2. Pagos y Reservas
- Configurar Flow sandbox real (`FLOW_FORCE_MOCK=false`) y exponer `GET /api/payments/flow/status` para chequeos previos.
- Añadir validación en CI/CD: si Flow no está configurado, abortar deploy.
- Migrar `/pago` y `/pago/confirmacion` a Server Components con datos precargados; manejar errores SSR.
- Endurecer webhook:
  - Incluir todos los parámetros en la firma y validar `FLOW_WEBHOOK_SECRET`.
  - Hacer la operación idempotente y loggear payloads originales.
- Programar `POST /api/jobs/expire-holds` con el Scheduler de DO (cada 5 min) usando `CRON_SECRET`.
- Agregar pruebas automáticas `tests/flow-e2e.test.ts` en CI.

### 3. Emails y Comunicaciones
- Verificar dominio en SendGrid (o migrar a Resend/SES) y rotar claves.
- Implementar reintentos con backoff y cola (Supabase `api_events`) para envíos fallidos.
- Añadir rate limiting + hCaptcha en `/api/contact` y `/api/bookings/hold`.
- Registrar `request_id` y estado del correo en `api_events` para trazabilidad desde el panel admin.

### 4. Experiencia y Contenido
- Cambiar la home a `dynamic = 'force-dynamic'` con `revalidate` corto, o agregar un botón de “Actualizar contenido” en panel admin que dispare revalidación.
- Servir imágenes desde CDN (DigitalOcean Spaces/Cloudflare) y ajustar `next/image` (`deviceSizes`, `Cache-Control` agresivo).
- Añadir skeletons y loaders consistentes en secciones pesadas (galería, carrouseles).
- Integrar métricas de Core Web Vitals (Next Analytics o Vercel Web Vitals) para medir impacto.

### 5. Seguridad y Panel Admin
- Reemplazar el login plano por Supabase Auth o NextAuth con passkeys/OTP; mientras tanto, mover las credenciales a hashes en Supabase y limitar intentos por IP.
- Revisar `api_events` para eliminar datos sensibles y cumplir con minimización.
- Agregar rate limiting global (middleware) y CSP/Headers estrictos para rutas críticas (`/admin`, `/api/payments/*`).

### 6. Gobernanza y Próximos Pasos
- Crear checklist de despliegue (Flow configurado, emails verificados, cron activo, health check operativo).
- Documentar procedimientos de rotación de llaves (Flow, Supabase, SendGrid) y automatizar recordatorios.
- Implementar tablero Kanban (GitHub Projects) que referencie esta guía y marque el estado de cada acción.

> Mantén este archivo versionado. Cada vez que se complete una acción, agrega fecha y responsable o mueve el punto a una sección de “Completados” si prefieres histórico.


