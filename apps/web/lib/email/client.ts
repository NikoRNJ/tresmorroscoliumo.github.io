/**
 * Re-export del cliente de email desde @tresmorros/core
 * 
 * Este archivo existe para mantener compatibilidad con los imports
 * que usan @/lib/email/client en las API routes de la app web.
 */
export { emailClient, type EmailData } from '@tresmorros/core';
