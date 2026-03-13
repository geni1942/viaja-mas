'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Plane, Hotel, MapPin, Calendar, Star, Globe, Sparkles, ChevronDown, Heart, CheckCircle, Mountain, Users } from 'lucide-react';
import TravelForm from '../components/TravelForm';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [currentDestino, setCurrentDestino] = useState(0);

  const destinosHero = [
    { nombre: 'Torres del Paine', pais: 'Chile', imagen: 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=1920&q=80' },
    { nombre: 'Santorini', pais: 'Grecia', imagen: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1920&q=80' },
    { nombre: 'Bali', pais: 'Indonesia', imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80' },
    { nombre: 'Tokio', pais: 'Japón', imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDestino((prev) => (prev + 1) % destinosHero.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const destinos = [
    { nombre: 'Torres del Paine', pais: 'Chile', imagen: 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=600&q=80', precio: 'Desde $400.000 CLP', tag: '🇨🇱 Local' },
    { nombre: 'Santorini', pais: 'Grecia', imagen: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80', precio: 'Desde $1.200 USD', tag: '🔥 Popular' },
    { nombre: 'Bali', pais: 'Indonesia', imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', precio: 'Desde $1.500 USD', tag: '✨ Trending' },
    { nombre: 'Machu Picchu', pais: 'Perú', imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80', precio: 'Desde $600 USD', tag: '🎒 Aventura' },
    { nombre: 'Cartagena', pais: 'Colombia', imagen: 'public/images/cartagena.jpg.jpg', precio: 'Desde $500 USD', tag: '🏖️ Playa' },
    { nombre: 'Barcelona', pais: 'España', imagen: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', precio: 'Desde $1.100 USD', tag: '🎨 Cultura' },
  ];

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {destinosHero.map((destino, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              currentDestino === index ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${destino.imagen})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
          {/* ✅ CAMBIO 1: reemplaza el ícono del avión cuadrado por el logo VIVANTE */}
          <div className="flex items-center">
            <Image
              src="/images/vivante_logo.svg"
              alt="VIVANTE"
              width={130}
              height={95}
              priority
              style={{ height: '46px', width: 'auto' }}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 sm:px-6 py-2.5 rounded-full font-medium hover:bg-white hover:text-gray-900 transition-all text-sm sm:text-base"
          >
            Planificar mi viaje
          </button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center h-[calc(100vh-100px)]">
          <div className="max-w-3xl">
            {/* ✅ CAMBIO 2: "Vivante." → "Viaja más." */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Viaja más.<br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Planifica menos.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
              Cuéntanos tu presupuesto, tus días y lo que te apasiona. Creamos tu viaje perfecto: vuelos, hotel, actividades y más — todo listo para reservar.
            </p>
            
            <button
              onClick={() => setShowForm(true)}
              className="group bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 flex items-center gap-3"
            >
              Planificar mi viaje
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Destino indicator */}
            <div className="mt-12 flex items-center gap-4">
              <span className="text-white/50 text-sm">Ahora viendo:</span>
              <span className="text-white font-medium">{destinosHero[currentDestino].nombre}, {destinosHero[currentDestino].pais}</span>
              <div className="flex gap-1.5">
                {destinosHero.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentDestino(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentDestino === i ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce z-10">
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-3xl sm:text-4xl font-bold">156+</div>
              <div className="text-white/80 text-sm sm:text-base">Destinos disponibles</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">50+</div>
              <div className="text-white/80 text-sm sm:text-base">Países cubiertos</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-bold">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="text-white/80 text-sm sm:text-base">Itinerarios personalizados</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Súper fácil
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              De cero a itinerario completo en menos de lo que tardas en hacer café
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-200 via-pink-200 to-purple-200"></div>
            
            {[
              { num: '1', icon: '💬', title: 'Cuéntanos tu viaje ideal', desc: 'Presupuesto, días, intereses. Solo lo esencial.' },
              { num: '2', icon: '🤖', title: 'Creamos tu itinerario', desc: 'Analizamos las mejores opciones para ti.' },
              { num: '3', icon: '✈️', title: 'Recibe y reserva', desc: 'Itinerario completo listo para reservar.' },
            ].map((paso, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow text-center group">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">{paso.icon}</span>
                  </div>
                  <div className="text-xs text-orange-500 font-medium mb-2">PASO {paso.num}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{paso.title}</h3>
                  <p className="text-gray-500">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all inline-flex items-center gap-3"
            >
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Destinos Populares */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12">
            <div>
              <span className="inline-block bg-pink-100 text-pink-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                Inspiración
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Destinos que enamoran
              </h2>
              <p className="text-gray-500 text-lg">Los favoritos de nuestra comunidad</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="hidden sm:flex items-center gap-2 text-orange-500 font-medium hover:gap-4 transition-all mt-4 sm:mt-0"
            >
              Ver todos
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinos.map((destino, i) => (
              <div
                key={i}
                className="group relative rounded-3xl overflow-hidden cursor-pointer aspect-[4/5] sm:aspect-[3/4]"
                onClick={() => setShowForm(true)}
              >
                <img
                  src={destino.imagen}
                  alt={destino.nombre}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {destino.tag}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white/70 text-sm">{destino.pais}</p>
                  <h3 className="text-white text-2xl font-bold mb-2">{destino.nombre}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-orange-400 font-semibold">{destino.precio}</p>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sm:hidden text-center mt-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-orange-500 font-medium"
            >
              Ver todos los destinos
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Qué incluye */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Todo incluido
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              ¿Qué recibes en tu itinerario?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Todo lo que necesitas para que solo te preocupes de disfrutar
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Plane, title: 'Vuelos recomendados', desc: 'Las mejores opciones según tu origen y presupuesto', color: 'from-blue-500 to-cyan-500' },
              { icon: Hotel, title: 'Alojamiento ideal', desc: 'Hoteles, Airbnb o hostales según tu estilo', color: 'from-purple-500 to-pink-500' },
              { icon: Calendar, title: 'Itinerario día a día', desc: 'Cada día planificado con horarios y actividades', color: 'from-orange-500 to-red-500' },
              { icon: MapPin, title: 'Lugares secretos', desc: 'Tips de locales que no están en las guías', color: 'from-green-500 to-emerald-500' },
              { icon: Sparkles, title: 'Restaurantes top', desc: 'Dónde comer según tus gustos y presupuesto', color: 'from-yellow-500 to-orange-500' },
              { icon: CheckCircle, title: 'Links directos', desc: 'Todo listo para reservar con un clic', color: 'from-pink-500 to-rose-500' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-green-100 text-green-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Testimonios
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros viajeros
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                nombre: 'María García',
                ciudad: 'Santiago, Chile',
                imagen: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
                texto: 'Increíble. Me ahorré HORAS de planificación. Mi viaje a Tailandia fue perfecto gracias a las recomendaciones.',
                destino: 'Tailandia 🇹🇭',
              },
              {
                nombre: 'Carlos Mendoza',
                ciudad: 'Buenos Aires, Argentina',
                imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
                texto: 'El itinerario estaba tan bien organizado que no perdimos ni un minuto. Ya reservé mi próximo viaje con ellos.',
                destino: 'Japón 🇯🇵',
              },
              {
                nombre: 'Ana Rodríguez',
                ciudad: 'Lima, Perú',
                imagen: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
                texto: 'Viajamos en familia y el itinerario consideró actividades para todos. Los links directos nos ahorraron mucho.',
                destino: 'España 🇪🇸',
              },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl p-8 relative">
                <div className="absolute -top-4 right-8 bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium">
                  {t.destino}
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">"{t.texto}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.imagen} alt={t.nombre} className="w-14 h-14 rounded-full object-cover ring-4 ring-white" />
                  <div>
                    <div className="font-bold text-gray-900">{t.nombre}</div>
                    <div className="text-gray-500 text-sm">{t.ciudad}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-pink-600/90"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Cuéntanos cómo quieres viajar y nosotros nos encargamos del resto.
          </p>

          <button
            onClick={() => setShowForm(true)}
            className="group bg-white text-gray-900 px-10 py-5 rounded-2xl text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-3"
          >
            Planificar mi viaje
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* ✅ CAMBIO 4: reemplaza el ícono del avión en el footer por el logo VIVANTE */}
            <div className="flex items-center">
              <Image
                src="/images/vivante_logo.svg"
                alt="VIVANTE"
                width={110}
                height={80}
                style={{ height: '40px', width: 'auto' }}
              />
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            © {new Date().getFullYear()} VIVANTE. Hecho con ❤️ para viajeros como tú.
          </div>
        </div>
      </footer>

      {/* Modal del formulario */}
      {showForm && <TravelForm onClose={() => setShowForm(false)} />}
    </main>
  );
}
