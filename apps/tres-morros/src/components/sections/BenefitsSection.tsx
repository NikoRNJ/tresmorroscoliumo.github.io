/**
 * Benefits Section - Servicios incluidos en la estadía
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, ShieldCheck, PencilRuler, Home, CalendarCheck } from 'lucide-react';
import { Section, SectionHeader, Card, CardContent, Button } from '@/components/ui';
import { benefits } from '@/lib/data';
import { staggerContainer, staggerItem } from '@/lib/utils';
import { useScrollTo } from '@/hooks';

const iconMap = {
  tag: Tag,
  'shield-check': ShieldCheck,
  'pencil-ruler': PencilRuler,
  home: Home,
  'calendar-check': CalendarCheck,
};

export const BenefitsSection: React.FC = () => {
  const { scrollToSection } = useScrollTo();

  return (
    <Section id="benefits" background="dark" width="wide">
      <SectionHeader
        title="SERVICIOS QUE AMARÁS"
        subtitle="Todo incluido"
        description="Piscinas climatizadas, anfitriones residentes, gastronomía local y actividades personalizadas para que cada grupo viva Coliumo a su ritmo."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {benefits.map((benefit) => {
          const Icon = iconMap[benefit.icon as keyof typeof iconMap];

          return (
            <motion.div key={benefit.id} variants={staggerItem}>
              <Card className="h-full border-white/10 bg-white/5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/30">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                      {Icon && <Icon className="h-8 w-8 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl lg:text-2xl font-semibold text-white">{benefit.title}</h3>
                    <p className="text-base text-white/70 leading-relaxed">{benefit.description}</p>
                    {benefit.details && (
                      <p className="text-sm text-white/60 italic">{benefit.details}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mx-auto mt-20 flex w-full max-w-4xl justify-center text-center"
      >
        <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 to-white/0 px-8 py-12 text-center shadow-[0_0_80px_rgba(255,255,255,0.08)] sm:px-12">
          <p className="text-3xl md:text-4xl font-bold text-white">¿Interesado en conocer más?</p>
          <p className="text-lg text-white/70">
            Puedes contactarnos para obtener más información sobre los modelos disponibles y características de las cabañas.
          </p>
          <Button size="lg" onClick={() => scrollToSection('contact')}>
            Contactar
          </Button>
        </div>
      </motion.div>
    </Section>
  );
};
