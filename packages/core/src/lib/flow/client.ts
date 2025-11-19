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
 */
class FlowClient {
  private apiKey?: string;
  private secretKey?: string;
  private baseUrl?: string;
  private configured: boolean;

  constructor() {
    this.apiKey = (process.env.FLOW_API_KEY || '').trim() || undefined
    this.secretKey = (process.env.FLOW_SECRET_KEY || '').trim() || undefined
    this.baseUrl = (process.env.FLOW_BASE_URL || '').trim() || undefined
    const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true'
    this.configured = Boolean(this.apiKey && this.secretKey && this.baseUrl) && !forceMock

    if (!this.configured) {
      console.warn('[Flow] Modo mock de Flow activo (credenciales no configuradas o FORCED).')
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
    if (!this.configured) {
      return true;
    }

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

  private createMockPayment(params: FlowPaymentParams): FlowPaymentResponse {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const mockToken = `mock-${params.commerceOrder}-${Date.now()}`;

    return {
      url: `${siteUrl}/pago/confirmacion?booking=${params.commerceOrder}&mockFlow=1`,
      token: mockToken,
      flowOrder: Date.now(),
    };
  }

  private createMockPaymentStatus(token: string): FlowPaymentStatus {
    return {
      flowOrder: Date.now(),
      commerceOrder: token,
      requestDate: new Date().toISOString(),
      status: FlowPaymentStatusCode.PAID,
      subject: 'Mock Flow payment',
      currency: 'CLP',
      amount: 0,
      payer: 'mock@flow.test',
    };
  }
}

// Exportar instancia única (singleton)
export const flowClient = new FlowClient();
