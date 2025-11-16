# ✅ ITERACIÓN 9: Testing y Validación Final

**OBJETIVO:** Realizar pruebas exhaustivas del sistema completo, validar todos los flujos de usuario y asegurar la calidad antes del lanzamiento.

**DURACIÓN ESTIMADA:** 3-4 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 8 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Aplicación desplegada en producción
- [ ] Todos los servicios externos configurados (Flow, SendGrid, Supabase)
- [ ] Acceso al panel de administración
- [ ] Tienes dispositivos para probar (móvil, tablet, desktop)

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás haber:

1. ✅ Probado flujo completo de reserva (end-to-end)
2. ✅ Validado todos los emails
3. ✅ Verificado disponibilidad en calendario
4. ✅ Probado panel de administración
5. ✅ Validado responsive design
6. ✅ Verificado performance y SEO
7. ✅ Probado edge cases y errores
8. ✅ Documentado bugs encontrados
9. ✅ Creado checklist de lanzamiento

---

## **PASO 1: Testing del Flujo de Reserva Completo**

### **Test 1.1: Reserva Exitosa - Usuario Nuevo**

**Objetivo:** Validar que un usuario puede hacer una reserva de principio a fin.

**Pasos:**
1. Ir a homepage
2. Click en "Ver Cabañas"
3. Seleccionar "Vegas del Coliumo"
4. En el calendario, seleccionar fechas disponibles (ej: 3 días desde hoy)
5. Click "Continuar"
6. Seleccionar 2 personas
7. Click "Continuar"
8. Seleccionar 1 día con jacuzzi
9. Completar formulario:
   ```
   Nombre: Test User
   Email: test@example.com
   Teléfono: +56912345678
   Notas: Prueba de reserva
   ```
10. Aceptar términos
11. Click "Continuar al pago"
12. Verificar página de pago:
    - Tiempo restante se muestra
    - Resumen es correcto
    - Total coincide
13. Click "Pagar con Webpay Plus"
14. Completar pago en Flow (usar tarjeta de prueba)
15. Redirige a página de confirmación
16. Verificar mensaje de éxito

**Criterios de éxito:**
- [ ] Todas las páginas cargan sin errores
- [ ] Calendario muestra disponibilidad correcta
- [ ] Cálculo de precio es correcto
- [ ] Hold se crea en DB (status: pending)
- [ ] Redirección a Flow funciona
- [ ] Webhook actualiza status a 'paid'
- [ ] Email de confirmación llega
- [ ] Página de confirmación muestra datos correctos

**Verificaciones en DB:**
```sql
-- En Supabase SQL Editor
SELECT * FROM bookings 
WHERE customer_email = 'test@example.com'
ORDER BY created_at DESC 
LIMIT 1;

-- Debe mostrar:
-- status: 'paid'
-- flow_order_id: (número)
-- paid_at: (timestamp)
```

---

### **Test 1.2: Reserva con Conflicto de Fechas**

**Objetivo:** Verificar que no se permiten reservas superpuestas.

**Pasos:**
1. Intentar reservar las mismas fechas del Test 1.1
2. Completar el wizard hasta el formulario
3. Submit

**Criterios de éxito:**
- [ ] API devuelve error 409
- [ ] Mensaje claro: "Las fechas ya no están disponibles"
- [ ] No se crea reserva duplicada en DB
- [ ] Usuario puede volver atrás y elegir otras fechas

---

### **Test 1.3: Expiración de Hold**

**Objetivo:** Validar que los holds expiran después de 20 minutos.

**Pasos:**
1. Crear una reserva nueva pero NO pagar
2. Esperar en la página de pago
3. Observar el contador
4. Esperar 20 minutos (o cambiar `expires_at` en DB manualmente para acelerar)
5. Intentar pagar después del tiempo

**Criterios de éxito:**
- [ ] Contador disminuye correctamente
- [ ] Al expirar, muestra mensaje de expiración
- [ ] Cron job actualiza status a 'expired'
- [ ] Las fechas vuelven a estar disponibles

**Verificación manual:**
```sql
-- Acelerar expiración (para pruebas)
UPDATE bookings 
SET expires_at = now() - interval '1 minute'
WHERE id = 'ID-DEL-BOOKING';

-- Ejecutar job manualmente
-- curl -X POST https://tresmorroscoliumo.cl/api/jobs/expire-holds \
--   -H "x-cron-secret: TU-SECRET"

-- Verificar cambio
SELECT status, expires_at FROM bookings WHERE id = 'ID-DEL-BOOKING';
-- Debe mostrar: status = 'expired'
```

---

## **PASO 2: Testing de Emails**

### **Test 2.1: Email de Confirmación**

**Criterios de validación:**
- [ ] Email llega en menos de 2 minutos
- [ ] Remitente correcto: "Tres Morros de Coliumo <no-reply@tresmorroscoliumo.cl>"
- [ ] Subject: "✅ Reserva Confirmada - [Nombre Cabaña]"
- [ ] HTML se ve bien en Gmail
- [ ] HTML se ve bien en Outlook
- [ ] HTML se ve bien en móvil
- [ ] Todos los datos son correctos:
  - Nombre del cliente
  - Cabaña
  - Fechas
  - Noches
  - Personas
  - Jacuzzi (si aplica)
  - Total pagado
  - Número de reserva
- [ ] Links funcionan
- [ ] No hay errores tipográficos

### **Test 2.2: Email de Recordatorio**

**Pasos para probar:**
1. Crear una reserva con check-in en 3 días
2. Ejecutar job manualmente:
   ```bash
   curl -X POST https://tresmorroscoliumo.cl/api/jobs/send-reminders \
     -H "x-cron-secret: TU-SECRET"
   ```
3. Verificar que llega el email

**Criterios de validación:**
- [ ] Email llega correctamente
- [ ] Subject: "⏰ Tu estadía en [Cabaña] comienza pronto"
- [ ] Información de check-in correcta
- [ ] Checklist de preparativos se muestra
- [ ] HTML responsive
- [ ] Tono amigable y útil

---

## **PASO 3: Testing del Panel de Admin**

### **Test 3.1: Login**

**Pasos:**
1. Ir a `/admin/login`
2. Intentar con contraseña incorrecta
3. Intentar con contraseña correcta

**Criterios de éxito:**
- [ ] Contraseña incorrecta muestra error claro
- [ ] Contraseña correcta redirige a `/admin`
- [ ] Sesión persiste al recargar página
- [ ] Logout funciona correctamente

---

### **Test 3.2: Dashboard**

**Criterios de validación:**
- [ ] KPIs se calculan correctamente:
  - Ingresos del mes (suma de bookings 'paid')
  - Reservas del mes (count de bookings)
  - Tasa de ocupación (cálculo correcto)
  - Próximas llegadas (siguiente 7 días)
- [ ] Gráficos/números tienen formato correcto (CLP con separador de miles)
- [ ] "Próximas Llegadas" muestra reservas ordenadas por fecha
- [ ] Todo es responsive

---

### **Test 3.3: Listado de Reservas**

**Criterios de validación:**
- [ ] Muestra todas las reservas
- [ ] Filtros funcionan:
  - Todas
  - Pagadas
  - Pendientes
  - Expiradas
  - Canceladas
- [ ] Ordenamiento correcto (más recientes primero)
- [ ] Badges de estado tienen colores correctos
- [ ] Click en "Ver detalles" abre la reserva

---

### **Test 3.4: Detalle de Reserva**

**Criterios de validación:**
- [ ] Muestra toda la información del cliente
- [ ] Muestra detalles de la reserva
- [ ] Muestra información de pago
- [ ] Timeline refleja el estado correcto
- [ ] Links de email y teléfono funcionan
- [ ] Link a la cabaña funciona

---

## **PASO 4: Testing Responsive**

### **Dispositivos a probar:**

**📱 Móvil (320px - 480px)**
- iPhone SE
- iPhone 12/13/14
- Samsung Galaxy S21

**Páginas críticas:**
- [ ] Homepage
- [ ] Página de cabaña
- [ ] Calendario (debe ser usable con el dedo)
- [ ] Formulario de reserva
- [ ] Página de pago
- [ ] Página de confirmación

**Criterios:**
- [ ] No hay scroll horizontal
- [ ] Texto legible sin zoom
- [ ] Botones fáciles de presionar (mínimo 44x44px)
- [ ] Formularios no se salen de la pantalla
- [ ] Menú móvil funciona
- [ ] Imágenes se adaptan

---

**📱 Tablet (768px - 1024px)**
- iPad
- iPad Pro
- Android Tablet

**Criterios:**
- [ ] Layout usa el espacio eficientemente
- [ ] Grid de cabañas se adapta (2 columnas)
- [ ] Sidebar no colapsa innecesariamente

---

**💻 Desktop (1280px+)**
- Chrome
- Firefox
- Safari
- Edge

**Criterios:**
- [ ] Layout máximo 1400px centrado
- [ ] Sidebar de reserva sticky funciona
- [ ] Hover states funcionan
- [ ] No hay elementos cortados

---

## **PASO 5: Testing de Performance y SEO**

### **Herramienta: Google PageSpeed Insights**

1. Ir a: https://pagespeed.web.dev/
2. Analizar: `https://tresmorroscoliumo.cl`

**Objetivos mínimos:**
- [ ] Performance: ≥ 80
- [ ] Accessibility: ≥ 90
- [ ] Best Practices: ≥ 90
- [ ] SEO: ≥ 90

**Métricas Core Web Vitals:**
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

---

### **Herramienta: Lighthouse (Chrome DevTools)**

```bash
# Auditoría local
1. Abrir Chrome DevTools (F12)
2. Ir a tab "Lighthouse"
3. Seleccionar:
   - Mode: Navigation
   - Device: Mobile y Desktop
   - Categories: Todas
4. Click "Analyze page load"
```

**Revisar y arreglar:**
- [ ] Imágenes optimizadas (WebP o comprimidas)
- [ ] Fuentes optimizadas
- [ ] JavaScript minificado
- [ ] CSS no bloqueante
- [ ] Meta tags correctos
- [ ] Alt text en imágenes
- [ ] Links tienen texto descriptivo

---

## **PASO 6: Testing de Edge Cases**

### **Test 6.1: Formularios con Datos Inválidos**

**Email inválido:**
```
Input: "test@"
Esperado: Error "Email inválido"
```

**Teléfono muy corto:**
```
Input: "123"
Esperado: Error "Teléfono muy corto"
```

**Nombre muy corto:**
```
Input: "A"
Esperado: Error "Nombre muy corto"
```

**Fechas en el pasado:**
```
Start date: Ayer
Esperado: Error o fechas deshabilitadas en calendario
```

---

### **Test 6.2: Disponibilidad**

**Día ya reservado:**
- [ ] Aparece en rojo en el calendario
- [ ] No se puede seleccionar

**Hold temporal:**
- [ ] Aparece en amarillo
- [ ] Expira después de 20 minutos

**Bloqueo administrativo:**
- [ ] Aparece en gris
- [ ] No se puede seleccionar

---

### **Test 6.3: Límites de Capacidad**

**Menos del mínimo:**
```
Party size: 0
Esperado: Error o botón - deshabilitado
```

**Más del máximo:**
```
Party size: 10 (si máximo es 6)
Esperado: Error o botón + deshabilitado
```

---

### **Test 6.4: Pagos**

**Tarjeta rechazada:**
- [ ] Webhook recibe status = 'rejected'
- [ ] Booking mantiene status 'pending'
- [ ] Usuario puede reintentar

**Pago cancelado por usuario:**
- [ ] Webhook recibe status = 'cancelled'
- [ ] Booking cambia a 'canceled'
- [ ] Usuario ve mensaje apropiado

---

## **PASO 7: Testing de Seguridad Básica**

### **Test 7.1: Variables de Entorno**

**Verificar que NO están expuestas:**
```bash
# Buscar en el código fuente del navegador
curl https://tresmorroscoliumo.cl | grep "SUPABASE_SERVICE_ROLE_KEY"
# No debe encontrar nada

curl https://tresmorroscoliumo.cl | grep "FLOW_SECRET_KEY"
# No debe encontrar nada

curl https://tresmorroscoliumo.cl | grep "ADMIN_PASSWORD"
# No debe encontrar nada
```

**Solo deben estar expuestas variables `NEXT_PUBLIC_*`:**
- [ ] NEXT_PUBLIC_SUPABASE_URL ✅
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- [ ] NEXT_PUBLIC_SITE_URL ✅

---

### **Test 7.2: Admin Panel**

**Sin autenticación:**
```bash
# Logout
# Intentar acceder a /admin
curl -I https://tresmorroscoliumo.cl/admin
# Debe redirigir a /admin/login (302)
```

**Webhook protegido:**
```bash
# Sin signature
curl -X POST https://tresmorroscoliumo.cl/api/payments/flow/webhook
# Debe devolver error 401 o 400
```

**Cron jobs protegidos:**
```bash
# Sin secret
curl -X POST https://tresmorroscoliumo.cl/api/jobs/expire-holds
# Debe devolver error 401
```

---

## **PASO 8: Documentar Bugs y Crear Issues**

### **Template de Bug Report:**

```markdown
## 🐛 Bug: [Título breve]

**Descripción:**
[Describe qué está mal]

**Pasos para reproducir:**
1. Ir a [página]
2. Click en [botón]
3. ...

**Resultado esperado:**
[Qué debería pasar]

**Resultado actual:**
[Qué pasa realmente]

**Screenshots:**
[Si aplica]

**Entorno:**
- Dispositivo: [iPhone 14 / Desktop / etc]
- Navegador: [Chrome 120 / Safari / etc]
- URL: [https://...]

**Prioridad:**
- [ ] Crítico (bloquea funcionalidad principal)
- [ ] Alto (afecta UX significativamente)
- [ ] Medio (molesto pero no bloquea)
- [ ] Bajo (cosmético)

**Asignado a:** NikoRNJ
```

---

## **PASO 9: Checklist de Lanzamiento**

### **Pre-Lanzamiento (hacer antes de abrir al público):**

**Funcionalidad:**
- [ ] Flujo de reserva completo funciona sin errores
- [ ] Pagos con Flow funcionan en producción
- [ ] Emails se envían correctamente
- [ ] Panel admin accesible y funcional
- [ ] Cron jobs configurados y funcionando
- [ ] Backups automáticos activos

**Contenido:**
- [ ] Información de las 3 cabañas es correcta
- [ ] Precios están actualizados
- [ ] Fotos de las cabañas subidas (mínimo 3 por cabaña)
- [ ] Descripción detallada de cada cabaña
- [ ] Políticas de cancelación claras
- [ ] Términos y condiciones presentes
- [ ] Información de contacto correcta

**Técnico:**
- [ ] SSL activo (https://)
- [ ] Dominio apuntando correctamente
- [ ] Performance > 80 en PageSpeed
- [ ] SEO > 90
- [ ] No hay errores en logs de PM2
- [ ] No hay errores en consola del navegador
- [ ] Responsive en móvil, tablet y desktop
- [ ] Funciona en Chrome, Firefox, Safari, Edge

**Legal:**
- [ ] Términos y condiciones revisados por abogado
- [ ] Política de privacidad presente
- [ ] Cumplimiento con ley de protección de datos chilena
- [ ] Flow cuenta verificada (no sandbox)
- [ ] Boleta electrónica configurada (si aplica)

**Marketing:**
- [ ] Meta tags de redes sociales (Open Graph)
- [ ] Favicon presente
- [ ] Google Analytics configurado (opcional)
- [ ] Facebook Pixel configurado (opcional)
- [ ] Google My Business creado (opcional)

**Comunicación:**
- [ ] Email de contacto monitorizado
- [ ] Teléfono de contacto activo
- [ ] WhatsApp Business configurado (opcional)
- [ ] Redes sociales creadas (Instagram, Facebook)

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 9**

### **Checklist Final:**

```bash
# Ejecutar todas las pruebas
npm run test  # Si hay tests automatizados

# Verificar logs
ssh deploy@IP "pm2 logs --lines 100 --nostream"
# No debe haber errores críticos

# Verificar salud de la aplicación
curl https://tresmorroscoliumo.cl/api/health
# Debe devolver: {"status":"ok",...}

# Verificar que DB está respondiendo
# En Supabase Dashboard → SQL Editor
SELECT COUNT(*) FROM cabins;
# Debe devolver: 3

# Verificar eventos recientes
SELECT * FROM api_events ORDER BY created_at DESC LIMIT 10;
# Debe mostrar eventos sin errores críticos
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 9**

- [ ] Flujo de reserva completo probado exitosamente
- [ ] Conflictos de fechas se manejan correctamente
- [ ] Expiración de holds funciona
- [ ] Email de confirmación llega y se ve bien
- [ ] Email de recordatorio llega y se ve bien
- [ ] Panel admin funciona completamente
- [ ] Responsive en todos los dispositivos
- [ ] Performance > 80 en PageSpeed
- [ ] SEO > 90 en PageSpeed
- [ ] Formularios validan correctamente
- [ ] Edge cases manejados
- [ ] Seguridad básica verificada
- [ ] Bugs documentados en GitHub Issues
- [ ] Checklist de lanzamiento completado
- [ ] Todo listo para producción

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
# Crear tag de versión 1.0
git tag -a v1.0.0 -m "Release v1.0.0 - Lanzamiento inicial"
git push origin v1.0.0

# Commit final
git add .
git commit -m "chore: iteration 9 - testing complete, ready for launch"
git push origin main
```

**SIGUIENTE:** 10-TROUBLESHOOTING.md (Guía de resolución de problemas)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/10-TROUBLESHOOTING.md

---

**FIN DE LA ITERACIÓN 9**