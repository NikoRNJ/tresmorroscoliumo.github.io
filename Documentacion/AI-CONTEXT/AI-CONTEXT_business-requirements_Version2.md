# 📊 REQUISITOS DE NEGOCIO - Tres Morros de Coliumo

**PROYECTO:** Sistema de Reservas para Cabañas Turísticas  
**CLIENTE:** NikoRNJ  
**FECHA:** 2025-11-11  
**VERSIÓN:** 1.0.0

---

## **1. VISIÓN DEL NEGOCIO**

### **1.1 Descripción del Negocio**

**Tres Morros de Coliumo** es un emprendimiento de turismo rural que ofrece arriendo de cabañas para descanso y vacaciones en la localidad costera de Coliumo, Región del Bío-Bío, Chile.

**Propuesta de Valor:**
- Ubicación privilegiada frente al mar
- Ambiente tranquilo y familiar
- Experiencia auténtica de vida costera
- Cabañas completamente equipadas
- Acceso a playas y caletas de pescadores

### **1.2 Problema a Resolver**

**Situación Actual:**
- Gestión manual de reservas (WhatsApp, llamadas)
- Sin visibilidad de disponibilidad en tiempo real
- Proceso de pago engorroso (transferencias manuales)
- Pérdida de reservas por falta de confirmación rápida
- Dificultad para gestionar múltiples cabañas
- Sin registro centralizado de clientes

**Impacto:**
- Pérdida de ingresos por dobles reservas
- Tiempo excesivo en coordinación con clientes
- Mala experiencia del usuario
- Imposibilidad de escalar el negocio

### **1.3 Solución Propuesta**

Sistema web completo que permita:
- Reservas online 24/7
- Disponibilidad en tiempo real
- Pagos automáticos con Webpay
- Confirmaciones instantáneas por email
- Panel de administración para gestionar todo
- Historial completo de reservas

---

## **2. OBJETIVOS DEL PROYECTO**

### **2.1 Objetivos de Negocio**

**Objetivo Principal:**
> Aumentar la tasa de conversión de consultas a reservas confirmadas en un 40% durante los primeros 3 meses.

**Objetivos Secundarios:**
1. Reducir el tiempo de gestión de reservas de 30 min a 5 min por reserva
2. Eliminar errores de dobles reservas (actualmente 2-3 por temporada)
3. Capturar datos de clientes para marketing futuro
4. Habilitar reservas fuera del horario laboral (actualmente 0%)
5. Mejorar la percepción de profesionalismo de marca

### **2.2 Objetivos Técnicos**

1. Sistema accesible desde cualquier dispositivo (responsive)
2. Disponibilidad del sistema: 99% uptime
3. Tiempo de carga de página: < 3 segundos
4. Proceso de reserva completable en < 5 minutos
5. Integración con Flow para pagos seguros
6. Backup automático de datos

### **2.3 Métricas de Éxito**

| Métrica | Baseline | Meta (3 meses) |
|---------|----------|----------------|
| Tasa de conversión consulta→reserva | 30% | 42% |
| Tiempo promedio de reserva | 30 min | 5 min |
| Reservas fuera de horario | 0% | 25% |
| Errores de doble reserva | 2-3/mes | 0/mes |
| Satisfacción del cliente (NPS) | N/A | > 8/10 |

---

## **3. STAKEHOLDERS**

### **3.1 Usuarios Finales (Clientes)**

**Perfil Demográfico:**
- Edad: 25-55 años
- NSE: C2, C3 (medio, medio-alto)
- Ubicación: Principalmente Región del Bío-Bío y Metropolitana
- Dispositivos: 70% móvil, 30% desktop

**Motivaciones:**
- Buscar descanso en la naturaleza
- Escapar de la ciudad
- Vacaciones familiares
- Fin de semana romántico

**Frustraciones Actuales:**
- "No sé si hay disponibilidad sin preguntar"
- "Tengo que esperar respuesta del dueño"
- "El proceso de pago es confuso"
- "No estoy seguro si mi reserva quedó confirmada"

**Necesidades:**
- Ver disponibilidad inmediata
- Proceso de reserva simple y rápido
- Pago seguro online
- Confirmación instantánea
- Información clara de la cabaña

### **3.2 Administrador (Dueño del Negocio)**

**Perfil:**
- NikoRNJ
- Emprendedor individual
- Conocimientos técnicos medios
- Tiempo limitado para gestión manual

**Necesidades:**
- Ver todas las reservas de un vistazo
- Dashboard con métricas clave
- Gestión simple de contenido (fotos, precios)
- Notificaciones de nuevas reservas
- Bloquear fechas para mantenimiento
- Exportar datos de clientes

**Frustraciones Actuales:**
- "Pierdo tiempo respondiendo consultas repetitivas"
- "A veces olvido actualizar disponibilidad"
- "No tengo registro de mis ingresos mensuales"
- "Es difícil planificar mantenimiento"

---

## **4. ALCANCE DEL PROYECTO**

### **4.1 Dentro del Alcance (MVP v1.0)**

**Funcionalidades Principales:**

1. **Catálogo de Cabañas**
   - Listado de 3 cabañas con fotos
   - Información detallada (capacidad, amenidades, precio)
   - Galería de imágenes

2. **Sistema de Reservas**
   - Calendario interactivo de disponibilidad
   - Selección de fechas y personas
   - Opción de jacuzzi (adicional)
   - Formulario de datos del cliente
   - Hold temporal de 20 minutos

3. **Pagos Online**
   - Integración con Flow (Webpay Plus)
   - Cálculo automático de precio
   - Página de pago segura
   - Confirmación automática

4. **Notificaciones por Email**
   - Confirmación de reserva pagada
   - Recordatorio 3 días antes del check-in
   - Email de contacto para consultas

5. **Panel de Administración**
   - Login seguro
   - Dashboard con KPIs
   - Listado y detalle de reservas
   - Gestión de cabañas (editar info, precios)
   - Upload de imágenes
   - Bloqueos de fechas para mantenimiento

6. **Automatizaciones**
   - Expiración automática de holds (20 min)
   - Envío de recordatorios (cron job)
   - Actualización de disponibilidad en tiempo real

### **4.2 Fuera del Alcance (Futuras Versiones)**

**No incluido en v1.0:**
- Sistema de cupones/descuentos
- Programa de fidelidad
- Reservas recurrentes
- Multi-idioma (solo español)
- App móvil nativa
- Sistema de reviews/calificaciones
- Chat en vivo
- Integración con Airbnb/Booking
- Facturación electrónica automática
- Sistema de check-in/check-out digital
- Gestión de inventario (ropa de cama, etc)
- CRM avanzado

---

## **5. CARACTERÍSTICAS DE LAS CABAÑAS**

### **5.1 Vegas del Coliumo**

**Características:**
- **Capacidad Base:** 2 personas
- **Capacidad Máxima:** 6 personas
- **Precio Base:** $65.000 CLP/noche
- **Precio Jacuzzi:** $20.000 CLP/día (opcional)

**Descripción:**
> Cabaña amplia con vista panorámica al mar, terraza privada y acceso directo a la playa. Perfecta para familias que buscan tranquilidad y contacto con la naturaleza.

**Amenidades:**
- Terraza privada con vista al mar
- Acceso directo a la playa
- Parrilla exterior
- Cocina completamente equipada
- WiFi de alta velocidad
- Estacionamiento privado
- Ropa de cama y toallas incluidas

**Ubicación:**
Zona alta con vistas privilegiadas al Océano Pacífico

---

### **5.2 Caleta del Medio**

**Características:**
- **Capacidad Base:** 2 personas
- **Capacidad Máxima:** 5 personas
- **Precio Base:** $60.000 CLP/noche
- **Precio Jacuzzi:** $18.000 CLP/día (opcional)

**Descripción:**
> Acogedora cabaña cercana a la caleta de pescadores artesanales. Ideal para parejas o familias pequeñas que desean experimentar la vida costera auténtica.

**Amenidades:**
- Proximidad a caleta de pescadores
- Vista al mar
- Cocina equipada
- Parrilla
- WiFi
- Estacionamiento
- Ambiente tranquilo y familiar

**Ubicación:**
A pasos de la caleta de pescadores, ambiente auténtico

---

### **5.3 Los Morros**

**Características:**
- **Capacidad Base:** 2 personas
- **Capacidad Máxima:** 6 personas
- **Precio Base:** $70.000 CLP/noche
- **Precio Jacuzzi:** $22.000 CLP/día (opcional)

**Descripción:**
> Cabaña espaciosa y luminosa con jacuzzi opcional y vistas espectaculares a los característicos morros de Coliumo. Perfecta para grupos o familias grandes.

**Amenidades:**
- Vista privilegiada a los Morros
- Jacuzzi disponible
- Living amplio y luminoso
- Cocina completa con todos los utensilios
- Parrilla de lujo
- WiFi de alta velocidad
- Estacionamiento amplio
- Terraza con mobiliario exterior

**Ubicación:**
Vista privilegiada a los morros, ambiente de lujo campestre

---

## **6. REGLAS DE NEGOCIO**

### **6.1 Reservas**

**Política de Reserva:**
1. Mínimo de estadía: 1 noche
2. Máximo de estadía: 30 noches
3. Check-in: A partir de las 15:00 hrs
4. Check-out: Hasta las 12:00 hrs
5. Hold temporal: 20 minutos para completar el pago
6. No se aceptan reservas con menos de 24 horas de anticipación

**Capacidad:**
- Precio base incluye hasta la capacidad base de la cabaña
- Cada persona adicional NO tiene cargo extra (hasta el máximo)
- No se puede exceder la capacidad máxima

**Jacuzzi:**
- Opcional para todas las cabañas
- Se cobra por día de uso (no por noche de estadía)
- El cliente puede elegir qué días específicos lo quiere
- Ejemplo: Reserva de 3 noches, jacuzzi solo días 1 y 3

### **6.2 Precios**

**Cálculo del Precio Total:**
```
Precio Total = (Precio Base por Noche × Número de Noches) + (Precio Jacuzzi × Días con Jacuzzi)
```

**Ejemplo:**
- Cabaña: Vegas del Coliumo ($65.000/noche)
- Fechas: 25-28 Diciembre (3 noches)
- Personas: 4
- Jacuzzi: Días 25 y 26 (2 días)

```
Cálculo:
Base: $65.000 × 3 noches = $195.000
Jacuzzi: $20.000 × 2 días = $40.000
Total: $235.000 CLP
```

**Política de Precios:**
- Los precios NO varían por temporada (por ahora)
- Los precios NO varían por cantidad de personas
- No hay cargos ocultos
- El precio mostrado es el precio final (sin impuestos adicionales)

### **6.3 Cancelaciones**

**Política de Cancelación (v1.0 - Simple):**
1. **No hay cancelaciones con reembolso**
2. El pago NO es reembolsable una vez confirmado
3. Se puede reprogramar con 15 días de anticipación (1 vez)

**Excepciones:**
- Emergencias médicas (con certificado)
- Casos de fuerza mayor
- Decisión discrecional del administrador

**Para Futuras Versiones:**
- Implementar política escalonada de cancelación
- Reembolso parcial según anticipación

### **6.4 Bloqueos Administrativos**

El administrador puede:
1. Bloquear fechas específicas de una o todas las cabañas
2. Motivos comunes: mantenimiento, reparaciones, uso personal
3. Las fechas bloqueadas aparecen como "No disponibles" en el calendario
4. No se puede reservar sobre fechas bloqueadas

---

## **7. EXPERIENCIA DEL USUARIO**

### **7.1 User Journey - Reserva Exitosa**

**Paso 1: Descubrimiento**
- Usuario llega al sitio (Google, redes sociales, boca a boca)
- Ve el home con las 3 cabañas destacadas
- Click en "Ver Cabañas" o directamente en una cabaña

**Paso 2: Exploración**
- Usuario revisa fotos de la cabaña
- Lee descripción y amenidades
- Verifica precio y capacidad
- Ve el calendario de disponibilidad

**Paso 3: Selección de Fechas**
- Usuario selecciona rango de fechas en el calendario
- Sistema muestra:
  - Verde: Disponible
  - Amarillo: Hold temporal de otro usuario
  - Rojo: Ya reservado
  - Gris: Bloqueado por admin
- Usuario elige fechas disponibles
- Click "Continuar"

**Paso 4: Configuración**
- Usuario selecciona cantidad de personas (2-6)
- Sistema valida contra capacidad máxima
- Usuario decide si quiere jacuzzi
- Si sí, selecciona qué días específicos
- Sistema muestra resumen con precio total
- Click "Continuar"

**Paso 5: Datos Personales**
- Usuario completa formulario:
  - Nombre completo
  - Email
  - Teléfono
  - Comentarios (opcional)
- Usuario acepta términos y condiciones
- Sistema muestra resumen final
- Click "Continuar al Pago"

**Paso 6: Hold Temporal**
- Sistema crea hold de 20 minutos
- Las fechas quedan "amarillas" para otros usuarios
- Usuario ve página de pago con:
  - Timer de 20 minutos
  - Resumen de la reserva
  - Botón "Pagar con Webpay"

**Paso 7: Pago**
- Click en "Pagar con Webpay"
- Redirección a Flow/Webpay
- Usuario ingresa datos de tarjeta
- Confirma pago
- Webpay procesa (2-10 segundos)

**Paso 8: Confirmación**
- Flow notifica al sistema vía webhook
- Sistema actualiza reserva a "Pagada"
- Redirección a página de confirmación
- Usuario ve mensaje de éxito
- Recibe email de confirmación

**Paso 9: Recordatorio**
- 3 días antes del check-in
- Sistema envía email automático con:
  - Recordatorio de fechas
  - Instrucciones de llegada
  - Información de contacto

**Paso 10: Estadía**
- Usuario llega y disfruta
- (Check-in/out manual por ahora)

### **7.2 User Journey - Reserva Fallida (Hold Expirado)**

1. Usuario completa pasos 1-6 normalmente
2. Usuario se distrae / tiene problemas
3. Pasan 20 minutos sin pagar
4. Sistema automáticamente:
   - Cambia status de "pending" a "expired"
   - Libera las fechas (vuelven a verde)
5. Usuario intenta pagar
6. Sistema muestra: "Tu reserva ha expirado. Por favor reserva nuevamente."
7. Usuario puede volver al inicio del proceso

---

## **8. FLUJOS ADMINISTRATIVOS**

### **8.1 Flujo de Gestión Diaria**

**Mañana (9:00 AM):**
1. Admin hace login en `/admin`
2. Revisa dashboard:
   - Ingresos del mes
   - Reservas del día
   - Próximas llegadas
3. Revisa notificaciones de nuevas reservas (email)

**Durante el Día:**
- Recibe emails de nuevas reservas
- Puede revisar detalles en el panel admin
- Contacta a clientes si es necesario (por teléfono/WhatsApp)

**Semanal:**
- Revisa calendario de ocupación
- Planifica mantenimiento
- Bloquea fechas si es necesario
- Actualiza precios (si cambian temporada)

**Mensual:**
- Revisa KPIs en dashboard
- Exporta datos de clientes (futuro)
- Revisa ingresos totales

### **8.2 Flujo de Mantenimiento de Cabaña**

1. Admin identifica necesidad de mantenimiento
2. Login en panel admin
3. Ir a "Bloqueos"
4. Seleccionar cabaña
5. Seleccionar rango de fechas
6. Indicar razón (ej: "Reparación de techumbre")
7. Guardar
8. Las fechas se bloquean automáticamente
9. No se pueden hacer nuevas reservas en esas fechas

### **8.3 Flujo de Actualización de Contenido**

**Actualizar Precio de una Cabaña:**
1. Login → Cabañas → Seleccionar cabaña
2. Editar "Precio Base" o "Precio Jacuzzi"
3. Guardar
4. El nuevo precio se aplica a futuras reservas
5. Reservas existentes mantienen precio original

**Agregar/Eliminar Fotos:**
1. Login → Cabañas → Seleccionar cabaña
2. Scroll a "Galería de Imágenes"
3. Click "Subir Imagen"
4. Seleccionar archivo (max 5 MB, JPG/PNG/WebP)
5. Sistema optimiza y sube a Supabase Storage
6. Foto aparece en el sitio público inmediatamente

---

## **9. REQUISITOS NO FUNCIONALES**

### **9.1 Performance**

- **Tiempo de carga inicial:** < 3 segundos (3G)
- **Time to Interactive:** < 5 segundos
- **Lighthouse Performance Score:** > 80
- **API Response Time:** < 500ms (p95)

### **9.2 Disponibilidad**

- **Uptime:** 99% mensual
- **Tiempo de recuperación ante fallas:** < 1 hora
- **Backups:** Diarios, retención 7 días

### **9.3 Seguridad**

- **HTTPS:** Obligatorio en producción
- **Encriptación:** SSL/TLS 1.3
- **Datos sensibles:** No almacenar datos de tarjetas
- **Autenticación admin:** Contraseña + sesión
- **Rate limiting:** 100 requests/minuto por IP
- **Logs de auditoría:** Guardar eventos críticos

### **9.4 Escalabilidad**

**MVP (v1.0):**
- Soportar: 3 cabañas
- Reservas concurrentes: 10 simultáneas
- Tráfico: 1,000 visitas/mes

**Futuro (v2.0+):**
- Soportar: hasta 10 cabañas
- Reservas concurrentes: 50 simultáneas
- Tráfico: 10,000 visitas/mes

### **9.5 Usabilidad**

- **Responsive:** Funcionar en móvil, tablet y desktop
- **Navegadores:** Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- **Accesibilidad:** WCAG 2.1 nivel AA
- **Tiempo de aprendizaje (admin):** < 30 minutos
- **Tiempo de aprendizaje (usuario):** < 2 minutos

### **9.6 Compatibilidad**

**Dispositivos Móviles:**
- iOS 14+
- Android 10+
- Chrome Mobile
- Safari Mobile

**Desktop:**
- Windows 10+
- macOS 11+
- Linux (Ubuntu 20.04+)

---

## **10. RESTRICCIONES Y LIMITACIONES**

### **10.1 Presupuesto**

- **Desarrollo:** $0 (proyecto propio)
- **Hosting:** ~$6 USD/mes (DigitalOcean Droplet)
- **Supabase:** Plan Free ($0)
- **SendGrid:** Plan Free ($0, 100 emails/día)
- **Flow:** Comisión por transacción (~2.9% + IVA)
- **Dominio:** ~$15 USD/año

**Total Mensual:** ~$7 USD

### **10.2 Temporales**

- **Tiempo de desarrollo:** 40-50 horas
- **Lanzamiento MVP:** 2 semanas desde inicio
- **Iteraciones:** Semanales

### **10.3 Técnicas**

- **No usar:** Frameworks pesados como Angular
- **No implementar:** Sistema de autenticación complejo (OAuth, etc)
- **Solo español:** No multi-idioma
- **Solo CLP:** No multi-moneda

### **10.4 Legales**

- **Términos y Condiciones:** Deben ser revisados por abogado
- **Política de Privacidad:** Cumplir con Ley de Protección de Datos (Chile)
- **Boletas/Facturas:** Gestión manual (fuera del sistema)

---

## **11. CRITERIOS DE ACEPTACIÓN**

### **11.1 Criterios Generales**

**El sistema se considera aceptable cuando:**

1. **Funcionalidad Completa:**
   - ✅ Todas las funcionalidades del alcance funcionan sin errores críticos
   - ✅ El flujo de reserva completo es exitoso end-to-end
   - ✅ Los pagos se procesan correctamente
   - ✅ Los emails se envían automáticamente

2. **Calidad:**
   - ✅ No hay bugs críticos (que impidan usar el sistema)
   - ✅ Performance > 80 en PageSpeed Insights
   - ✅ Responsive en móvil, tablet y desktop
   - ✅ Accesible desde Chrome, Firefox, Safari, Edge

3. **Seguridad:**
   - ✅ HTTPS activo
   - ✅ Datos sensibles protegidos
   - ✅ Panel admin requiere autenticación
   - ✅ No hay SQL injection ni XSS

4. **Documentación:**
   - ✅ README con instrucciones de instalación
   - ✅ Guía de uso del panel admin
   - ✅ Documentación de troubleshooting

### **11.2 Criterios Específicos por Funcionalidad**

**Reservas:**
- ✅ Usuario puede ver disponibilidad en tiempo real
- ✅ No se permiten reservas superpuestas
- ✅ Hold de 20 minutos funciona correctamente
- ✅ Cálculo de precio es correcto (verificado manualmente)

**Pagos:**
- ✅ Integración con Flow funciona en sandbox
- ✅ Integración con Flow funciona en producción
- ✅ Webhook actualiza estado correctamente
- ✅ Se maneja correctamente pago rechazado

**Emails:**
- ✅ Email de confirmación llega en < 2 minutos
- ✅ Email se ve bien en Gmail, Outlook, Apple Mail
- ✅ Email de recordatorio se envía 3 días antes
- ✅ Cron job de recordatorios ejecuta diariamente

**Panel Admin:**
- ✅ Dashboard muestra KPIs correctos
- ✅ Listado de reservas muestra todas las reservas
- ✅ Filtros de reservas funcionan
- ✅ Edición de cabañas funciona
- ✅ Upload de imágenes funciona

---

## **12. PLAN DE LANZAMIENTO**

### **12.1 Fase de Pre-Lanzamiento**

**Semana 1-2: Desarrollo**
- Implementar todas las funcionalidades
- Testing interno

**Semana 3: Testing**
- Testing con usuarios reales (amigos/familia)
- Corregir bugs encontrados
- Optimizar performance

**Semana 4: Preparación**
- Migrar Flow de sandbox a producción
- Configurar dominio definitivo
- Crear contenido (fotos profesionales)
- Escribir descripciones finales

### **12.2 Lanzamiento Soft (Beta)**

**Objetivo:** Validar el sistema con tráfico real limitado

**Duración:** 2 semanas

**Estrategia:**
1. Anunciar solo a clientes recurrentes (base de WhatsApp)
2. Ofrecer descuento del 10% por ser "beta testers"
3. Solicitar feedback activamente
4. Monitorear métricas diariamente

**Métricas a Observar:**
- Tasa de conversión
- Errores reportados
- Tiempo promedio de reserva
- Abandono en el proceso

### **12.3 Lanzamiento Público**

**Cuando:**
- Después de 2 semanas de beta sin errores críticos
- Al menos 10 reservas exitosas en beta

**Canales de Promoción:**
1. **Google My Business**
   - Crear perfil
   - Subir fotos
   - Link al sitio web

2. **Redes Sociales**
   - Instagram: @tresmorroscoliumo
   - Facebook: Tres Morros de Coliumo
   - Post de lanzamiento
   - Sorteo inicial

3. **SEO Local**
   - Optimizar para "cabañas coliumo"
   - Optimizar para "arriendo cabañas bío bío"
   - Google Search Console

4. **Boca a Boca**
   - Incentivar reviews
   - Programa de referidos (futuro)

---

## **13. MANTENIMIENTO Y EVOLUCIÓN**

### **13.1 Plan de Mantenimiento**

**Diario:**
- Revisar logs de errores
- Responder consultas de clientes
- Verificar reservas nuevas

**Semanal:**
- Análisis de métricas
- Backup manual (verificación)
- Actualización de contenido si es necesario

**Mensual:**
- Actualizar dependencias de npm
- Revisar y optimizar performance
- Análisis de feedback de clientes
- Planificar nuevas features

### **13.2 Roadmap de Futuras Versiones**

**v1.1 (1-2 meses post-lanzamiento):**
- Sistema de cupones de descuento
- Reviews/calificaciones de clientes
- Galería de fotos más avanzada (carrusel)
- FAQ section

**v1.2 (3-4 meses):**
- Política de cancelación flexible
- Exportación de datos a Excel
- Multi-moneda (USD, EUR)
- Mejoras de SEO

**v2.0 (6-12 meses):**
- App móvil nativa (React Native)
- Sistema de fidelidad
- Check-in/check-out digital
- Integración con Airbnb API
- CRM integrado
- Facturación electrónica automática

---

## **14. CONTACTO Y RECURSOS**

**Propietario del Proyecto:**
- Nombre: NikoRNJ
- GitHub: @NikoRNJ

**Recursos:**
- Repositorio: github.com/NikoRNJ/tres-morros-coliumo
- Documentación: /docs
- Issues: github.com/NikoRNJ/tres-morros-coliumo/issues

**Herramientas:**
- Supabase Dashboard: app.supabase.com
- Flow Dashboard: flow.cl
- SendGrid Dashboard: app.sendgrid.com
- DigitalOcean: cloud.digitalocean.com

---

**ÚLTIMA ACTUALIZACIÓN:** 2025-11-11 04:12:54 UTC  
**VERSIÓN:** 1.0.0  
**ESTADO:** ✅ Aprobado para Desarrollo

---

**FIN DE REQUISITOS DE NEGOCIO**