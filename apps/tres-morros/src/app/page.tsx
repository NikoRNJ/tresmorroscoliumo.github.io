import Link from "next/link";
import Image from "next/image";
import { CABINS } from "@/data/cabins";

export default function Home() {
  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* Placeholder para imagen hero */}
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Cabañas en Coliumo para disfrutar de la naturaleza y el mar.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Las mejores cabañas en Coliumo, sector costero de Tomé, Región del Bío Bío, 
              ideal para relajarse y disfrutar de la naturaleza y paisajes del mar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#modelos"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
              >
                Ver Modelos
              </Link>
              <Link
                href="#contacto"
                className="px-8 py-4 border-2 border-white hover:bg-white hover:text-black rounded-lg font-semibold text-lg transition-colors"
              >
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestras Cabañas Section */}
      <section id="cabanas" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              NUESTRAS CABAÑAS
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Espacios únicos diseñados para conectar con la naturaleza del litoral sur chileno
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cabaña 1 */}
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-transform duration-300">
              <div className="relative h-64 bg-gradient-to-br from-gray-700 to-gray-900">
                {/* Placeholder imagen */}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3">
                  Equipada para vivir tranquilo
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Cada cabaña cuenta con cocina totalmente equipada, calefacción, 
                  WiFi de alta velocidad y todas las comodidades para una estadía perfecta.
                </p>
              </div>
            </div>

            {/* Cabaña 2 */}
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-transform duration-300">
              <div className="relative h-64 bg-gradient-to-br from-blue-900 to-gray-900">
                {/* Placeholder imagen */}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3">
                  Vistas espectaculares
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Despierta con el sonido del mar y paisajes únicos. 
                  Terrazas privadas con vista panorámica al océano Pacífico.
                </p>
              </div>
            </div>

            {/* Cabaña 3 */}
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-transform duration-300">
              <div className="relative h-64 bg-gradient-to-br from-green-900 to-gray-900">
                {/* Placeholder imagen */}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3">
                  Arquitectura moderna
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Diseño contemporáneo que se integra armoniosamente con el entorno natural. 
                  Espacios amplios y luminosos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section className="py-20 px-6 bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              SERVICIOS QUE AMARÁS
            </h2>
            <p className="text-xl text-gray-400">
              Todo lo que necesitas para una experiencia inolvidable
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">ATENCIÓN AL CLIENTE</h3>
              <p className="text-gray-400">
                Soporte 24/7 para garantizar una estadía perfecta
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">WIFI</h3>
              <p className="text-gray-400">
                Internet de alta velocidad en todas las cabañas
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">SEGURIDAD</h3>
              <p className="text-gray-400">
                Entorno seguro y vigilado las 24 horas
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">LIMPIEZA</h3>
              <p className="text-gray-400">
                Protocolos estrictos de limpieza y sanitización
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modelos Disponibles Section */}
      <section id="modelos" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              MODELOS DISPONIBLES
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Encuentra la cabaña perfecta para tu escapada. Todos los modelos incluyen 
              cocina equipada, WiFi, calefacción y estacionamiento privado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CABINS.map((cabin, index) => (
              <div key={cabin.slug} className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="relative h-80 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
                  {/* Using Unsplash images from cabin data */}
                  <Image
                    src={cabin.heroImage}
                    alt={cabin.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-3xl font-bold mb-4">{cabin.name}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {cabin.headline}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Capacidad: {cabin.capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>{cabin.bedrooms} dormitorios</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-bold">{cabin.basePricePerNight.toLocaleString()}</span>
                      <span className="text-gray-400">CLP / noche</span>
                    </div>
                    <Link
                      href={`/cabanas/${cabin.slug}`}
                      className="block w-full text-center px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
                    >
                      Reservar ahora
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galería Section */}
      <section className="py-20 px-6 bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">GALERÍA</h2>
            <p className="text-xl text-gray-400">
              Explora cada detalle de nuestro paraíso
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button className="px-6 py-3 bg-blue-600 rounded-lg font-semibold">
              INTERIOR
            </button>
            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
              EXTERIOR
            </button>
            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
              AMENIDADES
            </button>
            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
              PAISAJES
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden hover:opacity-75 transition-opacity cursor-pointer bg-gradient-to-br from-gray-700 to-gray-900">
                {/* Placeholder para galería */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ubicación Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">UBICACIÓN</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Dirección</h3>
                  <p className="text-gray-400">
                    Camino Coliumo s/n, Tomé<br />
                    Región del Bío Bío, Chile
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Cómo llegar</h3>
                  <p className="text-gray-400">
                    A 30 minutos de Concepción por Ruta 150<br />
                    Coordenadas: -36.5652, -72.9605
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.123!2d-72.9605!3d-36.5652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDMzJzU0LjciUyA3MsKwNTcnMzcuOCJX!5e0!3m2!1ses!2scl!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" className="py-20 px-6 bg-black">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">CONTACTO</h2>
            <p className="text-xl text-gray-400">
              ¿Listo para vivir esta experiencia? Escríbenos y reserva tu estadía
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Ingresa tu nombre"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Correo electrónico *
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="+56 9 1234 5678"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Mensaje *
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="Cuéntanos sobre tu reserva, fechas de interés, número de personas..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
