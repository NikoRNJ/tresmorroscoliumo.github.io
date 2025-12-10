import crypto from 'crypto';
import type {
  FlowPaymentParams,
  FlowPaymentResponse,
  FlowPaymentStatus,
} from '../../types/flow';
import { FlowPaymentStatusCode } from '../../types/flow';

/**
 * Cliente para interactuar con Flow API
 * Documentación: https://www.flow.cl/docs/api.html
 * 
 * PRODUCCIÓN:
 * - FLOW_BASE_URL=https://www.flow.cl/api
 * - Webhook: https://www.tresmorroscoliumo.cl/api/payments/flow/webhook
 * - Return: https://www.tresmorroscoliumo.cl/api/payments/flow/return
 */
class FlowClient {
  private apiKey?: string;
  private secretKey?: string;
  private baseUrl?: string;
  private configured: boolean;
  private debug: boolean;
  private httpTimeoutMs: number;

  constructor() {
    this.apiKey = (process.env.FLOW_API_KEY || '').trim() || undefined
    this.secretKey = (process.env.FLOW_SECRET_KEY || '').trim() || undefined
    this.baseUrl = (process.env.FLOW_BASE_URL || '').trim() || undefined
    const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true'
    this.debug = String(process.env.FLOW_DEBUG_LOGS || '').toLowerCase() === 'true'
    this.configured = Boolean(this.apiKey && this.secretKey && this.baseUrl) && !forceMock
    const timeoutFromEnv = Number(process.env.FLOW_HTTP_TIMEOUT_MS || '')
    this.httpTimeoutMs = Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0 ? timeoutFromEnv : 15000

    // Lazy init: solo loguear si estamos en un entorno de ejecución real (no build)
    // y si la variable NODE_ENV indica que deberíamos tener configuración (production)
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      if (this.configured) {
        const isSandbox = this.baseUrl?.includes('sandbox');
        console.log(`[Flow] ✅ Cliente configurado - Modo: ${isSandbox ? 'SANDBOX' : 'PRODUCCIÓN'}`);
      } else if (!forceMock) {
        // Solo warn si NO estamos forzando mock explícitamente y tampoco hay keys
        // Esto reduce el ruido durante builds donde las keys no están presentes
        // console.warn('[Flow] ⚠️ Modo MOCK activo (credenciales no configuradas)');
      }
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private ensureConfigured() {
    if (!this.apiKey || !this.secretKey || !this.baseUrl) {
      throw new Error('Flow credentials are not configured');
    }
  }

  /**
   * Generar firma HMAC SHA256 para autenticar requests
   * Flow requiere firmar todos los parámetros ordenados alfabéticamente
   */
  private sign(params: Record<string, any>): string {
    if (!this.secretKey) {
      throw new Error('Flow secret key is not configured');
    }
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

    if (this.debug) {
      console.log('[Flow] Signing params:', dataString);
      console.log('[Flow] Signature:', signature);
    }

    return signature;
  }

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.httpTimeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      return response;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Flow request timeout');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Crear una orden de pago en Flow
   * 
   * @param params - Parámetros de la orden
   * @returns URL y token para redirigir al usuario
   */
  async createPayment(params: FlowPaymentParams): Promise<FlowPaymentResponse> {
    try {
      if (!this.configured) {
        return this.createMockPayment(params);
      }

      this.ensureConfigured();

      // Agregar API Key a los parámetros
      const paymentParams = {
        apiKey: this.apiKey!,
        commerceOrder: params.commerceOrder,
        subject: params.subject,
        currency: params.currency,
        amount: Math.round(params.amount), // Flow requiere un entero
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

      // Hacer request a Flow con timeout
      const response = await this.fetchWithTimeout(`${this.baseUrl}/payment/create`, {
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
      const urlWithToken = data.token ? `${data.url}?token=${data.token}` : data.url;
      return { ...data, url: urlWithToken };
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
      if (!this.configured) {
        return this.createMockPaymentStatus(token);
      }

      this.ensureConfigured();

      const params = {
        apiKey: this.apiKey!,
        token,
      };

      const signature = this.sign(params);

      const url = new URL(`${this.baseUrl}/payment/getStatus`);
      url.searchParams.append('apiKey', this.apiKey!);
      url.searchParams.append('token', token);
      url.searchParams.append('s', signature);

      const response = await this.fetchWithTimeout(url.toString(), {
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
    if (!this.configured) {
      return true;
    }

    // Crear copia sin la firma
    const { s, ...paramsWithoutSignature } = params;

    // Calcular firma esperada
    const expectedSignature = this.sign(paramsWithoutSignature);

    // Comparar de forma segura (timing-safe)
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(receivedSignature);

    if (expected.length !== received.length) {
      if (this.debug) {
        console.warn('[Flow] Firma con longitud inesperada', {
          expectedLength: expected.length,
          receivedLength: received.length,
        });
      }
      return false;
    }

    try {
      return crypto.timingSafeEqual(expected, received);
    } catch (err) {
      if (this.debug) {
        console.warn('[Flow] Error comparando firmas', err);
      }
      return false;
    }
  }

  private createMockPayment(params: FlowPaymentParams): FlowPaymentResponse {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tresmorroscoliumo.cl';
    const mockToken = `mock-${params.commerceOrder}-${Date.now()}`;

    // Redirigir a la pasarela mock en lugar de directamente a confirmación
    // El usuario debe "completar" el pago en la pasarela mock
    return {
      url: `${siteUrl}/pago/mock-gateway?booking=${params.commerceOrder}&token=${mockToken}`,
      token: mockToken,
      flowOrder: Date.now(),
    };
  }

  private createMockPaymentStatus(token: string): FlowPaymentStatus {
    // Extraer bookingId del token mock: "mock-UUID-timestamp" → "UUID"
    let bookingId = token;
    if (token.startsWith('mock-')) {
      const parts = token.split('-');
      // UUID tiene formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 partes con guiones)
      // Token mock: mock-UUID-timestamp, así que extraemos las partes del UUID
      if (parts.length >= 7) {
        // parts[0] = 'mock', parts[1-5] = UUID parts, parts[6] = timestamp
        bookingId = parts.slice(1, 6).join('-');
      }
    }

    return {
      flowOrder: Date.now(),
      commerceOrder: bookingId,
      requestDate: new Date().toISOString(),
      status: FlowPaymentStatusCode.PENDING, // Por defecto PENDING hasta que se confirme
      subject: 'Mock Flow payment',
      currency: 'CLP',
      amount: 0,
      payer: 'mock@flow.test',
    };
  }
}

// Exportar instancia única (singleton)
export const flowClient = new FlowClient();
