import emailjs from '@emailjs/nodejs';
import type { EmailSendResult } from '../../types/email';

/**
 * Cliente de EmailJS para envío de emails
 * 
 * Usa @emailjs/nodejs (versión servidor) para proteger las credenciales.
 * Conectado a Gmail a través del servicio de EmailJS.
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - EMAILJS_PUBLIC_KEY: Clave pública de EmailJS
 * - EMAILJS_PRIVATE_KEY: Clave privada de EmailJS (encriptar en DigitalOcean)
 * - EMAILJS_SERVICE_ID: ID del servicio de Gmail en EmailJS
 * - EMAILJS_TEMPLATE_ID: ID del template de email en EmailJS
 * 
 * OPCIONALES:
 * - EMAILJS_FROM_NAME: Nombre del remitente (default: "Tres Morros de Coliumo")
 * - EMAILJS_FROM_EMAIL: Email del remitente para logs
 * - EMAILJS_MAX_RETRIES: Número de reintentos (default: 3)
 */

/**
 * Lista de variables de entorno requeridas
 */
const REQUIRED_ENV_VARS = [
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY', 
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
] as const;

/**
 * Interfaz para los datos del email
 */
export interface EmailData {
  to: string | { email: string; name?: string };
  subject: string;
  text?: string;
  html?: string;
  from?: { email: string; name: string };
}

/**
 * Validar que todas las variables de entorno requeridas estén presentes
 * @returns Array de variables faltantes
 */
function validateEnvVars(): string[] {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '' || value.includes('tu_')) {
      missing.push(varName);
    }
  }
  
  return missing;
}

/**
 * Cliente de EmailJS para envío de emails
 * Singleton pattern con lazy initialization
 */
class EmailClient {
  private isConfigured: boolean = false;
  private initialized: boolean = false;
  private serviceId: string = '';
  private templateId: string = '';
  private fromName: string = 'Tres Morros de Coliumo';

  constructor() {
    // Lazy initialization - no hacer nada aquí
  }

  /**
   * Inicialización lazy del cliente
   * Solo se ejecuta una vez cuando se necesita
   */
  private initialize(): void {
    if (this.initialized) return;

    console.log('🔧 [EmailJS] Initializing client...');

    // 1. VALIDACIÓN: Verificar que todas las variables existan
    const missingVars = validateEnvVars();
    
    if (missingVars.length > 0) {
      console.error('❌ [EmailJS] CONFIGURATION ERROR - Missing environment variables:');
      missingVars.forEach(varName => {
        console.error(`   ❌ ${varName} is MISSING or invalid`);
      });
      console.error('');
      console.error('   👉 Configure these variables in DigitalOcean App Platform:');
      console.error('      Settings → App-Level Environment Variables');
      console.error('');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    // 2. SEGURIDAD: Obtener valores de process.env (nunca hardcodeados)
    const publicKey = process.env.EMAILJS_PUBLIC_KEY!;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY!;
    const serviceId = process.env.EMAILJS_SERVICE_ID!;
    const templateId = process.env.EMAILJS_TEMPLATE_ID!;
    const fromName = process.env.EMAILJS_FROM_NAME || 'Tres Morros de Coliumo';

    // Log de configuración (sin mostrar claves completas)
    console.log('   ✓ EMAILJS_PUBLIC_KEY:', publicKey.substring(0, 8) + '...');
    console.log('   ✓ EMAILJS_PRIVATE_KEY:', '***' + privateKey.slice(-4));
    console.log('   ✓ EMAILJS_SERVICE_ID:', serviceId);
    console.log('   ✓ EMAILJS_TEMPLATE_ID:', templateId);
    console.log('   ✓ From Name:', fromName);

    try {
      // 3. Inicializar EmailJS SDK
      emailjs.init({
        publicKey: publicKey,
        privateKey: privateKey,
      });

      this.serviceId = serviceId;
      this.templateId = templateId;
      this.fromName = fromName;
      this.isConfigured = true;
      this.initialized = true;

      console.log('✅ [EmailJS] Client initialized successfully');
      console.log('');
    } catch (error: any) {
      console.error('❌ [EmailJS] Failed to initialize SDK:', error?.message || error);
      this.isConfigured = false;
      this.initialized = true;
    }
  }

  /**
   * Resolver el email del destinatario
   */
  private resolveRecipient(to: EmailData['to']): string {
    if (typeof to === 'string') return to;
    if (to && typeof to === 'object' && 'email' in to) {
      return to.email;
    }
    return '';
  }

  /**
   * Resolver el nombre del destinatario
   */
  private resolveRecipientName(to: EmailData['to']): string {
    if (typeof to === 'string') return to.split('@')[0];
    if (to && typeof to === 'object' && 'name' in to && to.name) {
      return to.name;
    }
    if (to && typeof to === 'object' && 'email' in to) {
      return to.email.split('@')[0];
    }
    return 'Cliente';
  }

  /**
   * Enviar un email usando EmailJS
   * 
   * @param mailData - Datos del email
   * @returns Resultado del envío
   */
  async send(mailData: EmailData): Promise<EmailSendResult> {
    this.initialize();

    const mode: EmailSendResult['mode'] = this.isConfigured ? 'live' : 'mock';

    // Verificar configuración
    if (!this.isConfigured) {
      const missingVars = validateEnvVars();
      console.error('⚠️ [EmailJS] Cannot send email - client not configured');
      if (missingVars.length > 0) {
        console.error('   Missing variables:', missingVars.join(', '));
      }
      return {
        success: false,
        error: `EMAILJS_NOT_CONFIGURED: Missing ${missingVars.join(', ')}`,
        mode,
      };
    }

    const recipientEmail = this.resolveRecipient(mailData.to);
    const recipientName = this.resolveRecipientName(mailData.to);

    if (!recipientEmail) {
      console.error('❌ [EmailJS] No recipient email provided');
      return {
        success: false,
        error: 'NO_RECIPIENT_EMAIL',
        mode,
      };
    }

    const maxAttempts = Math.max(1, Number(process.env.EMAILJS_MAX_RETRIES || 3));
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📧 [EmailJS] Attempt ${attempt}/${maxAttempts}`);
        console.log(`   To: ${recipientEmail}`);
        console.log(`   Subject: ${mailData.subject}`);

        // Preparar los parámetros del template
        // IMPORTANTE: Estos nombres DEBEN coincidir con las variables en tu template de EmailJS
        const templateParams = {
          to_email: recipientEmail,
          to_name: recipientName,
          from_name: this.fromName,
          subject: mailData.subject,
          message: mailData.text || '',
          message_html: mailData.html || mailData.text || '',
          reply_to: process.env.EMAILJS_REPLY_TO || recipientEmail,
        };

        // Enviar email
        const response = await emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams
        );

        // ÉXITO
        console.log(`✅ [EmailJS] Email sent successfully!`);
        console.log(`   Recipient: ${recipientEmail}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${response.text}`);
        console.log(`   Attempts: ${attempt}`);

        return {
          success: true,
          messageId: `emailjs-${Date.now()}-${response.status}`,
          attempts: attempt,
          mode,
        };

      } catch (error: any) {
        lastError = error;

        // MANEJO DE ERRORES ROBUSTO
        console.error(`❌ [EmailJS] Send failed (attempt ${attempt}/${maxAttempts})`);
        
        // Extraer información del error de forma segura (evita errores de TypeScript)
        const errorStatus = error?.status ?? error?.code ?? 'UNKNOWN';
        const errorText = error?.text ?? error?.message ?? 'No error message available';
        
        console.error(`   Status: ${errorStatus}`);
        console.error(`   Message: ${errorText}`);
        
        // Log completo del error para debugging
        try {
          const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
          console.error(`   Full Error: ${errorDetails}`);
        } catch {
          console.error(`   Raw Error:`, error);
        }

        // Diagnóstico específico por código de error
        if (errorStatus === 401 || errorStatus === 403) {
          console.error('');
          console.error('🔴 AUTHENTICATION ERROR');
          console.error('   → Check EMAILJS_PUBLIC_KEY is correct');
          console.error('   → Check EMAILJS_PRIVATE_KEY is correct');
          console.error('   → Verify keys in EmailJS Dashboard → Account → API Keys');
        } else if (errorStatus === 400) {
          console.error('');
          console.error('🔴 BAD REQUEST ERROR');
          console.error('   → Check EMAILJS_SERVICE_ID exists in EmailJS Dashboard');
          console.error('   → Check EMAILJS_TEMPLATE_ID exists in EmailJS Dashboard');
        } else if (errorStatus === 422) {
          console.error('');
          console.error('🔴 TEMPLATE VALIDATION ERROR');
          console.error('   → Your template requires variables that are missing');
          console.error('   → Check template variables match: to_email, to_name, from_name, subject, message_html');
        } else if (errorStatus === 429) {
          console.error('');
          console.error('🔴 RATE LIMIT ERROR');
          console.error('   → You have exceeded the EmailJS rate limit');
          console.error('   → Free tier: 200 emails/month');
        }

        // Retry con backoff
        if (attempt < maxAttempts) {
          const waitMs = attempt * 1000;
          console.log(`⏳ [EmailJS] Retrying in ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    // Todos los intentos fallaron
    const finalErrorMessage = lastError?.text ?? lastError?.message ?? 'Email send failed after all retries';
    
    return {
      success: false,
      error: finalErrorMessage,
      attempts: maxAttempts,
      mode,
    };
  }

  /**
   * Obtener configuración del remitente por defecto
   */
  getDefaultFrom() {
    this.initialize();
    return {
      email: process.env.EMAILJS_FROM_EMAIL || 'noreply@tresmorroscoliumo.cl',
      name: this.fromName,
    };
  }

  /**
   * Verificar si EmailJS está listo para enviar emails
   */
  isReady(): boolean {
    this.initialize();
    return this.isConfigured;
  }
}

// Exportar instancia única (singleton)
export const emailClient = new EmailClient();
