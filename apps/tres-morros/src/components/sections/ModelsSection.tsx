/**
 * Models Section - Catálogo de modelos de cabañas
 */
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Bath, Square, Layers, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Section, SectionHeader, Card, Button } from '@/components/ui';
import { cabanaModels } from '@/lib/data';
import { staggerContainer, staggerItem, formatPrice } from '@/lib/utils';
import { useScrollTo } from '@/hooks';

export const ModelsSection: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const { scrollToSection } = useScrollTo();

  const handleContactClick = () => {
    scrollToSection('contact');
  };

  return (
    <Section id="models" background="darker" width="wide">
      <SectionHeader
        title="MODELOS DISPONIBLES"
        subtitle="Tres opciones de ejemplo"
        description="Contenido de muestra para visualizar el diseño del sitio. Conoce los tres modelos de cabañas ubicadas en Coliumo, sector costero de Tomé."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="mx-auto w-full max-w-6xl space-y-14 sm:space-y-16"
      >
        {cabanaModels.map((model, index) => (
          <motion.div
            key={model.id}
            variants={staggerItem}
            onHoverStart={() => setSelectedModel(model.id)}
            onHoverEnd={() => setSelectedModel(null)}
            className="flex w-full justify-center"
          >
            <Card className="w-full overflow-hidden border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/30">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className={`relative h-80 w-full lg:h-full ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
                  <Image
                    src={model.images.main}
                    alt={model.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {model.available && (
                    <div className="absolute top-5 right-5 z-20 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
                      Disponible
                    </div>
                  )}
                </div>

                <div
                  className={`flex w-full flex-col items-center px-10 py-12 text-center sm:px-14 sm:py-16 lg:px-20 lg:py-20 ${index % 2 === 1 ? 'lg:order-1' : ''}`}
                >
                  <motion.div
                    initial={false}
                    animate={{ scale: selectedModel === model.id ? 1.02 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-3xl lg:text-4xl font-bold text-white">{model.name}</h3>
                    <p className="mt-4 text-base leading-relaxed text-white/70">{model.description}</p>

                    <div className="mt-10 grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2">
                      {model.specifications.map((spec) => (
                        <div key={spec.label}>
                          <p className="text-sm text-white/60">{spec.label}</p>
                          <p className="text-base font-semibold text-white">{spec.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex w-full flex-wrap justify-center gap-5 border-b border-white/10 pb-8 text-white/70">
                      <div className="flex items-center space-x-2">
                        <Square size={20} />
                        <span>{model.dimensions.area} m²</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bed size={20} />
                        <span>{model.dimensions.bedrooms} Hab.</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bath size={20} />
                        <span>{model.dimensions.bathrooms} Baños</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Layers size={20} />
                        <span>{model.dimensions.floors} Piso(s)</span>
                      </div>
                    </div>

                    <div className="mt-8 flex w-full flex-col items-center justify-center gap-6 text-center sm:flex-row">
                      <div>
                        <p className="text-base text-white/60">Desde</p>
                        <p className="text-4xl font-bold text-white">
                          {formatPrice(model.price.amount, model.price.currency)}
                        </p>
                        {model.price.period && (
                          <p className="text-sm text-white/60">por {model.price.period}</p>
                        )}
                      </div>
                      <Button onClick={handleContactClick} size="lg" className="group w-full sm:w-auto">
                        Reservar {model.name}
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
};
