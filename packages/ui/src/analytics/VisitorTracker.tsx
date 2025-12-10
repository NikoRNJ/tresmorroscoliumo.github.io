'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Componente que registra visitas al sitio
 * Se coloca en el layout principal para rastrear todas las páginas
 * 
 * Características:
 * - Evita duplicados en la misma sesión
 * - No bloquea el render
 * - Maneja errores silenciosamente
 */
export function VisitorTracker() {
    const pathname = usePathname();
    const trackedPaths = useRef<Set<string>>(new Set());

    useEffect(() => {
        // No rastrear la misma ruta más de una vez por sesión
        if (trackedPaths.current.has(pathname)) {
            return;
        }

        // Marcar como rastreada
        trackedPaths.current.add(pathname);

        // Registrar visita de forma asíncrona (no bloquea)
        const trackVisit = async () => {
            try {
                await fetch('/api/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: document.referrer || null,
                    }),
                    // No bloquear navegación
                    keepalive: true,
                });
            } catch {
                // Silenciar errores - no es crítico
            }
        };

        // Ejecutar después de que la página cargue
        if (document.readyState === 'complete') {
            trackVisit();
        } else {
            window.addEventListener('load', trackVisit, { once: true });
        }
    }, [pathname]);

    // Este componente no renderiza nada visible
    return null;
}
