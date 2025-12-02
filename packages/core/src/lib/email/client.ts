import emailjs from '@emailjs/nodejs';
import type { EmailSendResult } from '../../types/email';

/**
 * Cliente de EmailJS para envío de emails
 * 
 * Usa @emailjs/nodejs (versión servidor) para proteger las credenciales.
 * Conectado a Gmail a través del servicio de EmailJS.
 * 
 * CONFIGURACIÓN REQUERIDA EN EMAILJS DASHBOARD:
 * 1. Crear cuenta en https://emailjs.com
 * 2. Email Services -> Add New Service -> Gmail
 * 3. Email Templates -> Create New Template
 * 4. Account -> API Keys (Public Key + Private Key)
 */

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
    // Lazy initialization
  }

  private initialize() {
    if (this.initialized) return;

    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const fromName = process.env.EMAILJS_FROM_NAME || 'Tres Morros de Coliumo';

    console.log('🔧 [EmailJS] Initializing client...');
    console.log('   Public Key present:', !!publicKey);
    console.log('   Private Key present:', !!privateKey);
    console.log('   Service ID:', serviceId || 'MISSING');
    console.log('   Template ID:', templateId || 'MISSING');
    console.log('   From Name:', fromName);

    if (!publicKey || !privateKey || !serviceId || !templateId) {
      console.warn('⚠️ [EmailJS] Missing required configuration. Emails will not be sent.');
      console.warn('   Required: EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    try {
      // Inicializar EmailJS con las claves
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
    } catch (error) {
      console.error('❌ [EmailJS] Error initializing:', error);
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

    if (!this.isConfigured) {
      console.warn('⚠️ [EmailJS] Not configured. Email not sent:', {
        to: this.resolveRecipient(mailData.to),
        subject: mailData.subject,
      });
      return {
        success: false,
        error: 'EMAILJS_NOT_CONFIGURED',
        mode,
      };
    }

    const recipientEmail = this.resolveRecipient(mailData.to);
    const recipientName = this.resolveRecipientName(mailData.to);

    if (!recipientEmail) {
      console.error('❌ [EmailJS] No recipient email provided');
      return {
        success: false,
        error: 'NO_RECIPIENT',
        mode,
      };
    }

    const maxAttempts = Math.max(1, Number(process.env.EMAILJS_MAX_RETRIES || 3));
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📧 [EmailJS] Attempt ${attempt}/${maxAttempts} - Sending to: ${recipientEmail}`);
        console.log(`   Subject: ${mailData.subject}`);

        // Preparar los parámetros del template
        // Estos nombres deben coincidir con las variables en tu template de EmailJS
        const templateParams = {
          to_email: recipientEmail,
          to_name: recipientName,
          from_name: this.fromName,
          subject: mailData.subject,
          message: mailData.text || '',
          message_html: mailData.html || mailData.text || '',
          // Variables adicionales que podrías necesitar
          reply_to: process.env.EMAILJS_REPLY_TO || recipientEmail,
        };

        const response = await emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams
        );

        console.log(`✅ [EmailJS] Email sent successfully to ${recipientEmail}`, {
          status: response.status,
          text: response.text,
          attempts: attempt,
        });

        return {
          success: true,
          messageId: `emailjs-${Date.now()}`,
          attempts: attempt,
          mode,
        };

      } catch (error: any) {
        lastError = error;

        // DEBUGGING COMPLETO para logs
        console.error(`❌ [EmailJS] Error sending email (attempt ${attempt}/${maxAttempts})`);
        
        // Extraer información del error de forma segura
        if (error) {
          console.error('📋 [EmailJS] Error Status:', error.status || 'N/A');
          console.error('📋 [EmailJS] Error Text:', error.text || error.message || 'Unknown');
          
          // Si el error tiene más propiedades, mostrarlas
          if (typeof error === 'object') {
            console.error('📋 [EmailJS] Full Error:', JSON.stringify(error, null, 2));
          }

          // Diagnóstico específico
          const status = error.status;
          if (status === 401 || status === 403) {
            console.error('🔴 [EmailJS] ERROR AUTHENTICATION');
            console.error('   👉 Verifica EMAILJS_PUBLIC_KEY y EMAILJS_PRIVATE_KEY');
            console.error('   👉 Asegúrate de que las claves sean correctas en EmailJS Dashboard');
          } else if (status === 400) {
            console.error('🔴 [EmailJS] ERROR BAD REQUEST');
            console.error('   👉 Verifica EMAILJS_SERVICE_ID y EMAILJS_TEMPLATE_ID');
            console.error('   👉 Revisa que las variables del template coincidan');
          } else if (status === 422) {
            console.error('🔴 [EmailJS] ERROR VALIDATION');
            console.error('   👉 El template tiene variables requeridas faltantes');
          }
        } else {
          console.error('📋 [EmailJS] Raw error:', error);
        }

        if (attempt < maxAttempts) {
          const waitMs = attempt * 500;
          console.log(`⏳ [EmailJS] Waiting ${waitMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    return {
      success: false,
      error: lastError instanceof Error 
        ? lastError.message 
        : (lastError as any)?.text || 'Unknown error sending email',
      attempts: maxAttempts,
      mode,
    };
  }

  /**
   * Obtener configuración del remitente por defecto
   * (Mantiene compatibilidad con el código existente)
   */
  getDefaultFrom() {
    this.initialize();
    return {
      email: process.env.EMAILJS_FROM_EMAIL || 'noreply@tresmorroscoliumo.cl',
      name: this.fromName,
    };
  }

  /**
   * Verificar si EmailJS está listo
   */
  isReady(): boolean {
    this.initialize();
    return this.isConfigured;
  }
}

// Exportar instancia única (singleton)
export const emailClient = new EmailClient();
