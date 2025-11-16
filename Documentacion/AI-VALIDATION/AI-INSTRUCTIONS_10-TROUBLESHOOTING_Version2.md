# 🆘 TROUBLESHOOTING - Guía de Resolución de Problemas

**OBJETIVO:** Documentar soluciones a problemas comunes que pueden surgir durante el desarrollo, testing y operación del sistema.

**FECHA:** 2025-11-11  
**AUTOR:** NikoRNJ

---

## **📋 ÍNDICE DE PROBLEMAS**

1. [Problemas de Base de Datos (Supabase)](#1-problemas-de-base-de-datos)
2. [Problemas de Autenticación y Sesiones](#2-problemas-de-autenticación)
3. [Problemas con Pagos (Flow)](#3-problemas-con-pagos-flow)
4. [Problemas con Emails (SendGrid)](#4-problemas-con-emails)
5. [Problemas de Build y Deploy](#5-problemas-de-build-y-deploy)
6. [Problemas de Performance](#6-problemas-de-performance)
7. [Problemas de Frontend](#7-problemas-de-frontend)
8. [Problemas del Servidor](#8-problemas-del-servidor)
9. [Problemas de Cron Jobs](#9-problemas-de-cron-jobs)
10. [Problemas de Seguridad](#10-problemas-de-seguridad)

---

## **1. PROBLEMAS DE BASE DE DATOS**

### **🔴 Problema: "Missing Supabase environment variables"**

**Síntomas:**
```
Error: Missing Supabase environment variables. 
Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Causa:**
Variables de entorno no configuradas o mal nombradas.

**Solución:**
```bash
# 1. Verificar que existen en .env.local
cat .env.local | grep SUPABASE

# 2. Deben aparecer:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Si no existen, crearlas:
# Ir a Supabase Dashboard → Settings → API
# Copiar Project URL y anon public key

# 4. Reiniciar servidor
npm run dev
```

---

### **🔴 Problema: "relation 'cabins' does not exist"**

**Síntomas:**
```
error: relation "public.cabins" does not exist
```

**Causa:**
El schema SQL no se ejecutó en Supabase.

**Solución:**
```sql
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar el contenido completo de AI-INSTRUCTIONS/01-ITERATION-1.md
-- 3. Buscar la sección "PASO 6: Crear Schema de Base de Datos"
-- 4. Copiar todo el SQL
-- 5. Pegar en el editor
-- 6. Click "Run"

-- 7. Verificar que se crearon las tablas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Debe mostrar: cabins, cabin_images, bookings, admin_blocks, api_events
```

---

### **🔴 Problema: Reservas duplicadas en las mismas fechas**

**Síntomas:**
Dos reservas con status 'paid' en las mismas fechas para la misma cabaña.

**Causa:**
1. Race condition en el endpoint de booking
2. Índice único no está activo

**Solución:**
```sql
-- 1. Verificar que existe el índice único
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bookings';

-- Debe aparecer: idx_bookings_no_overlap

-- 2. Si no existe, crearlo:
CREATE UNIQUE INDEX idx_bookings_no_overlap 
ON bookings(cabin_id, start_date, end_date)
WHERE status IN ('pending', 'paid');

-- 3. Identificar duplicados existentes:
SELECT cabin_id, start_date, end_date, COUNT(*) 
FROM bookings 
WHERE status = 'paid'
GROUP BY cabin_id, start_date, end_date 
HAVING COUNT(*) > 1;

-- 4. Resolver manualmente (contactar a los clientes)
-- 5. Cancelar uno de los duplicados
UPDATE bookings 
SET status = 'canceled', canceled_at = now()
WHERE id = 'ID-DEL-DUPLICADO';
```

---

### **🔴 Problema: "Failed to fetch" en queries de Supabase**

**Síntomas:**
```
Error: Failed to fetch
TypeError: fetch failed
```

**Causa:**
1. URL de Supabase incorrecta
2. Firewall bloqueando conexión
3. Supabase en mantenimiento

**Solución:**
```bash
# 1. Verificar conectividad
curl https://TU-PROJECT.supabase.co/rest/v1/

# Debe devolver: {"message":"The server is running"}

# 2. Verificar que la URL es correcta
echo $NEXT_PUBLIC_SUPABASE_URL
# Debe ser: https://xxxxx.supabase.co (sin /rest/v1/)

# 3. Verificar status de Supabase
# Ir a: https://status.supabase.com

# 4. Verificar CORS (si es desde navegador)
# En Supabase Dashboard → Settings → API
# Authentication → Site URL debe incluir tu dominio
```

---

## **2. PROBLEMAS DE AUTENTICACIÓN**

### **🔴 Problema: "Unauthorized" en panel admin**

**Síntomas:**
Después de hacer login, sigue redirigiendo a `/admin/login`.

**Causa:**
Cookie de sesión no se está guardando.

**Solución:**
```typescript
// Verificar en lib/auth/admin.ts que la cookie se crea correctamente

// En producción, asegurar que:
cookies().set(SESSION_COOKIE_NAME, sessionToken, {
  httpOnly: true,
  secure: true, // ← DEBE ser true en producción
  sameSite: 'lax',
  expires: expiresAt,
  path: '/',
});

// Verificar en DevTools → Application → Cookies
// Debe aparecer: admin_session = [token]
```

**Alternativa (simplificada):**
```bash
# Si el problema persiste, verificar que ADMIN_PASSWORD está en .env
echo $ADMIN_PASSWORD

# Regenerar la sesión
# 1. Logout
# 2. Borrar cookies manualmente (DevTools)
# 3. Login nuevamente
```

---

### **🔴 Problema: "Invalid admin password" aunque la contraseña es correcta**

**Síntomas:**
Login falla aunque la contraseña es la correcta.

**Causa:**
1. Espacios al inicio/fin en `.env`
2. Caché del navegador
3. Variable no cargada en servidor

**Solución:**
```bash
# 1. Verificar variable (SIN espacios)
cat .env.local | grep ADMIN_PASSWORD
# Debe ser: ADMIN_PASSWORD=mipassword
# NO: ADMIN_PASSWORD= mipassword  (espacio)

# 2. Reiniciar servidor Next.js
# Ctrl+C
npm run dev

# 3. En producción, verificar que PM2 tiene la variable
ssh deploy@IP "pm2 env 0"
# Buscar: ADMIN_PASSWORD

# 4. Si no aparece, revisar ecosystem.config.js
# Debe tener: env_file: '.env.production'
```

---

## **3. PROBLEMAS CON PAGOS (FLOW)**

### **🔴 Problema: "Flow API error: 401 Unauthorized"**

**Síntomas:**
```
Error creating Flow payment: Flow API error: 401 - Unauthorized
```

**Causa:**
1. API Key incorrecta
2. Secret Key incorrecta
3. Firma HMAC mal calculada

**Solución:**
```bash
# 1. Verificar credenciales en .env.local
cat .env.local | grep FLOW

# 2. Ir a Flow Dashboard → Mi Cuenta → API
# Copiar nuevamente API Key y Secret Key

# 3. Verificar que no hay espacios extra
FLOW_API_KEY=xxxxx-xxxxx  # ← Correcto
FLOW_API_KEY= xxxxx-xxxxx # ← INCORRECTO (espacio)

# 4. Verificar BASE_URL
# Sandbox: https://sandbox.flow.cl/api
# Producción: https://www.flow.cl/api

# 5. Reiniciar servidor
```

**Debug de firma HMAC:**
```typescript
// En lib/flow/client.ts, agregar console.log temporalmente:

private sign(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const dataString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  
  console.log('🔍 Data to sign:', dataString);
  console.log('🔑 Secret key (first 10 chars):', this.secretKey.substring(0, 10));
  
  const signature = crypto
    .createHmac('sha256', this.secretKey)
    .update(dataString)
    .digest('hex');
  
  console.log('✍️ Signature:', signature);
  
  return signature;
}

// Comparar con lo que Flow espera
```

---

### **🔴 Problema: Webhook de Flow no llega**

**Síntomas:**
El pago se completa en Flow pero la reserva sigue en 'pending'.

**Causa:**
1. URL del webhook incorrecta en Flow
2. Servidor no accesible desde internet
3. Firewall bloqueando Flow
4. Webhook retorna error 500

**Solución:**
```bash
# 1. Verificar que el endpoint es accesible públicamente
curl https://tresmorroscoliumo.cl/api/payments/flow/webhook

# Debe devolver:
# {"status":"ok","service":"Flow webhook endpoint",...}

# 2. En Flow Dashboard → Configuración → Notificaciones
# URL de Confirmación debe ser:
# https://tresmorroscoliumo.cl/api/payments/flow/webhook

# 3. En desarrollo local, usar ngrok:
ngrok http 3000
# Copiar la URL https://xxxx.ngrok.io
# Actualizar en Flow: https://xxxx.ngrok.io/api/payments/flow/webhook

# 4. Ver logs del webhook
ssh deploy@IP "pm2 logs tres-morros | grep webhook"

# 5. Verificar eventos en Supabase
SELECT * FROM api_events 
WHERE event_type LIKE '%webhook%' 
ORDER BY created_at DESC 
LIMIT 10;

# 6. Probar webhook manualmente
curl -X POST https://tresmorroscoliumo.cl/api/payments/flow/webhook \
  -d "token=test-token&s=test-signature"

# Debe devolver error de firma inválida (pero confirma que llega)
```

---

### **🔴 Problema: "Payment rejected by bank"**

**Síntomas:**
El pago se rechaza en Flow (tarjeta declinada).

**Causa:**
1. Tarjeta de prueba incorrecta (en sandbox)
2. Fondos insuficientes (en producción)
3. Tarjeta bloqueada por el banco

**Solución (Sandbox):**
```bash
# Usar tarjetas de prueba válidas de Flow:

# VISA APROBADA
Número: 4051 8856 0000 0005
CVV: 123
Fecha: 12/25

# MASTERCARD APROBADA
Número: 5186 0595 0000 0000
CVV: 123
Fecha: 12/25

# VISA RECHAZADA (para probar error)
Número: 4051 8842 3000 0007
CVV: 123
Fecha: 12/25
```

**Solución (Producción):**
```bash
# 1. Verificar logs de Flow
# En Flow Dashboard → Transacciones → Ver detalle

# 2. El cliente debe:
# - Verificar que la tarjeta tiene fondos
# - Contactar a su banco
# - Intentar con otra tarjeta

# 3. En el sistema, permitir reintentar el pago
# (el hold sigue activo hasta que expire)
```

---

## **4. PROBLEMAS CON EMAILS**

### **🔴 Problema: "SendGrid API error: 401 Unauthorized"**

**Síntomas:**
```
Error sending email: SendGrid API error: 401
```

**Causa:**
API Key de SendGrid incorrecta o expirada.

**Solución:**
```bash
# 1. Verificar API Key
cat .env.local | grep SENDGRID_API_KEY

# 2. Regenerar API Key en SendGrid
# Ir a: https://app.sendgrid.com
# Settings → API Keys → Create API Key
# Nombre: tres-morros-production
# Permisos: Full Access
# Copiar la clave (se muestra UNA sola vez)

# 3. Actualizar en .env.local
SENDGRID_API_KEY=SG.nuevo-api-key

# 4. Reiniciar servidor
npm run dev

# 5. Probar envío
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "message": "Test message"
  }'
```

---

### **🔴 Problema: Emails no llegan (no hay error)**

**Síntomas:**
El código ejecuta sin errores pero el email no llega.

**Causa:**
1. Email del remitente no verificado en SendGrid
2. Email en spam
3. Email del destinatario inválido
4. Límite de SendGrid alcanzado

**Solución:**
```bash
# 1. Verificar remitente en SendGrid
# Ir a: Settings → Sender Authentication
# Debe aparecer: no-reply@tresmorroscoliumo.cl (Verified)

# Si no está verificado:
# - Click "Verify Single Sender"
# - Agregar email
# - Confirmar desde el email de verificación

# 2. Verificar logs de SendGrid
# Ir a: Activity → Email Activity
# Buscar el email por destinatario
# Ver status: Delivered / Bounced / Dropped / Spam

# 3. Verificar carpeta de spam del destinatario

# 4. Verificar límite de SendGrid
# Free plan: 100 emails/día
# Ir a: Dashboard → Usage

# 5. Ver logs locales
SELECT * FROM api_events 
WHERE event_type LIKE 'email%' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **🔴 Problema: Email se ve mal en Outlook**

**Síntomas:**
El HTML del email se ve descuadrado en Outlook.

**Causa:**
Outlook usa Word como motor de renderizado (muy limitado).

**Solución:**
```html
<!-- En lib/email/templates/*.ts -->

<!-- 1. Usar tablas en lugar de divs para layout -->
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>Contenido</td>
  </tr>
</table>

<!-- 2. Usar inline styles (no classes de Tailwind) -->
<p style="color: #333; font-size: 16px; margin: 0;">Texto</p>

<!-- 3. NO usar:
- Flexbox
- Grid
- Position: absolute
- Background images complejas
-->

<!-- 4. Probar en: https://www.emailonacid.com (gratis para test simple) -->
```

---

## **5. PROBLEMAS DE BUILD Y DEPLOY**

### **🔴 Problema: "npm run build" falla con error de TypeScript**

**Síntomas:**
```
Type error: Property 'x' does not exist on type 'y'
npm run build failed
```

**Causa:**
Errores de tipos no detectados en desarrollo.

**Solución:**
```bash
# 1. Ejecutar verificación de tipos
npx tsc --noEmit

# 2. Revisar los errores mostrados
# Corregir uno por uno

# 3. Errores comunes:

# Error: "Property 'cabin' does not exist"
# Solución: Verificar que el tipo Database está actualizado
# Regenerar: types/database.ts

# Error: "Type 'undefined' is not assignable"
# Solución: Agregar optional chaining
# Antes: booking.cabin.title
# Después: booking.cabin?.title ?? 'N/A'

# 4. Una vez corregido
npm run build

# Debe completar sin errores
```

---

### **🔴 Problema: Build funciona local pero falla en servidor**

**Síntomas:**
`npm run build` funciona en local pero falla en producción.

**Causa:**
1. Versión diferente de Node.js
2. Variables de entorno faltantes
3. Dependencias faltantes

**Solución:**
```bash
# 1. Verificar versión de Node en servidor
ssh deploy@IP "node --version"

# Debe ser v20.x.x
# Si no, instalar:
nvm install 20
nvm use 20

# 2. Verificar que .env.production existe
ssh deploy@IP "cat ~/tres-morros-coliumo/.env.production"

# Debe mostrar todas las variables

# 3. Limpiar caché y reinstalar
ssh deploy@IP "cd ~/tres-morros-coliumo && \
  rm -rf .next node_modules && \
  npm ci && \
  npm run build"

# 4. Ver logs completos
ssh deploy@IP "cd ~/tres-morros-coliumo && npm run build 2>&1 | tee build.log"
```

---

### **🔴 Problema: PM2 reinicia constantemente la app**

**Síntomas:**
```
pm2 status
# tres-morros | errored | 50 restarts
```

**Causa:**
La aplicación se crashea al iniciar.

**Solución:**
```bash
# 1. Ver logs de error
ssh deploy@IP "pm2 logs tres-morros --err --lines 100"

# 2. Errores comunes:

# Error: "ENOENT: no such file or directory, stat '.next'"
# Solución: Hacer build
cd ~/tres-morros-coliumo
npm run build

# Error: "Missing environment variable"
# Solución: Verificar .env.production

# Error: "Port 3000 already in use"
# Solución: Cambiar puerto en ecosystem.config.js
env: {
  PORT: 3001, // ← Cambiar
}

# 3. Reiniciar PM2 correctamente
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# 4. Verificar que está online
pm2 status
# tres-morros | online | 0 restarts
```

---

## **6. PROBLEMAS DE PERFORMANCE**

### **🔴 Problema: Página carga muy lento (> 5 segundos)**

**Síntomas:**
Lighthouse Performance < 50

**Causa:**
1. Imágenes sin optimizar
2. JavaScript muy grande
3. Queries lentas

**Solución:**
```bash
# 1. Optimizar imágenes
# Usar next/image en lugar de <img>

# Antes:
<img src="/images/cabin.jpg" />

# Después:
<Image 
  src="/images/cabin.jpg" 
  width={800} 
  height={600}
  alt="Cabaña"
  priority={false} # Solo true para hero images
/>

# 2. Comprimir imágenes existentes
# Usar: https://squoosh.app
# O instalar imagemin:
npm install -g imagemin-cli imagemin-webp

imagemin public/images/*.jpg --plugin=webp > public/images/

# 3. Analizar bundle size
npm run build
# Ver el reporte de tamaños

# Si hay paquetes grandes, considerar:
# - Dynamic imports
# - Code splitting

# 4. Optimizar queries de Supabase
# Agregar índices en columnas usadas en WHERE

CREATE INDEX idx_bookings_cabin_dates 
ON bookings(cabin_id, start_date, end_date);

# 5. Activar caching de Nginx (ya debería estar)
```

---

### **🔴 Problema: API responses lentas**

**Síntomas:**
Requests a `/api/*` toman > 2 segundos.

**Causa:**
Queries ineficientes a Supabase.

**Solución:**
```typescript
// 1. Evitar N+1 queries

// ❌ MAL (hace 1 query por cabaña)
const cabins = await supabase.from('cabins').select('*');
for (const cabin of cabins.data) {
  const images = await supabase
    .from('cabin_images')
    .select('*')
    .eq('cabin_id', cabin.id);
}

// ✅ BIEN (1 sola query)
const { data } = await supabase
  .from('cabins')
  .select('*, images:cabin_images(*)');

// 2. Usar select específico (no *)
// ❌ MAL
.select('*')

// ✅ BIEN
.select('id, title, slug, base_price')

// 3. Agregar límites
.limit(10)

// 4. Usar paginación
.range(0, 9) // Primeros 10 resultados
```

---

## **7. PROBLEMAS DE FRONTEND**

### **🔴 Problema: "Hydration failed" en Next.js**

**Síntomas:**
```
Error: Hydration failed because the initial UI does not match 
what was rendered on the server.
```

**Causa:**
HTML generado en servidor difiere del cliente.

**Solución:**
```typescript
// Causas comunes:

// 1. Usar Date.now() o new Date() directamente
// ❌ MAL
<p>Hora actual: {new Date().toLocaleString()}</p>

// ✅ BIEN (usar useEffect para cliente)
const [time, setTime] = useState<string>('');
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);

// 2. Usar window o document en render
// ❌ MAL
const width = window.innerWidth;

// ✅ BIEN
const [width, setWidth] = useState(0);
useEffect(() => {
  setWidth(window.innerWidth);
}, []);

// 3. Usar librerías que generan IDs aleatorios
// Solución: Pasar seed o usar useId() de React 18

// 4. Tags HTML mal anidados
// ❌ MAL
<p><div>Contenido</div></p>

// ✅ BIEN
<div><div>Contenido</div></div>
```

---

### **🔴 Problema: Calendario no responde en móvil**

**Síntomas:**
No se pueden seleccionar fechas en pantallas táctiles.

**Causa:**
react-day-picker tiene issues con touch events.

**Solución:**
```typescript
// En components/booking/AvailabilityCalendar.tsx

// Agregar estilos para mejor touch
<DayPicker
  mode="range"
  // ...otras props
  className="touch-manipulation" // ← Agregar
  modifiersClassNames={{
    selected: 'rdp-day_selected touch-target', // ← Mejor área de touch
  }}
/>

// En globals.css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

.touch-manipulation {
  touch-action: manipulation;
}
```

---

## **8. PROBLEMAS DEL SERVIDOR**

### **🔴 Problema: "502 Bad Gateway" en Nginx**

**Síntomas:**
Al acceder al sitio, aparece "502 Bad Gateway".

**Causa:**
Next.js no está corriendo o no responde en puerto 3000.

**Solución:**
```bash
# 1. Verificar que PM2 está corriendo
ssh deploy@IP "pm2 status"

# Si está "stopped" o "errored":
pm2 restart tres-morros

# 2. Verificar que escucha en puerto 3000
ssh deploy@IP "sudo netstat -tulpn | grep :3000"
# Debe mostrar: tcp ... LISTEN 12345/node

# 3. Verificar logs de Nginx
ssh deploy@IP "sudo tail -f /var/log/nginx/tres-morros-error.log"

# 4. Verificar config de Nginx
ssh deploy@IP "sudo nginx -t"
# Debe mostrar: syntax is ok

# 5. Si todo falla, reiniciar todo
ssh deploy@IP "pm2 restart tres-morros && sudo systemctl restart nginx"
```

---

### **🔴 Problema: Servidor sin espacio en disco**

**Síntomas:**
```
ENOSPC: no space left on device
```

**Causa:**
Logs muy grandes o archivos temporales.

**Solución:**
```bash
# 1. Ver uso de disco
ssh deploy@IP "df -h"

# Si /dev/vda1 está al 100%:

# 2. Encontrar archivos grandes
ssh deploy@IP "du -sh /* | sort -h"

# 3. Limpiar logs viejos
ssh deploy@IP "find /var/log -name '*.log' -mtime +30 -delete"

# 4. Limpiar node_modules viejos (si hay)
ssh deploy@IP "find ~ -name 'node_modules' -type d -exec du -sh {} \;"

# 5. Limpiar caché de PM2
ssh deploy@IP "pm2 flush"

# 6. Limpiar caché de npm
ssh deploy@IP "npm cache clean --force"

# 7. Rotar logs con logrotate
ssh deploy@IP "sudo nano /etc/logrotate.d/pm2"

# Contenido:
/home/deploy/.pm2/logs/*.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
}
```

---

## **9. PROBLEMAS DE CRON JOBS**

### **🔴 Problema: Cron jobs no se ejecutan**

**Síntomas:**
Holds no expiran automáticamente, recordatorios no se envían.

**Causa:**
Crontab no configurado o con errores.

**Solución:**
```bash
# 1. Verificar que crontab existe
ssh deploy@IP "crontab -l"

# Debe mostrar:
# */5 * * * * curl -X POST http://localhost:3000/api/jobs/expire-holds...

# 2. Si no aparece, agregarlo:
ssh deploy@IP "crontab -e"

# Pegar:
*/5 * * * * curl -X POST http://localhost:3000/api/jobs/expire-holds -H "x-cron-secret: SECRET" >> /home/deploy/tres-morros-coliumo/logs/cron-expire-holds.log 2>&1
0 9 * * * curl -X POST http://localhost:3000/api/jobs/send-reminders -H "x-cron-secret: SECRET" >> /home/deploy/tres-morros-coliumo/logs/cron-reminders.log 2>&1

# 3. Verificar logs de ejecución
ssh deploy@IP "tail -f ~/tres-morros-coliumo/logs/cron-expire-holds.log"

# 4. Probar manualmente
curl -X POST http://localhost:3000/api/jobs/expire-holds \
  -H "x-cron-secret: TU-SECRET"

# Debe devolver JSON con resultados
```

---

## **10. PROBLEMAS DE SEGURIDAD**

### **🔴 Problema: "Invalid signature" en webhook de Flow**

**Síntomas:**
```
Error: Invalid webhook signature
```

**Causa:**
La firma HMAC no coincide.

**Causa más común:**
Flow envía parámetros adicionales que no estás considerando.

**Solución:**
```typescript
// En app/api/payments/flow/webhook/route.ts

// Agregar logging temporal:
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  
  // Log TODOS los parámetros recibidos
  const allParams: Record<string, string> = {};
  formData.forEach((value, key) => {
    allParams[key] = value.toString();
  });
  
  console.log('🔍 Webhook params recibidos:', allParams);
  
  // Verificar firma
  const token = formData.get('token') as string;
  const signature = formData.get('s') as string;
  
  // La firma debe calcularse SOLO con el token
  const isValid = flowClient.validateWebhookSignature(
    { token }, // ← Solo token, sin otros params
    signature
  );
  
  console.log('✍️ Firma válida:', isValid);
  
  // ...
}
```

---

### **🔴 Problema: Variables de entorno expuestas en cliente**

**Síntomas:**
Claves secretas visibles en DevTools.

**Causa:**
Variable sin el prefijo `NEXT_PUBLIC_` pero usada en componente cliente.

**Solución:**
```bash
# 1. Verificar que NO aparecen en el bundle del cliente
# Abrir DevTools → Sources → buscar:
# - SUPABASE_SERVICE_ROLE_KEY
# - FLOW_SECRET_KEY
# - ADMIN_PASSWORD

# Si aparecen: ❌ GRAVE

# 2. Identificar dónde se usan
grep -r "SUPABASE_SERVICE_ROLE_KEY" app/

# 3. Solo deben usarse en:
# - app/api/**/*.ts (API Routes)
# - Server Components (sin 'use client')
# - lib/supabase/server.ts

# 4. Si aparecen en componentes cliente:
# ❌ NO HACER:
'use client'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← EXPUESTO

# ✅ HACER:
// Mover la lógica a un API Route
// Desde el cliente, llamar al API
const response = await fetch('/api/secure-action');
```

---

## **📞 CONTACTO DE SOPORTE**

Si ninguna solución funciona:

1. **Revisar logs completos:**
   ```bash
   ssh deploy@IP "pm2 logs --lines 200"
   ```

2. **Buscar en GitHub Issues del proyecto**

3. **Crear nuevo issue con:**
   - Descripción del problema
   - Pasos para reproducir
   - Logs relevantes
   - Screenshots si aplica
   - Versión de Node.js
   - Sistema operativo

4. **Contactar a NikoRNJ:**
   - GitHub: @NikoRNJ
   - Email: (configurar)

---

**ÚLTIMA ACTUALIZACIÓN:** 2025-11-11  
**VERSIÓN:** 1.0.0

---

**FIN DEL TROUBLESHOOTING GUIDE**