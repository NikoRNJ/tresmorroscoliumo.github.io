#!/usr/bin/env node
/**
 * Script de verificación de configuración de Flow para producción
 * 
 * Ejecutar antes de deploy:
 *   node tools/scripts/verify-flow-config.mjs
 * 
 * Este script verifica:
 * 1. Variables de entorno requeridas
 * 2. Configuración de producción vs sandbox
 * 3. URLs de callback correctas
 * 4. Test de conexión con Flow API (opcional)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

// Cargar variables de entorno
const envPaths = [
  join(ROOT_DIR, 'apps', 'web', '.env.local'),
  join(ROOT_DIR, 'apps', 'web', '.env'),
  join(ROOT_DIR, '.env.local'),
  join(ROOT_DIR, '.env'),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    console.log(`📁 Cargado: ${envPath}`);
  }
}

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN FLOW\n');
console.log('='.repeat(50));

let errors = 0;
let warnings = 0;

// ============================================
// 1. VERIFICAR VARIABLES REQUERIDAS
// ============================================
console.log('\n📋 1. VARIABLES DE ENTORNO REQUERIDAS\n');

const requiredVars = {
  FLOW_API_KEY: 'API Key de Flow',
  FLOW_SECRET_KEY: 'Secret Key de Flow (para firmas HMAC)',
  FLOW_BASE_URL: 'URL base de Flow API',
  NEXT_PUBLIC_SITE_URL: 'URL pública del sitio (para callbacks)',
};

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`   ❌ ${varName}: FALTANTE`);
    console.log(`      → ${description}`);
    errors++;
  } else if (value.includes('tu-') || value.includes('coloca-')) {
    console.log(`   ⚠️  ${varName}: Valor placeholder detectado`);
    console.log(`      → Configurar valor real: ${description}`);
    warnings++;
  } else {
    // Ocultar valores sensibles
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET')
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`   ✅ ${varName}: ${maskedValue}`);
  }
}

// ============================================
// 2. VERIFICAR CONFIGURACIÓN DE PRODUCCIÓN
// ============================================
console.log('\n📋 2. CONFIGURACIÓN DE PRODUCCIÓN\n');

const flowBaseUrl = process.env.FLOW_BASE_URL || '';
const isSandbox = flowBaseUrl.toLowerCase().includes('sandbox');
const isProduction = flowBaseUrl.toLowerCase().includes('www.flow.cl');

if (isSandbox) {
  console.log(`   ⚠️  FLOW_BASE_URL apunta a SANDBOX: ${flowBaseUrl}`);
  console.log('      → Para producción real, cambiar a: https://www.flow.cl/api');
  warnings++;
} else if (isProduction) {
  console.log(`   ✅ FLOW_BASE_URL apunta a PRODUCCIÓN: ${flowBaseUrl}`);
} else if (!flowBaseUrl) {
  console.log('   ❌ FLOW_BASE_URL no configurada');
  errors++;
} else {
  console.log(`   ⚠️  FLOW_BASE_URL tiene valor inesperado: ${flowBaseUrl}`);
  warnings++;
}

// Verificar flags de seguridad
const forceMock = (process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true';
const allowMockInProd = (process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true';
const allowSandboxInProd = (process.env.FLOW_ALLOW_SANDBOX_IN_PROD || '').toLowerCase() === 'true';

if (forceMock) {
  console.log('   ⚠️  FLOW_FORCE_MOCK=true - Flow en modo MOCK');
  console.log('      → Cambiar a false para pagos reales');
  warnings++;
} else {
  console.log('   ✅ FLOW_FORCE_MOCK=false o no definido');
}

if (allowMockInProd) {
  console.log('   ⚠️  FLOW_ALLOW_MOCK_IN_PROD=true - Mock permitido en producción');
  console.log('      → Cambiar a false para seguridad');
  warnings++;
} else {
  console.log('   ✅ FLOW_ALLOW_MOCK_IN_PROD=false o no definido');
}

if (allowSandboxInProd && isSandbox) {
  console.log('   ⚠️  Sandbox permitido en producción + URL de sandbox');
  warnings++;
}

// ============================================
// 3. VERIFICAR URLs DE CALLBACK
// ============================================
console.log('\n📋 3. URLs DE CALLBACK\n');

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
const publicExternalUrl = process.env.PUBLIC_EXTERNAL_URL || '';

if (siteUrl) {
  try {
    const url = new URL(siteUrl);
    const isHttps = url.protocol === 'https:';
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    
    if (!isHttps && !isLocalhost) {
      console.log(`   ⚠️  NEXT_PUBLIC_SITE_URL no usa HTTPS: ${siteUrl}`);
      console.log('      → Flow requiere HTTPS para callbacks en producción');
      warnings++;
    } else {
      console.log(`   ✅ NEXT_PUBLIC_SITE_URL: ${siteUrl}`);
    }
    
    // Mostrar URLs de callback que deben configurarse en Flow
    console.log('\n   📌 URLs a configurar en el Dashboard de Flow:');
    console.log(`      Webhook (urlConfirmation): ${siteUrl}/api/payments/flow/webhook`);
    console.log(`      Return (urlReturn): ${siteUrl}/api/payments/flow/return`);
  } catch (e) {
    console.log(`   ❌ NEXT_PUBLIC_SITE_URL inválida: ${siteUrl}`);
    errors++;
  }
} else {
  console.log('   ❌ NEXT_PUBLIC_SITE_URL no configurada');
  errors++;
}

// ============================================
// 4. VERIFICAR CREDENCIALES (Formato)
// ============================================
console.log('\n📋 4. FORMATO DE CREDENCIALES\n');

const apiKey = process.env.FLOW_API_KEY || '';
const secretKey = process.env.FLOW_SECRET_KEY || '';

// Verificar formato típico de API Key de Flow (UUID con guiones)
const uuidPattern = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Za-z]{12}$/;
if (apiKey && !uuidPattern.test(apiKey)) {
  console.log(`   ⚠️  FLOW_API_KEY no tiene formato UUID típico`);
  console.log(`      → Formato esperado: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`);
  console.log(`      → Verificar que la clave sea correcta`);
  warnings++;
} else if (apiKey) {
  console.log(`   ✅ FLOW_API_KEY tiene formato válido`);
}

// Verificar que secretKey tenga longitud razonable (típicamente 40+ caracteres)
if (secretKey && secretKey.length < 30) {
  console.log(`   ⚠️  FLOW_SECRET_KEY parece muy corta (${secretKey.length} chars)`);
  warnings++;
} else if (secretKey) {
  console.log(`   ✅ FLOW_SECRET_KEY tiene longitud adecuada (${secretKey.length} chars)`);
}

// ============================================
// 5. RESUMEN
// ============================================
console.log('\n' + '='.repeat(50));
console.log('\n📊 RESUMEN DE VERIFICACIÓN\n');

if (errors === 0 && warnings === 0) {
  console.log('   ✅ ¡Configuración correcta! Lista para producción.');
} else {
  if (errors > 0) {
    console.log(`   ❌ ${errors} error(es) crítico(s) - CORREGIR antes de deploy`);
  }
  if (warnings > 0) {
    console.log(`   ⚠️  ${warnings} advertencia(s) - Revisar antes de deploy`);
  }
}

console.log('\n' + '='.repeat(50));

// ============================================
// 6. INSTRUCCIONES PARA DIGITALOCEAN
// ============================================
console.log('\n📌 VARIABLES PARA DIGITALOCEAN APP PLATFORM:\n');
console.log(`   FLOW_API_KEY=<tu-api-key-produccion>`);
console.log(`   FLOW_SECRET_KEY=<tu-secret-key-produccion>`);
console.log(`   FLOW_BASE_URL=https://www.flow.cl/api`);
console.log(`   FLOW_FORCE_MOCK=false`);
console.log(`   FLOW_ALLOW_MOCK_IN_PROD=false`);
console.log(`   FLOW_ALLOW_SANDBOX_IN_PROD=false`);
console.log(`   NEXT_PUBLIC_SITE_URL=https://www.tresmorroscoliumo.cl`);
console.log(`   PUBLIC_EXTERNAL_URL=https://www.tresmorroscoliumo.cl`);
console.log('');

// Exit code
process.exit(errors > 0 ? 1 : 0);
