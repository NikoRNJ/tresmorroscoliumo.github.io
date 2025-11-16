# Índice General de Documentación

Mapa de todos los archivos de referencia incluidos en el repositorio y breve descripción de su propósito. La organización respeta la estructura de carpetas existente para que puedas ubicar rápidamente cada recurso.

## Raíz del Proyecto
- `README.md`: visión general del sistema de reservas, stack tecnológico, scripts disponibles y estructura de carpetas.
- `COMO-VER-EL-PROYECTO.md`: guía paso a paso para correr el proyecto localmente, configurar Supabase y URLs principales.
- `supabase-schema.sql`: definición completa del esquema inicial (cabins, cabin_images, bookings, etc.).
- `UPDATE_SCHEMA_PRICING.sql`: migración puntual para añadir `price_per_extra_person` y actualizar datos existentes.
- `migrations/iteration-5-flow-integration.sql`: script de la iteración que integra Flow (nuevas columnas, triggers y datos seed relacionados con pagos).
- `.env.example`: plantilla de variables de entorno (Supabase, Flow, SendGrid, cron secret).
- `BUG-009-PROBLEMAS-CRITICOS-SOLUCIONADOS.md` (en `Documentacion/desarrollo/PASOS COMPLETADOS` pero se menciona aquí porque responde a incidencias históricas críticas).

## `Documentacion/AI-CONTEXT`
- `AI-CONTEXT_business-requirements_Version2.md`: requisitos de negocio, KPIs y alcance (capacidad de cabañas, precios, SLA de respuesta, etc.).
- `AI-CONTEXT_technical-specifications_Version2.md`: especificaciones técnicas detalladas (stack, módulos obligatorios, flujos de reserva/pago/email, métricas).

## `Documentacion/AI-INSTRUCTIONS`
Secuencia de briefs de cada iteración del proyecto:
- `AI-INSTRUCTIONS_00-START-HERE_Version2.md`: onboarding del agente IA y lineamientos generales.
- `AI-INSTRUCTIONS_01-ITERATION-1_Version2.md`: setup inicial + base de datos.
- `AI-INSTRUCTIONS_02-ITERATION-2_Version2.md`: frontend básico (home y páginas de cabañas).
- `...`
- `AI-INSTRUCTIONS_09-ITERATION-9_Version2.md`: pruebas finales y validación previa a producción.

> Cada archivo contiene objetivos, entregables, checklists y validaciones esperadas para la iteración correspondiente (1 a 9). Sirven como bitácora de backlog.

## `Documentacion/AI-VALIDATION`
- `AI-INSTRUCTIONS_10-TROUBLESHOOTING_Version2.md`: guía de resolución de problemas (variables de entorno, errores comunes de Supabase/Flow/SendGrid, comandos de verificación).

## `Documentacion/desarrollo`
- `BUENAS-PRACTICAS.md`: convenciones de código, ramificación git, formato de commits y pautas de revisiones.
- `BUGS-Y-SOLUCIONES.md`: registro vivo de bugs detectados (clasificados por severidad) con síntoma, causa raíz, fix aplicado y prevención.
- `OPTIMIZACIONES-RENDIMIENTO.md`: checklist de ajustes de performance implementados/planteados (caching, reducción de payloads, optimización de imágenes, etc.).

### `Documentacion/desarrollo/PASOS COMPLETADOS`
Resumen y evidencia de cada iteración entregada:
- `ITERACION-1-COMPLETADA.md` → setup + Supabase.
- `ITERACION-2-COMPLETADA.md` → landing, cards y hero.
- `ITERACION-3-COMPLETADA.md` → calendario de disponibilidad inicial.
- `ITERACION-4-COMPLETADA.md` → formulario de reserva y holds.
- `ITERACION-5-COMPLETADA.md` → integración Flow (pagos).
- `ITERACION-6-MINIMO-COMPLETADA.md` → emails transaccionales (SendGrid).
- `ITERACION-7-COMPLETADA.md` → panel administrativo mínimo.
- `BUG-009-PROBLEMAS-CRITICOS-SOLUCIONADOS.md` → incidente puntual documentado tras iteraciones.

Cada documento incluye objetivos, tareas completadas, issues surgidos y próximos pasos pendientes.

---

Esta tabla de contenidos se mantendrá como referencia central para futuras iteraciones (añadiendo nuevas carpetas/archivos cuando se incorporen). Actualiza este índice cuando agregues documentación relevante para mantener la trazabilidad del proyecto.
