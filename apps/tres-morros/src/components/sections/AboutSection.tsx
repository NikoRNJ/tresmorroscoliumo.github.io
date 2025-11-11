/**
 * About Section - Características de las cabañas
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, DollarSign, Heart, CheckCircle2 } from 'lucide-react';
import { Section, SectionHeader, Card, CardContent } from '@/components/ui';
import { companyFeatures } from '@/lib/data';
import { staggerContainer, staggerItem } from '@/lib/utils';

const iconMap = {
  zap: Zap,
  'dollar-sign': DollarSign,
  heart: Heart,
};

const aboutHighlights = [
  'Diseño pensado para el descanso y confort.',
  'Ubicación en Coliumo, sector costero de Tomé.',
  'Espacios equipados con servicios básicos.',
] as const;

export const AboutSection: React.FC = () => {
  return (
    <Section id="about" background="darker" width="wide">
      <SectionHeader
        title="NUESTRAS CABAÑAS"
        description="Espacios diseñados para ofrecer descanso y conexión con la naturaleza en el sector costero de Coliumo, Tomé."
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative h-[380px] w-full overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 sm:h-[480px]">
            <Image
              src="https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&q=80"
              alt="Entorno natural en Coliumo, Tomé"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Coliumo, región del Biobío</p>
              <p className="text-lg font-semibold text-white">Espacios en entorno natural privilegiado</p>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-10 hidden w-60 rounded-3xl border border-white/10 bg-black/85 p-6 text-left shadow-2xl shadow-black/50 sm:block">
            <p className="text-4xl font-bold text-white">3</p>
            <p className="text-sm uppercase tracking-wide text-white/60">Modelos disponibles</p>
            <p className="mt-3 text-sm text-white/70">
              Diferentes opciones para conocer el formato y diseño de las cabañas en Coliumo.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="space-y-6 text-center lg:text-left"
        >
          <p className="text-base text-gray-300 leading-relaxed">
            Tres modelos de cabañas ubicadas en Coliumo, sector costero de la comuna de Tomé.
            Diseñadas para ofrecer un espacio de descanso en contacto con la naturaleza.
          </p>
          <p className="text-base text-gray-300 leading-relaxed">
            Contenido de ejemplo para visualizar el diseño y estructura del sitio web.
            Información básica sobre características y servicios disponibles.
          </p>
          <ul className="space-y-4">
            {aboutHighlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
                <span className="text-gray-200">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto mt-16 grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
      >
        {companyFeatures.map((feature) => {
          const Icon = iconMap[feature.icon as keyof typeof iconMap];

          return (
            <motion.div key={feature.id} variants={staggerItem}>
              <Card className="h-full border-white/10 bg-white/5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/30">
                <CardContent className="p-10">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                    {Icon && <Icon className="h-10 w-10 text-white" />}
                  </div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/50">{feature.subtitle}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm text-gray-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mx-auto mt-20 w-full max-w-6xl overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '0%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap text-4xl sm:text-5xl lg:text-6xl font-bold text-white/5"
        >
          <span className="mx-12">#COLIUMO</span>
          <span className="mx-12">#NATURALEZA</span>
          <span className="mx-12">#DESCANSO</span>
          <span className="mx-12">#COSTACHILENA</span>
          <span className="mx-12">#TOMÉ</span>
          <span className="mx-12">#CABAÑAS</span>
          <span className="mx-12">#COLIUMO</span>
        </motion.div>
      </div>
    </Section>
  );
};
