import { NextResponse } from 'next/server'
import { flowClient } from '@/lib/flow/client'

export async function GET() {
  const configured = flowClient.isConfigured()
  const baseUrl = process.env.FLOW_BASE_URL || null
  const apiKeySet = Boolean(process.env.FLOW_API_KEY)
  const secretSet = Boolean(process.env.FLOW_SECRET_KEY)
  const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true'
  
  // Información adicional de diagnóstico
  const runtimeEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || '').toLowerCase()
  const isProdRuntime = runtimeEnv === 'production'
  const allowMockInProd = (process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true'
  const allowSandboxInProd = (process.env.FLOW_ALLOW_SANDBOX_IN_PROD || 'true').toLowerCase() === 'true'
  const isSandbox = baseUrl?.includes('sandbox.flow.cl') ?? false
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || null
  
  // Detectar problemas de configuración
  const issues: string[] = []
  
  if (!configured && !forceMock) {
    if (!apiKeySet) issues.push('FLOW_API_KEY no configurada')
    if (!secretSet) issues.push('FLOW_SECRET_KEY no configurada')
    if (!baseUrl) issues.push('FLOW_BASE_URL no configurada')
  }
  
  if (isProdRuntime && isSandbox && !allowSandboxInProd) {
    issues.push('Sandbox bloqueado en producción. Configura FLOW_ALLOW_SANDBOX_IN_PROD=true')
  }
  
  if (isProdRuntime && !configured && !allowMockInProd) {
    issues.push('Mock bloqueado en producción. Configura las credenciales de Flow')
  }
  
  if (!siteUrl) {
    issues.push('NEXT_PUBLIC_SITE_URL no configurada (requerida para callbacks)')
  }
  
  // Advertencia si está usando sandbox en producción
  if (isProdRuntime && isSandbox) {
    issues.push('⚠️ FLOW_BASE_URL apunta a SANDBOX en entorno de PRODUCCIÓN. Cambia a https://www.flow.cl/api')
  }
  
  // Mostrar URLs de callback que se usarán (rutas correctas)
  const callbackUrls = siteUrl ? {
    webhook: `${siteUrl.replace(/\/$/, '')}/api/payments/flow/webhook`,
    return: `${siteUrl.replace(/\/$/, '')}/api/payments/flow/return`,
  } : null
  
  return NextResponse.json({
    configured,
    baseUrl,
    apiKeySet,
    secretSet,
    forceMock,
    // Diagnóstico extendido
    environment: {
      runtime: runtimeEnv,
      isProd: isProdRuntime,
      allowMockInProd,
      allowSandboxInProd,
    },
    sandbox: {
      isSandbox,
      blocked: isProdRuntime && isSandbox && !allowSandboxInProd,
    },
    callbacks: callbackUrls,
    issues: issues.length > 0 ? issues : null,
    status: issues.length === 0 ? 'ok' : 'issues_detected',
  })
}
