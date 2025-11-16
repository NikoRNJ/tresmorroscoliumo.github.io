# 💳 ITERACIÓN 5: Integración con Flow para Pagos

**OBJETIVO:** Implementar la integración completa con Flow (Webpay Plus) para procesar pagos y confirmar reservas automáticamente.

**DURACIÓN ESTIMADA:** 5-6 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 4 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 4 está 100% completada
- [ ] Sistema de holds funciona correctamente
- [ ] Tienes credenciales de Flow Sandbox
- [ ] Variables de entorno de Flow están configuradas
- [ ] `FLOW_API_KEY`, `FLOW_SECRET_KEY` y `FLOW_BASE_URL` están en `.env.local`

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Cliente de Flow configurado con autenticación HMAC
2. ✅ Creación de órdenes de pago en Flow
3. ✅ Redirección a Webpay Plus
4. ✅ Webhook para confirmar pagos automáticamente
5. ✅ Actualización de estado de reservas a 'paid'
6. ✅ Página de confirmación de pago exitoso
7. ✅ Manejo de pagos rechazados/cancelados
8. ✅ Logs completos de transacciones

---

## **PASO 1: Crear Tipos para Flow**

### **Archivo: `types/flow.ts`**

```typescript
/**
 * Tipos para la integración con Flow API
 * Documentación: https://www.flow.cl/docs/api.html
 */

/**
 * Parámetros para crear una orden de pago
 */
export interface FlowPaymentParams {
  commerceOrder: string; // ID único de la orden (nuestro booking ID)
  subject: string; // Descripción de la compra
  currency: 'CLP'; // Siempre CLP
  amount: number; // Monto total en pesos chilenos (sin decimales)
  email: string; // Email del pagador
  urlConfirmation: string; // URL del webhook
  urlReturn: string; // URL de retorno después del pago
  optional?: string; // Datos adicionales opcionales (JSON string)
}

/**
 * Respuesta al crear una orden de pago
 */
export interface FlowPaymentResponse {
  url: string; // URL para redirigir al usuario
  token: string; // Token de la transacción
  flowOrder: number; // ID de la orden en Flow
}

/**
 * Payload del webhook de confirmación
 */
export interface FlowWebhookPayload {
  token: string; // Token de la transacción
}

/**
 * Respuesta al consultar el estado de un pago
 */
export interface FlowPaymentStatus {
  flowOrder: number; // ID de la orden en Flow
  commerceOrder: string; // Nuestro booking ID
  requestDate: string; // Fecha de creación
  status: number; // 1 = Pendiente, 2 = Pagado, 3 = Rechazado, 4 = Anulado
  subject: string; // Descripción
  currency: string; // Moneda
  amount: number; // Monto
  payer: string; // Email del pagador
  optional?: string; // Datos opcionales
  pending_info?: {
    media: string; // Medio de pago (Webpay, etc)
    date: string; // Fecha
  };
  paymentData?: {
    date: string; // Fecha del pago
    media: string; // Medio de pago usado
    conversionDate?: string;
    conversionRate?: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate?: string;
  };
  merchantId?: string;
}

/**
 * Estados de pago de Flow
 */
export enum FlowPaymentStatusCode {
  PENDING = 1,
  PAID = 2,
  REJECTED = 3,
  CANCELLED = 4,
}
```

---

## **PASO 2: Crear Cliente de Flow**

### **Archivo: `lib/flow/client.ts`**

```typescript
import crypto from 'crypto';
import type {
  FlowPaymentParams,
  FlowPaymentResponse,
  FlowPaymentStatus,
} from '@/types/flow';

/**
 * Cliente para interactuar con Flow API
 * Documentación: https://www.flow.cl/docs/api.html
 */
class FlowClient {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;
    const baseUrl = process.env.FLOW_BASE_URL;

    if (!apiKey || !secretKey || !baseUrl) {
      throw new Error(
        'Missing Flow credentials. Check FLOW_API_KEY, FLOW_SECRET_KEY, and FLOW_BASE_URL'
      );
    }

    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generar firma HMAC SHA256 para autenticar requests
   * Flow requiere firmar todos los parámetros ordenados alfabéticamente
   */
  private sign(params: Record<string, any>): string {
    // Ordenar parámetros alfabéticamente
    const sortedKeys = Object.keys(params).sort();
    
    // Crear string con formato: key=value&key=value
    const dataString = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    // Generar firma HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataString)
      .digest('hex');

    return signature;
  }

  /**
   * Crear una orden de pago en Flow
   * 
   * @param params - Parámetros de la orden
   * @returns URL y token para redirigir al usuario
   */
  async createPayment(params: FlowPaymentParams): Promise<FlowPaymentResponse> {
    try {
      // Agregar API Key a los parámetros
      const paymentParams = {
        apiKey: this.apiKey,
        commerceOrder: params.commerceOrder,
        subject: params.subject,
        currency: params.currency,
        amount: params.amount,
        email: params.email,
        urlConfirmation: params.urlConfirmation,
        urlReturn: params.urlReturn,
        ...(params.optional && { optional: params.optional }),
      };

      // Generar firma
      const signature = this.sign(paymentParams);

      // Crear URLSearchParams para el POST
      const formData = new URLSearchParams();
      Object.entries(paymentParams).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      formData.append('s', signature);

      // Hacer request a Flow
      const response = await fetch(`${this.baseUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flow API error:', errorText);
        throw new Error(`Flow API error: ${response.status} - ${errorText}`);
      }

      const data: FlowPaymentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Flow payment:', error);
      throw error;
    }
  }

  /**
   * Obtener el estado de un pago usando el token
   * 
   * @param token - Token de la transacción
   * @returns Estado completo del pago
   */
  async getPaymentStatus(token: string): Promise<FlowPaymentStatus> {
    try {
      const params = {
        apiKey: this.apiKey,
        token,
      };

      const signature = this.sign(params);

      const url = new URL(`${this.baseUrl}/payment/getStatus`);
      url.searchParams.append('apiKey', this.apiKey);
      url.searchParams.append('token', token);
      url.searchParams.append('s', signature);

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flow getStatus error:', errorText);
        throw new Error(`Flow API error: ${response.status} - ${errorText}`);
      }

      const data: FlowPaymentStatus = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Flow payment status:', error);
      throw error;
    }
  }

  /**
   * Validar firma de webhook
   * Flow envía una firma 's' que debemos validar
   */
  validateWebhookSignature(params: Record<string, any>, receivedSignature: string): boolean {
    // Crear copia sin la firma
    const { s, ...paramsWithoutSignature } = params;

    // Calcular firma esperada
    const expectedSignature = this.sign(paramsWithoutSignature);

    // Comparar de forma segura (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  }
}

// Exportar instancia única (singleton)
export const flowClient = new FlowClient();
```

---

## **PASO 3: Crear API para Iniciar Pago**

### **Archivo: `app/api/payments/flow/create/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { z } from 'zod';
import { isAfter, parseISO } from 'date-fns';

// Schema de validación
const createPaymentSchema = z.object({
  bookingId: z.string().uuid('ID de reserva inválido'),
});

/**
 * POST /api/payments/flow/create
 * 
 * Crea una orden de pago en Flow para una reserva existente
 * 
 * Body:
 * {
 *   bookingId: string
 * }
 * 
 * Retorna:
 * {
 *   success: true,
 *   paymentUrl: string,  // URL para redirigir al usuario
 *   token: string,       // Token de Flow
 *   flowOrder: number    // ID de orden en Flow
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar body
    const body = await request.json();
    const { bookingId } = createPaymentSchema.parse(body);

    // 2. Obtener la reserva
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(title)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar que la reserva está en estado pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `La reserva ya está en estado: ${booking.status}` },
        { status: 400 }
      );
    }

    // 4. Validar que el hold no ha expirado
    if (booking.expires_at) {
      const expiresAt = parseISO(booking.expires_at);
      const now = new Date();
      
      if (!isAfter(expiresAt, now)) {
        // Marcar como expirado
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'expired' })
          .eq('id', bookingId);

        return NextResponse.json(
          { error: 'El tiempo para pagar ha expirado. Por favor crea una nueva reserva.' },
          { status: 410 } // 410 Gone
        );
      }
    }

    // 5. Verificar si ya existe una orden de Flow para esta reserva
    if (booking.flow_order_id) {
      return NextResponse.json(
        { 
          error: 'Ya existe una orden de pago para esta reserva',
          existingOrder: booking.flow_order_id 
        },
        { status: 409 }
      );
    }

    // 6. Crear la orden en Flow
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const flowPayment = await flowClient.createPayment({
      commerceOrder: bookingId, // Usamos el booking ID como commerce order
      subject: `Reserva ${booking.cabin.title} - Tres Morros de Coliumo`,
      currency: 'CLP',
      amount: booking.amount_total,
      email: booking.customer_email,
      urlConfirmation: `${siteUrl}/api/payments/flow/webhook`,
      urlReturn: `${siteUrl}/pago/confirmacion?booking=${bookingId}`,
      optional: JSON.stringify({
        bookingId,
        cabinId: booking.cabin_id,
        customerName: booking.customer_name,
      }),
    });

    // 7. Guardar el flow_order_id en la reserva
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ 
        flow_order_id: String(flowPayment.flowOrder),
        flow_payment_data: {
          token: flowPayment.token,
          url: flowPayment.url,
          createdAt: new Date().toISOString(),
        },
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with flow order:', updateError);
      // No retornamos error porque la orden ya se creó en Flow
    }

    // 8. Log del evento
    await supabaseAdmin.from('api_events').insert({
      event_type: 'flow_payment_created',
      event_source: 'flow',
      booking_id: bookingId,
      payload: {
        flowOrder: flowPayment.flowOrder,
        token: flowPayment.token,
        amount: booking.amount_total,
      },
      status: 'success',
    });

    // 9. Retornar la URL de pago
    return NextResponse.json({
      success: true,
      paymentUrl: flowPayment.url,
      token: flowPayment.token,
      flowOrder: flowPayment.flowOrder,
    });
  } catch (error) {
    console.error('Error creating Flow payment:', error);

    // Log del error
    await supabaseAdmin.from('api_events').insert({
      event_type: 'flow_payment_error',
      event_source: 'flow',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Error al crear la orden de pago' },
      { status: 500 }
    );
  }
}
```

---

## **PASO 4: Crear Webhook de Flow**

### **Archivo: `app/api/payments/flow/webhook/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';

/**
 * POST /api/payments/flow/webhook
 * 
 * Webhook llamado por Flow cuando se completa un pago
 * Flow envía: { token: string, s: string (signature) }
 * 
 * IMPORTANTE: Este endpoint debe ser público y accesible desde internet
 * Flow lo llamará automáticamente después de cada pago
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear el body (Flow envía form-urlencoded)
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const signature = formData.get('s') as string;

    if (!token || !signature) {
      console.error('Missing token or signature in webhook');
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // 2. Validar la firma del webhook
    const isValidSignature = flowClient.validateWebhookSignature(
      { token },
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      await supabaseAdmin.from('api_events').insert({
        event_type: 'webhook_invalid_signature',
        event_source: 'flow',
        payload: { token },
        status: 'error',
        error_message: 'Invalid signature',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Consultar el estado del pago en Flow
    const paymentStatus = await flowClient.getPaymentStatus(token);

    console.log('Flow payment status:', paymentStatus);

    // 4. Buscar la reserva por commerceOrder (nuestro bookingId)
    const bookingId = paymentStatus.commerceOrder;

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found for Flow order:', paymentStatus.flowOrder);
      await supabaseAdmin.from('api_events').insert({
        event_type: 'webhook_booking_not_found',
        event_source: 'flow',
        payload: paymentStatus,
        status: 'error',
        error_message: 'Booking not found',
      });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 5. Procesar según el estado del pago
    if (paymentStatus.status === FlowPaymentStatusCode.PAID) {
      // PAGO EXITOSO
      
      // Actualizar la reserva a 'paid'
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking to paid:', updateError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Log del evento exitoso
      await supabaseAdmin.from('api_events').insert({
        event_type: 'payment_success',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      console.log(`✅ Payment successful for booking ${bookingId}`);

      // TODO: En la próxima iteración, enviar email de confirmación aquí

      return NextResponse.json({ success: true, status: 'paid' });
    } else if (paymentStatus.status === FlowPaymentStatusCode.REJECTED) {
      // PAGO RECHAZADO
      
      // Actualizar estado (pero mantener el hold por si quiere reintentar)
      await supabaseAdmin
        .from('bookings')
        .update({
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      // Log del evento
      await supabaseAdmin.from('api_events').insert({
        event_type: 'payment_rejected',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'error',
        error_message: 'Payment rejected by bank',
      });

      console.log(`❌ Payment rejected for booking ${bookingId}`);

      return NextResponse.json({ success: true, status: 'rejected' });
    } else if (paymentStatus.status === FlowPaymentStatusCode.CANCELLED) {
      // PAGO CANCELADO POR EL USUARIO
      
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      await supabaseAdmin.from('api_events').insert({
        event_type: 'payment_cancelled',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      console.log(`🚫 Payment cancelled for booking ${bookingId}`);

      return NextResponse.json({ success: true, status: 'cancelled' });
    } else {
      // PENDIENTE u otro estado
      
      await supabaseAdmin.from('api_events').insert({
        event_type: 'payment_pending',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      return NextResponse.json({ success: true, status: 'pending' });
    }
  } catch (error) {
    console.error('Error processing Flow webhook:', error);

    await supabaseAdmin.from('api_events').insert({
      event_type: 'webhook_error',
      event_source: 'flow',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/payments/flow/webhook
 * 
 * Flow puede hacer un GET para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Flow webhook endpoint',
    timestamp: new Date().toISOString(),
  });
}
```

---

## **PASO 5: Actualizar Página de Pago**

### **Archivo: `app/pago/page.tsx` (reemplazar completamente)**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Clock, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';
import { differenceInMinutes, parseISO } from 'date-fns';

/**
 * Página de pago
 * Muestra el resumen y redirige automáticamente a Flow
 */
export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Cargar datos de la reserva
  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    async function loadBooking() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Error al cargar la reserva');
        }
        const data = await response.json();
        setBooking(data);

        // Calcular tiempo restante
        if (data.expires_at) {
          const expiresAt = parseISO(data.expires_at);
          const now = new Date();
          const minutes = differenceInMinutes(expiresAt, now);
          setTimeLeft(Math.max(0, minutes));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    loadBooking();
  }, [bookingId, router]);

  // Contador de tiempo regresivo
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          // Redirigir si se acabó el tiempo
          router.push(`/cabanas/${booking?.cabin?.slug}`);
        }
        return Math.max(0, newTime);
      });
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [timeLeft, booking, router]);

  // Iniciar pago con Flow
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/flow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pago');
      }

      const data = await response.json();

      // Redirigir a Flow
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar el pago');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Error</h1>
          <p className="mb-8 text-gray-600">{error || 'Reserva no encontrada'}</p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  if (booking.status === 'expired') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Reserva Expirada</h1>
          <p className="mb-8 text-gray-600">
            El tiempo para completar el pago ha expirado. Por favor crea una nueva reserva.
          </p>
          <Button onClick={() => router.push(`/cabanas/${booking.cabin.slug}`)}>
            Volver a reservar
          </Button>
        </div>
      </Container>
    );
  }

  if (booking.status === 'paid') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Pago Completado</h1>
          <p className="mb-8 text-gray-600">Esta reserva ya ha sido pagada.</p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl">
        {/* Timer */}
        {timeLeft > 0 && (
          <div className="mb-8 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">
                  Tiempo restante para completar el pago:
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {timeLeft} minuto{timeLeft !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de la reserva */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Resumen de tu Reserva</h1>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div>
              <p className="text-sm text-gray-600">Cabaña</p>
              <p className="text-lg font-semibold text-gray-900">{booking.cabin.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Fechas</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateRange(booking.start_date, booking.end_date)}
              </p>
              <p className="text-sm text-gray-500">{booking.nights} noches</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Huéspedes</p>
              <p className="text-lg font-semibold text-gray-900">
                {booking.party_size} persona{booking.party_size !== 1 ? 's' : ''}
              </p>
            </div>

            {booking.jacuzzi_days && booking.jacuzzi_days.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Jacuzzi</p>
                <p className="text-lg font-semibold text-gray-900">
                  {booking.jacuzzi_days.length} día{booking.jacuzzi_days.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">Total a pagar</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatPrice(booking.amount_total)}
              </p>
            </div>
          </div>

          {/* Botón de pago */}
          <div className="mt-8">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || timeLeft <= 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirigiendo a Webpay...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pagar con Webpay Plus
                </>
              )}
            </Button>
          </div>

          {/* Información de seguridad */}
          <div className="mt-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">🔒 Pago 100% seguro</p>
            <p className="mt-1">
              Serás redirigido a Webpay Plus, la plataforma de pago segura de Transbank. Tu
              información bancaria está completamente protegida.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
```

---

## **PASO 6: Crear API para Obtener Booking**

### **Archivo: `app/api/bookings/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/bookings/[id]
 * 
 * Obtener detalles de una reserva
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(*)')
      .eq('id', params.id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

---

## **PASO 7: Crear Página de Confirmación**

### **Archivo: `app/pago/confirmacion/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';

/**
 * Página de confirmación después de Flow
 * Flow redirige aquí con ?booking=ID después del pago
 */
export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    // Polling: verificar el estado cada 3 segundos hasta 10 intentos
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Error al verificar el pago');

        const data = await response.json();
        setBooking(data);

        // Si ya está pagado o cancelado, dejar de hacer polling
        if (data.status === 'paid' || data.status === 'canceled' || data.status === 'expired') {
          setIsLoading(false);
          return true; // Stop polling
        }

        setCheckAttempts((prev) => prev + 1);
        return false; // Continue polling
      } catch (error) {
        console.error('Error checking payment status:', error);
        setIsLoading(false);
        return true; // Stop polling on error
      }
    };

    // Primer check inmediato
    checkPaymentStatus().then((shouldStop) => {
      if (shouldStop) return;

      // Continuar polling cada 3 segundos
      const interval = setInterval(async () => {
        const shouldStop = await checkPaymentStatus();
        if (shouldStop || checkAttempts >= 10) {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 3000);

      return () => clearInterval(interval);
    });
  }, [bookingId, router, checkAttempts]);

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Verificando el estado de tu pago...
          </h1>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu transacción.
          </p>
        </div>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Error</h1>
          <p className="mb-8 text-gray-600">No se pudo verificar el estado de tu reserva.</p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  // Pago exitoso
  if (booking.status === 'paid') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h1 className="mb-2 text-3xl font-bold text-gray-900">¡Pago Exitoso!</h1>
            <p className="mb-8 text-lg text-gray-700">
              Tu reserva ha sido confirmada. Recibirás un email con los detalles.
            </p>

            <div className="space-y-4 border-t border-green-200 pt-6 text-left">
              <div>
                <p className="text-sm text-gray-600">Número de reserva</p>
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {booking.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Cabaña</p>
                <p className="text-lg font-semibold text-gray-900">{booking.cabin.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Fechas</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateRange(booking.start_date, booking.end_date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total pagado</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatPrice(booking.amount_total)}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Button onClick={() => router.push('/')} size="lg" className="w-full">
                Volver al inicio
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">📧 Confirmación por email</p>
            <p className="mt-1">
              Hemos enviado un email de confirmación a{' '}
              <strong>{booking.customer_email}</strong> con todos los detalles de tu reserva.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Pago cancelado
  if (booking.status === 'canceled') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Pago Cancelado</h1>
          <p className="mb-8 text-gray-600">
            Has cancelado el proceso de pago. Tu reserva no ha sido confirmada.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push(`/pago?booking=${bookingId}`)}>
              Intentar nuevamente
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Still pending
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Pago Pendiente</h1>
        <p className="mb-8 text-gray-600">
          Tu pago aún está siendo procesado. Por favor espera unos minutos y revisa tu email.
        </p>
        <Button onClick={() => window.location.reload()}>Actualizar estado</Button>
      </div>
    </Container>
  );
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 5**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Variables de entorno Flow configuradas
# Verificar que existen en .env.local:
# FLOW_API_KEY
# FLOW_SECRET_KEY
# FLOW_BASE_URL

# 3. Probar flujo completo en sandbox:
# - Crear una reserva
# - Ir a /pago?booking=ID
# - Click en "Pagar con Webpay Plus"
# - Completar pago en sandbox de Flow
# - Verificar redirección a /pago/confirmacion

# 4. Verificar webhook
# El webhook debe ser accesible públicamente
# En desarrollo local, usar ngrok o similar:
ngrok http 3000

# Actualizar NEXT_PUBLIC_SITE_URL en .env.local con la URL de ngrok

# 5. Verificar en Supabase
# - La reserva debe cambiar a status 'paid'
# - paid_at debe tener timestamp
# - flow_payment_data debe tener los datos del pago

# 6. Verificar logs
# En Supabase → Table Editor → api_events
# Debe haber eventos de tipo:
# - flow_payment_created
# - payment_success
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 5**

- [ ] Cliente de Flow configurado correctamente
- [ ] Firma HMAC funciona
- [ ] API `/api/payments/flow/create` crea órdenes
- [ ] Redirección a Webpay funciona
- [ ] Webhook recibe notificaciones de Flow
- [ ] Webhook valida firma correctamente
- [ ] Estado de reserva se actualiza a 'paid'
- [ ] Página de confirmación muestra info correcta
- [ ] Manejo de pagos cancelados funciona
- [ ] Logs de eventos se guardan correctamente
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 5 - integración con Flow para pagos"
git push origin main
```

**SIGUIENTE:** 06-ITERATION-6.md (Sistema de Emails con SendGrid)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/06-ITERATION-6.md

---

**FIN DE LA ITERACIÓN 5**