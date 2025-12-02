import sgMail from '@sendgrid/mail';
import type { MailDataRequired, ResponseError } from '@sendgrid/mail';
import type { EmailSendResult } from '../../types/email';

/**
 * IMPORTANTE - Single Sender Verification:
 * El email verificado en SendGrid es: nicolas.saavedra5@virginiogomez.cl
 * Si usas cualquier otro email en el campo 'from', recibirás error 403 Forbidden.
 */
const VERIFIED_SENDER_EMAIL = 'nicolas.saavedra5@virginiogomez.cl';

/**
 * Cliente de SendGrid para envío de emails
 * 
 * Singleton pattern para reutilizar la configuración
 * LAZY INITIALIZATION: Solo se inicializa cuando se usa
 */
class EmailClient {
  private isConfigured: boolean = false;
  private initialized: boolean = false;
  private fromEmail: string = VERIFIED_SENDER_EMAIL;
  private fromName: string = 'Tres Morros de Coliumo';

  constructor() {
    // No hacer nada aquí - lazy initialization
  }

  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || VERIFIED_SENDER_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME || 'Tres Morros de Coliumo';

    console.log('🔧 [SendGrid] Initializing client...');
    console.log('   API Key present:', !!apiKey);
    console.log('   API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
    console.log('   From email:', fromEmail);
    console.log('   From name:', fromName);
    console.log('   Verified sender:', VERIFIED_SENDER_EMAIL);

    // Validación crítica: el email DEBE coincidir con el verificado
    if (fromEmail !== VERIFIED_SENDER_EMAIL) {
      console.warn(`⚠️ [SendGrid] ADVERTENCIA: SENDGRID_FROM_EMAIL (${fromEmail}) no coincide con el sender verificado (${VERIFIED_SENDER_EMAIL})`);
      console.warn('   Esto causará error 403 Forbidden. Usando el email verificado.');
      this.fromEmail = VERIFIED_SENDER_EMAIL;
    }

    if (!apiKey || apiKey === 'placeholder-sendgrid-api-key') {
      console.warn('⚠️ [SendGrid] SENDGRID_API_KEY not configured. Emails will not be sent.');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    if (!fromName) {
      console.error('❌ [SendGrid] SENDGRID_FROM_NAME must be configured');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.fromEmail = fromEmail === VERIFIED_SENDER_EMAIL ? fromEmail : VERIFIED_SENDER_EMAIL;
      this.fromName = fromName;
      this.initialized = true;

      console.log('✅ [SendGrid] Client initialized successfully');
      console.log('   Will send from:', this.fromEmail);
    } catch (error) {
      console.error('❌ [SendGrid] Error initializing:', error);
      this.isConfigured = false;
      this.initialized = true;
    }
  }

  /**
   * Enviar un email
   * 
   * @param mailData - Datos del email según SendGrid
   * @returns Resultado del envío
   */
  async send(mailData: MailDataRequired): Promise<EmailSendResult> {
    this.initialize();

    const mode: EmailSendResult['mode'] = this.isConfigured ? 'live' : 'mock';

    if (!this.isConfigured) {
      console.warn('⚠️ SendGrid no está configurado. Emails reales no serán enviados:', {
        to: mailData.to,
        subject: mailData.subject,
      });
      return {
        success: false,
        error: 'SENDGRID_NOT_CONFIGURED',
        mode,
      };
    }

    const resolveRecipient = (to: MailDataRequired['to']): string => {
      if (typeof to === 'string') return to;
      if (Array.isArray(to)) {
        const [first] = to;
        return first ? resolveRecipient(first as MailDataRequired['to']) : '<sin destinatario>';
      }
      if (to && typeof to === 'object' && 'email' in to && typeof to.email === 'string') {
        return to.email;
      }
      return '<sin destinatario>';
    };

    const maxAttempts = Math.max(
      1,
      Number(process.env.SENDGRID_MAX_RETRIES || 3)
    );
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // CRÍTICO: Forzar el email verificado en el from
        const safeMailData: MailDataRequired = {
          ...mailData,
          from: {
            email: VERIFIED_SENDER_EMAIL,
            name: this.fromName,
          },
        };

        console.log(`📧 [SendGrid] Attempt ${attempt}/${maxAttempts} - Sending to:`, resolveRecipient(mailData.to));
        console.log(`   From: ${VERIFIED_SENDER_EMAIL}`);
        console.log(`   Subject: ${mailData.subject}`);

        const [response] = await sgMail.send(safeMailData);
        const recipient = resolveRecipient(mailData.to);
        console.log(`✅ [SendGrid] Email sent successfully to ${recipient}`, {
          messageId: response.headers['x-message-id'],
          statusCode: response.statusCode,
          attempts: attempt,
        });

        return {
          success: true,
          messageId: response.headers['x-message-id'],
          attempts: attempt,
          mode,
        };
      } catch (error) {
        lastError = error;
        
        // DEBUGGING COMPLETO para DigitalOcean logs
        console.error(`❌ [SendGrid] Error sending email (attempt ${attempt}/${maxAttempts})`);
        
        // Extraer el detalle del error de SendGrid
        const sgError = error as ResponseError;
        if (sgError.response) {
          console.error('📋 [SendGrid] Response Status:', sgError.response.statusCode);
          console.error('📋 [SendGrid] Response Headers:', JSON.stringify(sgError.response.headers, null, 2));
          console.error('📋 [SendGrid] Response Body:', JSON.stringify(sgError.response.body, null, 2));
          
          // Diagnóstico específico por código de error
          const statusCode = sgError.response.statusCode;
          if (statusCode === 401) {
            console.error('🔴 [SendGrid] ERROR 401 - UNAUTHORIZED');
            console.error('   👉 La API Key es inválida o ha expirado');
            console.error('   👉 Verifica SENDGRID_API_KEY en las variables de entorno de DigitalOcean');
          } else if (statusCode === 403) {
            console.error('🔴 [SendGrid] ERROR 403 - FORBIDDEN');
            console.error('   👉 El email remitente NO está verificado en SendGrid');
            console.error(`   👉 Email usado: ${VERIFIED_SENDER_EMAIL}`);
            console.error('   👉 Ve a SendGrid > Settings > Sender Authentication > Single Sender Verification');
            console.error('   👉 Asegúrate de que el email tenga el check verde (VERIFIED)');
          } else if (statusCode === 400) {
            console.error('🔴 [SendGrid] ERROR 400 - BAD REQUEST');
            console.error('   👉 Revisa el formato del email (to, from, subject, content)');
          }
        } else {
          console.error('📋 [SendGrid] Raw error:', error);
        }
        
        if (attempt < maxAttempts) {
          const waitMs = attempt * 500;
          console.log(`⏳ [SendGrid] Waiting ${waitMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    return {
      success: false,
      error:
        lastError instanceof Error
          ? lastError.message
          : 'Unknown error sending email',
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
      email: this.fromEmail,
      name: this.fromName,
    };
  }

  /**
   * Verificar si SendGrid está listo
   */
  isReady(): boolean {
    this.initialize();
    return this.isConfigured;
  }
}

// Exportar instancia única (singleton)
export const emailClient = new EmailClient();
