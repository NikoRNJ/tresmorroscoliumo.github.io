# Análisis Exhaustivo de Funciones y Sistemas

Panorama completo de los módulos implementados hasta la fecha. Se agrupan por capa para facilitar el rastreo de responsabilidades y dependencias.

## 1. Frontend (Next.js App Router)

| Módulo | Export(s) | Descripción & Dependencias |
| --- | --- | --- |
| `app/layout.tsx` | `RootLayout` | Envuelve toda la app con `<Header/>`, `<Footer/>`, define `metadata` y `viewport` (SEO y social cards). |
| `app/not-found.tsx` | `NotFound` | Página 404 personalizada coherente con el tema oscuro. |
| `app/page.tsx` | `Home` | Server component que obtiene `getActiveCabins()` y renderiza `Hero`, `CabinsSection`, `Gallery`, `LocationSection`, `ContactForm`. |
| `app/cabanas/[slug]/page.tsx` | `generateMetadata`, `generateStaticParams`, `CabinPage` | Página de detalle: carga cabaña vía `getCabinBySlug`, compone hero + `BookingWizard`. Usa imágenes dinámicas con Next Image. |
| `app/pago/page.tsx` | `PaymentPageContent`, `PaymentPage` | Cliente: lee `booking` desde `/api/bookings/[id]`, muestra resumen, timer e inicia pago llamando a `/api/payments/flow/create`. |
| `app/pago/confirmacion/page.tsx` | `PaymentConfirmationContent`, `PaymentConfirmationPage` | Polling contra `/api/bookings/[id]` para mostrar estados `paid/cancelled/pending`. |
| `app/admin/layout.tsx` | `AdminLayout` | Server component que llama `requireAdmin()` y muestra `AdminNav` con contenido protegido. |
| `app/admin/page.tsx` | `AdminDashboard` | Consulta Supabase directamente para métricas del mes (ingresos, reservas, ocupación) y próximas llegadas. |
| `app/admin/login/page.tsx` | `AdminLoginPage` | Formulario cliente que llama `/api/admin/login` y persiste cookie vía `createAdminSession`. |
| `app/admin/reservas/page.tsx` | `AdminBookingsPage` | Lista reservas filtrables por estado (`pending`, `paid`, `expired`, `canceled`). |
| `app/admin/reservas/[id]/page.tsx` | `AdminBookingDetailPage` | Vista detallada de una reserva (datos del cliente, estancia, pagos, notas). |

## 2. Componentes de Presentación

### 2.1. Marketing
- `components/sections/home/Hero.tsx`: sección principal con CTA y desplazamiento suave.
- `components/features/cabins/CabinsSection.tsx` + `CabinCard.tsx`: grid responsive de cabañas (usa `formatPrice`, chips de amenities).
- `components/features/gallery/Gallery.tsx`: tabs de galería con imágenes locales (cuatro categorías).
- `components/sections/home/LocationSection.tsx`: iframe de Google Maps y tarjetas de accesos/entorno.
- `components/layout/Header.tsx` / `Footer.tsx`: navegación sticky y pie con datos de contacto.
- `components/forms/ContactForm.tsx`: formulario controlado que intenta llamar `POST /api/contact` (aún no implementado en backend).

### 2.2. Booking Flow
- `components/booking/AvailabilityCalendar.tsx`: integra `react-day-picker`, consume el hook `useAvailability` y pinta estados `available/pending/booked/blocked`.
- `components/booking/BookingWizard.tsx`: orquesta pasos `dates → party-size → details`.
- `components/booking/BookingForm.tsx`: formulario con `react-hook-form` + `zod`, calcula precios con `calculatePrice` y crea holds vía `/api/bookings/hold`.
- `components/booking/BookingSummary.tsx`: muestra desglose (base, extras, jacuzzi).
- `components/booking/JacuzziSelector.tsx`: permite seleccionar días específicos dentro del rango.
- `components/booking/BookingSidebar.tsx`: versión legacy (todavía presente, pero reemplazada por `BookingWizard`).

### 2.3. UI utilitaria
- `components/ui/Button.tsx`: botón con variantes (`primary`, `secondary`, `outline`, `ghost`) y estados de carga.
- `components/ui/Card.tsx`: contenedor con `CardImage`, `CardContent`, `CardTitle`, `CardDescription`.
- `components/ui/Container.tsx`: wrapper responsivo + `Section` para espaciados consistentes.
- `components/admin/AdminNav.tsx`: navegación lateral del panel (links a dashboard, reservas y futuras secciones).

## 3. API Routes (Next.js)

| Ruta | Método(s) | Función Principal |
| --- | --- | --- |
| `/api/health` | `GET` | Verifica conectividad con Supabase (`cabins` limit 1). |
| `/api/availability` | `GET` | Valida query con `availabilityQuerySchema`, consulta reservas y bloqueos (`bookings`, `admin_blocks`) y devuelve días en cuatro estados. |
| `/api/bookings/hold` | `POST` | Valida payload con `createBookingHoldSchema`, verifica overlaps, calcula precio (`calculatePrice`), crea booking `pending` con `expires_at` +20 min y devuelve `redirectUrl` hacia `/pago`. |
| `/api/bookings/[id]` | `GET` | Retorna reserva + `cabin`, marca si expiró y el tiempo restante en segundos (usado en páginas de pago). |
| `/api/payments/flow/create` | `POST` | Crea orden en Flow (o mock), guarda `flow_order_id` y, en modo sandbox sin credenciales, marca la reserva como `paid`. |
| `/api/payments/flow/webhook` | `POST`, `GET` | Verifica firma, consulta `getPaymentStatus`, actualiza booking a `paid/canceled`, registra eventos y dispara `sendBookingConfirmation`. GET sirve como health-check del webhook. |
| `/api/jobs/expire-holds` | `POST` | Endpoint cron-protegido (`x-cron-secret`) que marca como `expired` todos los holds vencidos y loguea en `api_events`. |
| `/api/admin/login` | `POST` | Verifica contraseña (`verifyAdminPassword`), crea cookie de sesión y registra evento de login. |
| `/api/admin/logout` | `POST` | Elimina cookie `admin_session`. |

> No existe aún `/api/contact`, aunque el formulario del landing lo intenta consumir.

## 4. Lógica de Dominio (`lib/`)

| Archivo | Función(es) | Detalles |
| --- | --- | --- |
| `lib/data/cabins.ts` | `getActiveCabins`, `getCabinBySlug`, `getCabinSlugs` | Wrap de Supabase con `cache()` para evitar llamadas repetidas desde server components. |
| `lib/hooks/useAvailability.ts` | `useAvailability` | Hook cliente que llama `/api/availability` según `cabinId` + mes y expone `availability`, `isLoading`, `error`, `refetch`. |
| `lib/validations/booking.ts` | `availabilityQuerySchema`, `createBookingHoldSchema`, `validateJacuzziDays`, `getDatesBetween` | Validaciones `zod` y helpers de fechas. |
| `lib/utils/pricing.ts` | `calculatePrice`, `getIncludedGuests`, `formatPriceBreakdown` | Determina noches, extras por persona, jacuzzi y total (usa `differenceInDays`). |
| `lib/utils/format.ts` | `formatPrice`, `formatDate`, `formatDateRange`, `formatNights`, `formatGuests` | Helpers de UI (Intl). |
| `lib/utils/cn.ts` | `cn` | Wrapper `clsx` + `tailwind-merge`. |
| `lib/auth/admin.ts` | `verifyAdminPassword`, `createAdminSession`, `isAdminAuthenticated`, `destroyAdminSession`, `requireAdmin` | Autenticación básica por cookie + hash SHA256. |
| `lib/supabase/client.ts` / `server.ts` | `supabase`, `supabaseAdmin` | Clientes inicializados con `NEXT_PUBLIC_*` (anon) y `SUPABASE_SERVICE_ROLE_KEY` (server). |
| `lib/flow/client.ts` | `FlowClient` (`createPayment`, `getPaymentStatus`, `validateWebhookSignature`) | Llama APIs de Flow, firma parámetros (HMAC-SHA256), modo mock si faltan credenciales. |
| `lib/email/client.ts` | `EmailClient` (`send`, `isReady`, `getDefaultFrom`) | Singleton para SendGrid con inicialización lazy. |
| `lib/email/service.ts` | `sendBookingConfirmation` | Renderiza HTML/texto (`templates/booking-confirmation`) y registra eventos `api_events`. |
| `lib/email/templates/booking-confirmation.ts` | `generateBookingConfirmationHTML/TEXT` | Plantilla html responsiva y versión plaintext, usa `date-fns`. |

## 5. Tipos y Esquema
- `types/database.ts`: tipos generados del esquema Supabase (cabins, bookings, admin_blocks, api_events). Define alias `Cabin`, `Booking`, etc.
- `types/booking.ts`: contratos de `BookingFormData`, `CreateHoldResponse`, `BookingError`, `BookingHold`.
- `types/flow.ts`: `FlowPaymentParams`, `FlowPaymentResponse`, `FlowPaymentStatus`, `FlowPaymentStatusCode`.
- `types/email.ts`: estructuras para emails (recipientes, attachments, confirmaciones, recordatorios, contacto).

## 6. Migraciones y SQL
- `supabase-schema.sql`: crea tablas principales con constraints y seeds de 3 cabañas.
- `migrations/iteration-5-flow-integration.sql`: añade campos de Flow (`flow_order_id`, `flow_payment_data`, `confirmation_sent_at`), triggers y seeding de eventos.
- `UPDATE_SCHEMA_PRICING.sql`: parche específico para `price_per_extra_person`.

## 7. Documentación y Procesos
- `Documentacion/AI-*`: briefs de negocio, especificaciones técnicas y secuencia de instrucciones para la IA.
- `Documentacion/desarrollo/*`: registros de buenas prácticas, bugs, optimizaciones y pasos completados por iteración.
- `COMO-VER-EL-PROYECTO.md`: manual operativo para levantar entorno local y pruebas básicas.

---

### Relación Entre Sistemas
1. **Reserva**: `BookingWizard` → `BookingForm` (cliente) valida con `zod` → `POST /api/bookings/hold` (server) → crea hold + redirige a `/pago`.
2. **Pago**: `/pago` muestra datos de hold, inicia `flowClient.createPayment`. Flow redirige al PSP y notifica vía `/api/payments/flow/webhook`, que marca la reserva `paid` y envía email.
3. **Disponibilidad**: `useAvailability` → `/api/availability` combina `bookings` (`pending/paid`) + `admin_blocks` para colorear calendario.
4. **Panel Admin**: páginas server-side usan `supabaseAdmin` directamente (sin API intermedia) para métricas, listados y detalles.
5. **Mantenimiento**: `POST /api/jobs/expire-holds` (cron manual) limpia holds vencidos para liberar cupos.

Esta radiografía cubre las funciones implementadas a noviembre 2025 y sirve como base para priorizar mejoras o detectar duplicidad de esfuerzos en iteraciones futuras.
