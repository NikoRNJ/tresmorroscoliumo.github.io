/**
 * Componente Header/Navigation
 * Barra fija con navegación responsiva y CTA destacado
 */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { layoutConfig } from '@/lib/config/layout';
import { navItems } from '@/lib/config/site';
import { cn } from '@/lib/utils';
import { useScroll, useScrollTo } from '@/hooks';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isScrolled = useScroll(50);
  const { scrollToSection } = useScrollTo();

  const handleNavClick = (href: string) => {
    const sectionId = href.replace('#', '');
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b transition-all duration-300',
        isScrolled
          ? 'bg-black/90 backdrop-blur-md border-white/10 shadow-2xl shadow-black/30'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent border-transparent'
      )}
    >
      <nav
        className={cn(
          layoutConfig.base,
          layoutConfig.widths.wide,
          'flex h-20 w-full items-center justify-between sm:h-24 lg:h-[92px]'
        )}
      >
        <div className="flex flex-1 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center"
          >
            <button
              onClick={() => handleNavClick('#hero')}
              className="text-2xl font-semibold uppercase tracking-tight text-white transition-colors hover:text-gray-200 sm:text-3xl"
            >
              Cabañas
            </button>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden flex-1 items-center justify-center lg:flex"
        >
              <div className="flex items-center gap-10 xl:gap-14 2xl:gap-20">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => handleNavClick(item.href)}
                className="text-base font-semibold uppercase tracking-wide text-white/85 transition-all hover:text-white"
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-xl border border-white/10 p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Mostrar menú"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>

          <div className="hidden lg:flex">
            <Button
              variant="outline"
              size="default"
              onClick={() => handleNavClick('#contact')}
              className="shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Reserva ahora
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-40 border-t border-white/10 bg-black/95 backdrop-blur lg:hidden"
            >
              <div
                className={cn(
                  layoutConfig.base,
                  layoutConfig.widths.base,
                  'space-y-4 py-8'
                )}
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.href)}
                    className="block w-full rounded-2xl border border-white/15 px-6 py-4 text-lg font-semibold tracking-wide text-white transition-colors hover:bg-white/10"
                  >
                    {item.label}
                  </button>
                ))}
                <Button
                  variant="outline"
                  className="w-full py-4 text-lg"
                  onClick={() => handleNavClick('#contact')}
                >
                  Reserva ahora
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
