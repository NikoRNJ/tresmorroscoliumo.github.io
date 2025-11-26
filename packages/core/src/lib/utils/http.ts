export interface ParsedResponse<T = unknown> {
  data: T | null;
  text: string;
  isJson: boolean;
}

export class HttpResponseError extends Error {
  status: number;
  bodySnippet?: string;
  payload?: unknown;

  constructor(message: string, status: number, bodySnippet?: string, payload?: unknown) {
    super(message);
    this.name = 'HttpResponseError';
    this.status = status;
    this.bodySnippet = bodySnippet;
    this.payload = payload;
  }
}

export async function parseResponseBody<T = unknown>(response: Response): Promise<ParsedResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      data: null,
      text,
      isJson: true,
    };
  }

  try {
    return {
      data: JSON.parse(text) as T,
      text,
      isJson: true,
    };
  } catch {
    return {
      data: null,
      text,
      isJson: false,
    };
  }
}

export function buildHttpError<T = unknown>(
  response: Response,
  parsed: ParsedResponse<T>,
  fallbackMessage: string
): HttpResponseError {
  const payload = parsed.isJson ? parsed.data : null;
  const snippet = parsed.text?.trim().slice(0, 300) || undefined;

  const message =
    payload && typeof payload === 'object' && payload !== null
      ? ((payload as Record<string, unknown>).error as string) ??
        ((payload as Record<string, unknown>).message as string) ??
        fallbackMessage
      : fallbackMessage;

  return new HttpResponseError(message, response.status, snippet, payload ?? undefined);
}

/**
 * Verifica si el entorno actual es producción.
 * Considera tanto NEXT_PUBLIC_SITE_ENV como NODE_ENV.
 */
export function isProductionEnvironment(): boolean {
  const siteEnv = (process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase();
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  return siteEnv === 'production' || nodeEnv === 'production';
}

/**
 * Patrones de error seguros para mostrar al usuario en producción.
 * Estos errores son de negocio y no exponen información sensible.
 */
const SAFE_ERROR_PATTERNS: RegExp[] = [
  /fechas.*no.*disponibles/i,
  /reserva.*no.*encontrada/i,
  /reserva.*expirad[ao]/i,
  /datos.*inv[áa]lidos/i,
  /email.*inv[áa]lido/i,
  /capacidad.*m[áa]xim[ao]/i,
  /tiempo.*para.*pagar.*expir[óo]/i,
];

/**
 * Sanitiza mensajes de error para evitar exponer información sensible en producción.
 * 
 * En desarrollo, retorna el mensaje original para facilitar debugging.
 * En producción, retorna un mensaje genérico a menos que sea un error "seguro".
 * 
 * @param error - El error a sanitizar
 * @param safeUserMessage - Mensaje genérico para mostrar al usuario en producción
 * @param allowedErrorCodes - Códigos de error que son seguros para mostrar al usuario
 * @returns Mensaje sanitizado seguro para mostrar al usuario
 */
export function sanitizeErrorMessage(
  error: unknown,
  safeUserMessage: string = 'Ha ocurrido un error. Por favor intenta nuevamente.',
  allowedErrorCodes: string[] = []
): string {
  const isProdRuntime = isProductionEnvironment();

  // En desarrollo, mostrar el mensaje real para debugging
  if (!isProdRuntime) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return safeUserMessage;
  }

  // En producción, solo mostrar mensajes seguros
  if (error instanceof Error) {
    // Verificar si es un código de error permitido
    const errorWithCode = error as Error & { code?: string };
    if (errorWithCode.code && allowedErrorCodes.includes(errorWithCode.code)) {
      return error.message;
    }

    // Verificar si el mensaje coincide con patrones seguros
    for (const pattern of SAFE_ERROR_PATTERNS) {
      if (pattern.test(error.message)) {
        return error.message;
      }
    }
  }

  // Si no es un error seguro, retornar mensaje genérico
  return safeUserMessage;
}

/**
 * Crea una respuesta de error estandarizada para API routes.
 * Sanitiza automáticamente el mensaje en producción.
 * 
 * @param error - El error original
 * @param status - Código de estado HTTP
 * @param options - Opciones adicionales
 * @returns Objeto con error sanitizado listo para NextResponse.json()
 */
export function createSafeErrorResponse(
  error: unknown,
  status: number,
  options: {
    code?: string;
    safeMessage?: string;
    allowedCodes?: string[];
  } = {}
): { error: string; code?: string } {
  const sanitizedMessage = sanitizeErrorMessage(
    error,
    options.safeMessage || 'Ha ocurrido un error interno.',
    options.allowedCodes || []
  );

  const response: { error: string; code?: string } = {
    error: sanitizedMessage,
  };

  if (options.code) {
    response.code = options.code;
  }

  return response;
}

