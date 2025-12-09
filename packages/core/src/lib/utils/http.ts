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

