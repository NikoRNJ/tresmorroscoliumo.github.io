'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Container, Section } from '../ui/Container';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Section id="contacto" padding="lg" className="bg-dark-950">
      <Container size="md">
        <div className="text-center mb-12">
          <h2 className="heading-secondary mb-4">
            <span className="text-primary-500">Contacto</span>
          </h2>
          <p className="text-xl text-gray-400">
            ¿Tienes preguntas o deseas hacer una reserva? Escríbenos y te responderemos
            a la brevedad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              placeholder="Tu nombre"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              placeholder="tu@email.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              placeholder="+56 9 1234 5678"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-500 transition-all resize-none"
              placeholder="Cuéntanos sobre tu reserva, fechas de interés, número de personas, etc."
            />
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
              ¡Mensaje enviado con éxito! Te responderemos pronto.
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              Hubo un error al enviar el mensaje. Por favor intenta nuevamente.
            </div>
          )}

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Mensaje'}
          </Button>
        </form>
      </Container>
    </Section>
  );
}
