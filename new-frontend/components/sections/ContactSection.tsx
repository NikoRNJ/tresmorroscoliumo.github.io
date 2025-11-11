/**
 * Contact Section - Formulario de contacto
 */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Section, SectionHeader, Input, Textarea, Button } from '@/components/ui';
import { useContactForm } from '@/hooks';
import { staggerContainer, staggerItem } from '@/lib/utils';

export const ContactSection: React.FC = () => {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    onSubmit,
  } = useContactForm();

  return (
    <Section id="contact" background="dark" width="wide" showDivider={false}>
      <SectionHeader
        title="CONTACTO"
        subtitle="¿Interesado en conocer más?"
        description="Envía tus consultas sobre los modelos de cabañas disponibles. Este es un sitio de ejemplo para visualizar el diseño."
      />

      <div className="mx-auto w-full max-w-5xl self-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 lg:p-12 backdrop-blur">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <CheckCircle className="mx-auto mb-6 h-20 w-20 text-emerald-400" />
                <h3 className="text-3xl font-bold text-white">¡Mensaje enviado!</h3>
                <p className="mt-4 text-lg text-white/70">
                  Gracias por contactarnos. Recibiremos tu mensaje y te responderemos a la brevedad.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <motion.div variants={staggerItem}>
                  <label htmlFor="name" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/80">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre y apellido"
                    error={errors.name?.message}
                    disabled={isSubmitting}
                    {...register('name')}
                  />
                </motion.div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <motion.div variants={staggerItem}>
                    <label htmlFor="email" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/80">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      error={errors.email?.message}
                      disabled={isSubmitting}
                      {...register('email')}
                    />
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <label htmlFor="phone" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/80">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+56 9 5555 5555"
                      error={errors.phone?.message}
                      disabled={isSubmitting}
                      {...register('phone')}
                    />
                  </motion.div>
                </div>

                <motion.div variants={staggerItem}>
                  <label htmlFor="preferredModel" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/80">
                    Modelo de interés (opcional)
                  </label>
                  <select
                    id="preferredModel"
                    className="flex h-12 w-full rounded-md border border-white/15 bg-black/40 px-4 py-2 text-base text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                    {...register('preferredModel')}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Modelo Uno">Modelo Uno</option>
                    <option value="Modelo Dos">Modelo Dos</option>
                    <option value="Modelo Tres">Modelo Tres</option>
                    <option value="No estoy seguro">Aún no lo decido</option>
                  </select>
                </motion.div>

                <motion.div variants={staggerItem}>
                  <label htmlFor="message" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/80">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Fechas tentativas, cantidad de huéspedes, motivo del viaje y cualquier requerimiento especial."
                    rows={6}
                    error={errors.message?.message}
                    disabled={isSubmitting}
                    {...register('message')}
                  />
                </motion.div>

                <motion.div variants={staggerItem} className="flex items-start gap-4">
                  <input
                    id="privacyAccepted"
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-white/20 bg-black text-white focus:ring-2 focus:ring-white"
                    disabled={isSubmitting}
                    {...register('privacyAccepted')}
                  />
                  <label htmlFor="privacyAccepted" className="text-sm text-white/70">
                    Acepto la política de privacidad y autorizo el tratamiento de mis datos para recibir información relacionada con mi
                    solicitud. <span className="text-red-500">*</span>
                  </label>
                </motion.div>
                {errors.privacyAccepted && (
                  <p className="text-sm text-red-500">{errors.privacyAccepted.message}</p>
                )}

                {isError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-200">{errorMessage}</p>
                  </motion.div>
                )}

                <motion.div variants={staggerItem} className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {!isSubmitting && <Send className="mr-2 h-5 w-5" />}
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
};
