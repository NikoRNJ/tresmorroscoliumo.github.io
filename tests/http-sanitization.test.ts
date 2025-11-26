import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeErrorMessage, createSafeErrorResponse, isProductionEnvironment } from '@core/lib/utils/http';

describe('HTTP Error Sanitization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isProductionEnvironment', () => {
    it('returns true when NEXT_PUBLIC_SITE_ENV is production', () => {
      process.env.NEXT_PUBLIC_SITE_ENV = 'production';
      process.env.NODE_ENV = 'development';
      expect(isProductionEnvironment()).toBe(true);
    });

    it('returns true when NODE_ENV is production', () => {
      process.env.NEXT_PUBLIC_SITE_ENV = '';
      process.env.NODE_ENV = 'production';
      expect(isProductionEnvironment()).toBe(true);
    });

    it('returns false in development', () => {
      process.env.NEXT_PUBLIC_SITE_ENV = '';
      process.env.NODE_ENV = 'development';
      expect(isProductionEnvironment()).toBe(false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    describe('in development mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        process.env.NEXT_PUBLIC_SITE_ENV = '';
      });

      it('returns original error message for Error objects', () => {
        const error = new Error('Database connection failed: timeout');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Database connection failed: timeout');
      });

      it('returns string errors as-is', () => {
        const result = sanitizeErrorMessage('Something went wrong');
        expect(result).toBe('Something went wrong');
      });
    });

    describe('in production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        process.env.NEXT_PUBLIC_SITE_ENV = 'production';
      });

      it('returns safe user message for internal errors', () => {
        const error = new Error('ECONNREFUSED: 127.0.0.1:5432');
        const result = sanitizeErrorMessage(error, 'Error del servidor');
        expect(result).toBe('Error del servidor');
      });

      it('allows safe error patterns about dates unavailable', () => {
        const error = new Error('Las fechas seleccionadas no están disponibles');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Las fechas seleccionadas no están disponibles');
      });

      it('allows safe error patterns about reserva not found', () => {
        const error = new Error('Reserva no encontrada');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Reserva no encontrada');
      });

      it('allows safe error patterns about expired reserva', () => {
        const error = new Error('La reserva ha expirado');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('La reserva ha expirado');
      });

      it('allows safe error patterns about invalid data', () => {
        const error = new Error('Datos inválidos en el formulario');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Datos inválidos en el formulario');
      });

      it('allows safe error patterns about invalid email', () => {
        const error = new Error('Email inválido');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Email inválido');
      });

      it('allows safe error patterns about capacity', () => {
        const error = new Error('La capacidad máxima es 7 personas');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('La capacidad máxima es 7 personas');
      });

      it('allows safe error patterns about payment expiration', () => {
        const error = new Error('El tiempo para pagar expiró');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('El tiempo para pagar expiró');
      });

      it('blocks internal database errors', () => {
        const error = new Error('PostgresError: relation "bookings" does not exist');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Ha ocurrido un error. Por favor intenta nuevamente.');
      });

      it('blocks stack traces in error messages', () => {
        const error = new Error('Error at line 45 in /src/lib/db.ts');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Ha ocurrido un error. Por favor intenta nuevamente.');
      });

      it('respects allowed error codes', () => {
        const error = new Error('Flow credentials expired') as Error & { code: string };
        error.code = 'FLOW_AUTH_ERROR';
        const result = sanitizeErrorMessage(error, 'Error genérico', ['FLOW_AUTH_ERROR']);
        expect(result).toBe('Flow credentials expired');
      });
    });
  });

  describe('createSafeErrorResponse', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('returns sanitized error with code', () => {
      const error = new Error('Internal SQL error');
      const result = createSafeErrorResponse(error, 500, { code: 'DB_ERROR' });
      
      expect(result).toEqual({
        error: 'Ha ocurrido un error interno.',
        code: 'DB_ERROR',
      });
    });

    it('uses custom safe message', () => {
      const error = new Error('Some internal issue');
      const result = createSafeErrorResponse(error, 500, {
        safeMessage: 'No se pudo procesar la solicitud',
      });
      
      expect(result.error).toBe('No se pudo procesar la solicitud');
    });

    it('allows through safe patterns', () => {
      const error = new Error('Las fechas no están disponibles');
      const result = createSafeErrorResponse(error, 409);
      
      expect(result.error).toBe('Las fechas no están disponibles');
    });
  });
});
