import sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';
import type { EmailSendResult } from '../../types/email';

/**
 * Cliente de SendGrid para envío de emails
 * 
 * Singleton pattern para reutilizar la configuración
 * LAZY INITIALIZATION: Solo se inicializa cuando se usa
 */
class EmailClient {
  private isConfigured: boolean = false;
  private initialized: boolean = false;
  private fromEmail: string = 'noreply@example.com';
  private fromName: string = 'Tres Morros de Coliumo';

  constructor() {
    // No hacer nada aquí - lazy initialization
  }

  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME;

    console.log('🔧 Initializing SendGrid client...');
    console.log('   API Key present:', !!apiKey);
    console.log('   From email:', fromEmail);
    console.log('   From name:', fromName);

    if (!apiKey || apiKey === 'placeholder-sendgrid-api-key') {
      console.warn('⚠️ SENDGRID_API_KEY not configured. Emails will not be sent.');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    if (!fromEmail || !fromName) {
      console.error('❌ SENDGRID_FROM_EMAIL and SENDGRID_FROM_NAME must be configured');
      this.isConfigured = false;
      this.initialized = true;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.fromEmail = fromEmail;
      this.fromName = fromName;
      this.initialized = true;

      console.log('✅ SendGrid client initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SendGrid:', error);
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
        const [response] = await sgMail.send(mailData);
        const recipient = resolveRecipient(mailData.to);
        console.log(`✅ Email sent successfully to ${recipient}`, {
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
        console.error(`❌ Error sending email (attempt ${attempt}/${maxAttempts}):`, error);
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
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
