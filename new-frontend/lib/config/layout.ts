/**
 * Configuración centralizada para el layout del sitio.
 * Nos permite reutilizar reglas de ancho y padding para mantener todo alineado.
 */
export type LayoutWidth = 'narrow' | 'base' | 'wide' | 'full';

export const layoutConfig = {
  base: 'mx-auto w-full px-4 sm:px-8 lg:px-12 xl:px-16',
  widths: {
    narrow: 'max-w-4xl',
    base: 'max-w-[1200px]',
    wide: 'max-w-[1400px]',
    full: 'max-w-none',
  } satisfies Record<LayoutWidth, string>,
};

export const getContainerClasses = (width: LayoutWidth = 'base') =>
  `${layoutConfig.base} ${layoutConfig.widths[width]}`;
