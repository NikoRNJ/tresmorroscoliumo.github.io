/**
 * Schema de validación con Zod para el formulario de contacto
 * Garantiza type-safety y validación robusta
 */
import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  
  email: z
    .string()
    .email('Por favor ingresa un email válido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(100, 'El email no puede exceder 100 caracteres')
    .toLowerCase()
    .trim(),
  
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos'),
  
  message: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres')
    .trim(),
  
  preferredModel: z
    .string()
    .optional(),
  
  privacyAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar la política de privacidad',
    }),
});

export type ContactFormSchemaType = z.infer<typeof contactFormSchema>;

// Validación adicional para rate limiting
export const emailRateLimitSchema = z.object({
  ip: z.string().min(1),
  timestamp: z.number(),
  count: z.number().min(0),
});
