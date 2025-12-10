/**
 * Sistema de autenticación simple para el admin
 * 
 * IMPORTANTE: Este es un sistema básico. En producción se recomienda
 * usar un sistema más robusto como NextAuth.js o Supabase Auth.
 * 
 * Iteración 7: Panel de Administración
 * 
 * NOTA: Las variables de entorno se leen en tiempo de ejecución (getters)
 * para evitar problemas con HMR y cache de módulos en desarrollo.
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000

// Getters para leer variables de entorno en tiempo de ejecución
// Esto evita problemas con HMR donde las variables se evalúan antes de estar disponibles
function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD
}

function getAdminPasswordHash(): string | undefined {
  return process.env.ADMIN_PASSWORD_HASH
}

function getAdminSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET
}

function isProd(): boolean {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase()
  const siteEnv = (process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase()
  return nodeEnv === 'production' || siteEnv === 'production'
}

/**
 * Obtiene el hash almacenado de la contraseña (en tiempo de ejecución)
 */
function getStoredPasswordHash(): string | null {
  const hashFromEnv = getAdminPasswordHash()
  if (hashFromEnv) return hashFromEnv
  
  const password = getAdminPassword()
  if (password) return hashPassword(password)
  
  return null
}

/**
 * Hash de la contraseña con SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function signToken(token: string): string {
  const secret = getAdminSessionSecret()
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not defined')
  }
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

function verifySignature(token: string, signature: string): boolean {
  if (!getAdminSessionSecret()) return false
  const expected = signToken(token)
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verificar si la contraseña es correcta
 */
export function verifyAdminPassword(password: string): boolean {
  const storedHash = getStoredPasswordHash()
  if (!storedHash) {
    console.warn('⚠️ verifyAdminPassword: No password hash available')
    return false
  }
  const attemptHash = hashPassword(password)
  return timingSafeCompare(attemptHash, storedHash)
}

/**
 * Crear sesión de admin
 */
export async function createAdminSession(): Promise<string> {
  if (!getAdminSessionSecret()) {
    throw new Error('ADMIN_SESSION_SECRET is required to create admin sessions')
  }
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const signature = signToken(sessionToken)
  const value = `${sessionToken}.${signature}`
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  cookies().set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: isProd(),
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
