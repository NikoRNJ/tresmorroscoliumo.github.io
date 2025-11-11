/**
 * Footer - Información institucional y enlaces
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Mail, MessageCircle, MapPin, Phone, Heart } from 'lucide-react';
import { layoutConfig } from '@/lib/config/layout';
import { siteConfig, navItems } from '@/lib/config/site';
import { useScrollTo } from '@/hooks';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/utils';

const socialIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  facebook: Facebook,
  instagram: Instagram,
  email: Mail,
  whatsapp: MessageCircle,
};

export const Footer: React.FC = () => {
  const { scrollToSection } = useScrollTo();
  const currentYear = new Date().getFullYear();

  const handleNavClick = (href: string) => {
    const sectionId = href.replace('#', '');
    scrollToSection(sectionId);
  };

  return (
    <footer className="border-t border-white/10 bg-black/80">
      <div className={`${layoutConfig.base} ${layoutConfig.widths.base} py-14`}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem} className="text-center sm:text-left">
            <h3 className="text-3xl font-semibold text-white">Cabañas</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Sitio de ejemplo para visualización de diseño. Tres modelos de cabañas ubicadas en Coliumo, 
              sector costero de Tomé, Región del Biobío.
            </p>
            <div className="mt-6 flex justify-center gap-3 sm:justify-start">
              {siteConfig.social.map((social) => {
                const Icon = socialIcons[social.platform];
                if (!Icon) return null;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 p-2.5 text-white/70 transition-all hover:border-white/40 hover:text-white"
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="text-center sm:text-left">
            <h4 className="text-lg font-semibold text-white">Navegación</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className="transition-colors hover:text-white"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={staggerItem} className="text-center sm:text-left">
            <h4 className="text-lg font-semibold text-white">Contacto</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start justify-center gap-3 sm:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" />
                <span>Camino Coliumo s/n · Tomé · Biobío</span>
              </li>
              <li className="flex items-center justify-center gap-3 sm:justify-start">
                <Phone className="h-4 w-4 flex-shrink-0 text-white" />
                <a href="tel:+56955555555" className="hover:text-white">
                  +56 9 5555 5555
                </a>
              </li>
              <li className="flex items-center justify-center gap-3 sm:justify-start">
                <Mail className="h-4 w-4 flex-shrink-0 text-white" />
                <a href={`mailto:${siteConfig.author.email}`} className="break-all hover:text-white">
                  {siteConfig.author.email}
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={staggerItem} className="text-center sm:text-left">
            <h4 className="text-lg font-semibold text-white">Horarios</h4>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span>Check-in</span>
                <span className="font-semibold text-white">15:00 - 22:00</span>
              </li>
              <li className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span>Check-out</span>
                <span className="font-semibold text-white">11:00</span>
              </li>
              <li className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span>WhatsApp</span>
                <span className="font-semibold text-white">24/7</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/60 sm:text-sm"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {currentYear} Cabañas. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <button className="transition-colors hover:text-white">Política de privacidad</button>
              <span>|</span>
              <button className="transition-colors hover:text-white">Términos de servicio</button>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
