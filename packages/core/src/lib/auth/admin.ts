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
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000
const NODE_ENV = (process.env.NODE_ENV || '').toLowerCase()
const SITE_ENV = (process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase()
const IS_PROD = NODE_ENV === 'production' || SITE_ENV === 'production'

const storedPasswordHash =
  ADMIN_PASSWORD_HASH ||
  (ADMIN_PASSWORD ? hashPassword(ADMIN_PASSWORD) : null)

if (!storedPasswordHash) {
  console.warn('⚠️ ADMIN_PASSWORD/ADMIN_PASSWORD_HASH not set. Admin panel will not be accessible.')
}
if (!ADMIN_SESSION_SECRET) {
  console.warn('⚠️ ADMIN_SESSION_SECRET not set. Admin sessions will be rejected.')
}

/**
 * Hash de la contraseña con SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function signToken(token: string): string {
  if (!ADMIN_SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET is not defined')
  }
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(token).digest('hex')
}

function verifySignature(token: string, signature: string): boolean {
  if (!ADMIN_SESSION_SECRET) return false
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
  if (!storedPasswordHash) return false
  const attemptHash = hashPassword(password)
  return timingSafeCompare(attemptHash, storedPasswordHash)
}

/**
 * Crear sesión de admin
 */
export async function createAdminSession(): Promise<string> {
  if (!ADMIN_SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET is required to create admin sessions')
  }
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const signature = signToken(sessionToken)
  const value = `${sessionToken}.${signature}`
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  cookies().set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: IS_PROD,
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
