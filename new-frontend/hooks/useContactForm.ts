/**
 * Hook personalizado para manejar el formulario de contacto
 * Integra React Hook Form con Zod y manejo de estado
 */
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormSchemaType } from '@/lib/utils/validation';
import type { ApiResponse } from '@/types';

interface UseContactFormReturn {
  register: ReturnType<typeof useForm<ContactFormSchemaType>>['register'];
  handleSubmit: ReturnType<typeof useForm<ContactFormSchemaType>>['handleSubmit'];
  errors: ReturnType<typeof useForm<ContactFormSchemaType>>['formState']['errors'];
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  onSubmit: (data: ContactFormSchemaType) => Promise<void>;
  reset: () => void;
}

export const useContactForm = (): UseContactFormReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ContactFormSchemaType>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
  });

  const reset = () => {
    resetForm();
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage(null);
  };

  const onSubmit = async (data: ContactFormSchemaType) => {
    setIsSubmitting(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar el mensaje');
      }

      setIsSuccess(true);
      resetForm();
      
      // Resetear éxito después de 5 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      setIsError(true);
      setErrorMessage(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    onSubmit,
    reset,
  };
};
