# Funciones Detectadas con Fallos o Brechas

Lista priorizada de las incidencias funcionales actuales. Cada punto incluye la referencia del archivo/línea donde se evidencia el problema y el impacto observado.

## 1. Reservas
- **Wizard ignora el cálculo dinámico de huéspedes incluidos**  
  - Referencia: `components/booking/BookingWizard.tsx:25-33`.  
  - Detalle: se calcula `initialPartySize` en función de `getIncludedGuests`, pero el `useState` usa siempre `2`. Para cualquier cabaña cuyo mínimo real difiera (ej. fallback configurado a 1 o mayor a 2), la UI mostrará valores incorrectos y puede bloquear pasos posteriores.  
  - Impacto: experiencia inconsistente y validaciones erróneas al intentar avanzar, especialmente cuando el negocio ajuste `capacity_base`.

## 2. Pagos con Flow
- **No se puede reanudar una orden existente**  
  - Referencias: `app/api/payments/flow/create/route.ts:84-92` y `app/pago/page.tsx:120-164`.  
  - El endpoint responde `409` cuando `booking.flow_order_id` ya existe pero no devuelve la URL/token previo. El frontend solo muestra un mensaje de error y no ofrece acción para continuar el pago. Si el usuario cerró Webpay o se desconectó, queda bloqueado aunque siga dentro del tiempo del hold.
- **Modo mock no envía confirmaciones por email**  
  - Referencia: `app/api/payments/flow/create/route.ts:95-128` combinado con `app/api/payments/flow/webhook/route.ts`.  
  - Cuando faltan credenciales se marca la reserva como `paid`, pero nunca se invoca `sendBookingConfirmation` (el webhook no se dispara en este modo y no hay llamada manual). En entornos locales no se validan las plantillas ni llega ningún correo al usuario.

## 3. Panel de Administración
- **Links a secciones inexistentes**  
  - Referencia: `components/admin/AdminNav.tsx:15-20`.  
  - El menú incluye `/admin/cabanas`, `/admin/bloqueos` y `/admin/configuracion`, rutas que no existen en `app/admin`. El resultado son 404 inmediatamente después de hacer click.
- **Variable imprescindible no documentada**  
  - Referencias: `lib/auth/admin.ts:13-33` y ausencia de `ADMIN_PASSWORD` en `.env.example`.  
  - Sin definir `ADMIN_PASSWORD`, `verifyAdminPassword` devuelve siempre `false` y el panel queda inaccesible. La plantilla de entorno no menciona este valor, por lo que cualquier desarrollador nuevo se encuentra con un login imposible.

## 4. Comunicación
- **Formulario de contacto llama a un endpoint inexistente**  
  - Referencia: `components/forms/ContactForm.tsx:17-35`.  
  - Se hace `fetch('/api/contact')`, pero no existe ninguna ruta en `app/api`. La UI siempre muestra el estado de error y los leads no se registran.

Estas incidencias cubren los tres ejes solicitados (reservas, pagos/Flow y panel admin) y añaden la brecha de comunicación, que afecta directamente al funnel comercial. Se detallan propuestas en `SOLUCIONES-PROPUESTAS.md`.
