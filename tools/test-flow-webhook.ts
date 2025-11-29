import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testWebhook() {
    console.log('🔄 Testing Flow Webhook...');

    const token = 'test-token-' + Date.now();
    const url = 'http://localhost:3000/api/payments/flow/webhook';

    console.log('Target URL:', url);
    console.log('Token:', token);

    // Nota: Este script solo prueba que el endpoint responda. 
    // Para una prueba real, necesitaríamos mockear flowClient.getPaymentStatus 
    // o tener un token real de sandbox.

    try {
        const formData = new URLSearchParams();
        formData.append('token', token);
        // formData.append('s', 'signature'); // Opcional si validación está activa

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('❌ Error calling webhook:', error);
    }
}

testWebhook();
