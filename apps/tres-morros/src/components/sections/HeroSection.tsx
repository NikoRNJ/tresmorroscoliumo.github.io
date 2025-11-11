/**
 * Hero Section - Presentación principal con enfoque en arriendo
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import { fadeInUp } from '@/lib/utils';
import { useScrollTo } from '@/hooks';

const heroStats = [
  { label: 'Modelos disponibles', value: '3' },
  { label: 'Espacios naturales', value: 'Varios' },
  { label: 'Ubicación', value: 'Coliumo' },
  { label: 'Disponibilidad', value: 'Consultar' },
] as const;

export const HeroSection: React.FC = () => {
  const { scrollToSection } = useScrollTo();

  return (
    <Section
      id="hero"
      className="relative overflow-hidden pt-28"
      background="transparent"
      width="wide"
    >
      <div className="grid w-full gap-12 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/10 p-6 sm:p-10 lg:p-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* Texto */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="space-y-8 text-center lg:text-left"
        >
          <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            Coliumo · Tomé · Chile
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Cabañas en Coliumo para disfrutar de la naturaleza y el mar.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
              Tres modelos de cabañas en Coliumo, sector costero de Tomé. Espacios diseñados para descanso
              y conexión con la naturaleza. Contenido de ejemplo para visualizar el diseño del sitio.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start lg:gap-7">
            <Button
              size="lg"
              className="group w-full sm:w-auto"
              onClick={() => scrollToSection('contact')}
            >
              Reserva tu estadía
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-white/15 bg-white/5 text-white backdrop-blur sm:w-auto"
              onClick={() => scrollToSection('models')}
            >
              Ver modelos disponibles
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 sm:gap-8 sm:pt-8">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left sm:text-center">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Imagen */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="relative w-full"
        >
          <div className="relative h-[420px] w-full overflow-hidden rounded-[28px] border border-white/15 bg-zinc-900 shadow-2xl shadow-black/50 sm:h-[520px]">
            <Image
              src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80"
              alt="Cabaña en Coliumo, sector costero de Tomé"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Modelo de ejemplo</p>
              <p className="text-lg font-semibold text-white">Piscina · Zona exterior</p>
              <p className="text-sm text-white/70">Vista panorámica · Estacionamiento</p>
            </div>
          </div>

          <div className="absolute -left-6 top-10 hidden w-40 rounded-3xl border border-white/20 bg-white/5 p-2 shadow-xl shadow-black/40 lg:block">
            <Image
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=80"
              alt="Terraza equipada con vista al mar"
              width={200}
              height={240}
              className="h-48 w-full rounded-2xl object-cover"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white">
              Terraza con vista
            </p>
            <p className="text-[11px] text-white/70">Espacio exterior</p>
          </div>

          <div className="absolute -bottom-10 right-6 hidden rounded-3xl border border-white/10 bg-black/80 p-6 text-center shadow-2xl shadow-black/50 sm:flex sm:flex-col">
            <p className="text-lg font-semibold text-white">Demo</p>
            <p className="text-xs uppercase tracking-wide text-white/60">Sitio de ejemplo</p>
            <span className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-400">
              Diseño de muestra
            </span>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};
