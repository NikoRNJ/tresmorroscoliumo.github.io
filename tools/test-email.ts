import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { sendBookingConfirmation } from '../packages/core/src/lib/email/service';

async function testEmail() {
    console.log('📧 Testing SendGrid Email...');
    console.log('API Key:', process.env.SENDGRID_API_KEY ? 'Set' : 'Missing');
    console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);

    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SENDGRID_API_KEY is missing');
        return;
    }

    try {
        const result = await sendBookingConfirmation({
            to: {
                email: 'nicolas.saavedra5@virginiogomez.cl', // Usar el mismo email verificado para probar
                name: 'Test User',
            },
            subject: 'Test Email from Debug Script',
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
            customerEmail: 'nicolas.saavedra5@virginiogomez.cl',
            customerPhone: '+56912345678',
        });

        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

testEmail();
