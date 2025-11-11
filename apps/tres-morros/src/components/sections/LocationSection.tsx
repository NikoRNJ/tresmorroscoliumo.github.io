/**
 * Location Section - Información de ubicación
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Section, SectionHeader, Card, CardContent } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/utils';

const infoItems = [
  {
    icon: MapPin,
    title: 'Dirección',
    description: ['Coliumo, Sector Costero', 'Comuna de Tomé · Región del Biobío', 'Ubicación de ejemplo'],
  },
  {
    icon: Phone,
    title: 'Teléfono de contacto',
    description: ['+56 9 0000 0000', 'Número de ejemplo'],
    href: 'tel:+56900000000',
  },
  {
    icon: Mail,
    title: 'Correo electrónico',
    description: ['contacto@ejemplo.cl', 'Email de ejemplo'],
    href: 'mailto:contacto@ejemplo.cl',
  },
  {
    icon: Clock,
    title: 'Información',
    description: ['Horarios a consultar', 'Disponibilidad según temporada', 'Consultar condiciones'],
  },
] as const;

export const LocationSection: React.FC = () => {
  return (
    <Section id="location" background="darker" width="wide">
      <SectionHeader
        title="UBICACIÓN"
        subtitle="Coliumo · Tomé"
        description="Cabañas ubicadas en el sector costero de Coliumo, comuna de Tomé, Región del Biobío."
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative h-[320px] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 sm:h-[420px] lg:h-[520px]"
        >
          <div className="flex h-full w-full flex-col items-center justify-center text-center text-white/70 px-6">
            <MapPin className="h-16 w-16 text-white" />
            <p className="mt-4 text-lg font-semibold text-white">Ubicación en Coliumo</p>
            <p className="text-sm text-white/60">
              Sector costero de la comuna de Tomé. Información detallada de ubicación disponible al consultar.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full space-y-6"
        >
          {infoItems.map((item) => (
            <motion.div key={item.title} variants={staggerItem}>
              <Card className="w-full border-white/10 bg-white/5">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:items-start sm:text-left">
                  <div className="rounded-2xl bg-white/10 p-4 text-white">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <div className="mt-2 space-y-1 text-sm text-white/70">
                      {item.description.map((line, index) => (
                        <p key={line}>
                          {'href' in item && index === 0 ? (
                            <a href={item.href} className="text-white hover:underline">
                              {line}
                            </a>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
};
