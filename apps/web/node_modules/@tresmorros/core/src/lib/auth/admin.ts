/**
 * Sistema de autenticación simple para el admin
 * 
 * IMPORTANTE: Este es un sistema básico. En producción se recomienda
 * usar un sistema más robusto como NextAuth.js o Supabase Auth.
 * 
 * Iteración 7: Panel de Administración
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000

if (!ADMIN_PASSWORD) {
  console.warn('⚠️ ADMIN_PASSWORD not set. Admin panel will not be accessible.')
}

/**
 * Hash de la contraseña con SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function signToken(token: string): string {
  if (!ADMIN_SESSION_SECRET) return ''
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(token).digest('hex')
}

function verifySignature(token: string, signature: string): boolean {
  if (!ADMIN_SESSION_SECRET) return false
  const expected = signToken(token)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

/**
 * Verificar si la contraseña es correcta
 */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false
  return hashPassword(password) === hashPassword(ADMIN_PASSWORD)
}

/**
 * Crear sesión de admin
 */
export async function createAdminSession(): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const signature = signToken(sessionToken)
  const value = `${sessionToken}.${signature}`
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  cookies().set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  })

  return sessionToken
}

/**
 * Verificar si hay sesión activa de admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = cookies().get(SESSION_COOKIE_NAME)
  if (!session || !session.value) return false
  const parts = session.value.split('.')
  if (parts.length !== 2) return false
  const [token, signature] = parts
  return verifySignature(token, signature)
}

/**
 * Cerrar sesión de admin
 */
export async function destroyAdminSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME)
}

/**
 * Middleware para proteger rutas de admin
 */
export async function requireAdmin(): Promise<boolean> {
  const ok = await isAdminAuthenticated()
  if (!ok) return false
  return true
}
