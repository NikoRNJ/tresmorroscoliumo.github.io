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
