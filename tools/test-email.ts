import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { sendBookingConfirmation } from '../packages/core/src/lib/email/service';

async function testEmail() {
    console.log('📧 Testing EmailJS Email...');
    console.log('Public Key:', process.env.EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing');
    console.log('Private Key:', process.env.EMAILJS_PRIVATE_KEY ? 'Set' : 'Missing');
    console.log('Service ID:', process.env.EMAILJS_SERVICE_ID || 'Missing');
    console.log('Template ID:', process.env.EMAILJS_TEMPLATE_ID || 'Missing');
    console.log('From Name:', process.env.EMAILJS_FROM_NAME);
    console.log('From Email:', process.env.EMAILJS_FROM_EMAIL);

    if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
        console.error('❌ EMAILJS_PUBLIC_KEY or EMAILJS_PRIVATE_KEY is missing');
        return;
    }

    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
        console.error('❌ EMAILJS_SERVICE_ID or EMAILJS_TEMPLATE_ID is missing');
        return;
    }

    // Email de destino para pruebas (cámbialo por tu email)
    const testEmail = process.env.EMAILJS_FROM_EMAIL || 'tu_email@gmail.com';

    try {
        const result = await sendBookingConfirmation({
            to: {
                email: testEmail,
                name: 'Test User',
            },
            subject: 'Test Email from Debug Script - EmailJS',
            bookingId: 'test-booking-id',
            bookingReference: 'TEST-REF',
            cabinName: 'Cabaña de Prueba',
            cabinSlug: 'cabana-prueba',
            checkInDate: '2025-01-01',
            checkOutDate: '2025-01-05',
            numberOfGuests: 2,
            hasJacuzzi: true,
            jacuzziDays: ['2025-01-02'],
            towelsCount: 2,
            towelsPrice: 4000,
            totalPrice: 150000,
            customerName: 'Test User',
            customerEmail: testEmail,
            customerPhone: '+56912345678',
        });

        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

testEmail();
