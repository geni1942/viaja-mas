'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Plane, Hotel, MapPin, Calendar, Star, Globe, Sparkles, ChevronDown, Heart, CheckCircle, Mountain, Users } from 'lucide-react';
import TravelForm from '../components/TravelForm';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [currentDestino, setCurrentDestino] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [initialDestino, setInitialDestino] = useState('');

  // ── Exit Intent (Option A) ────────────────────────────────────────────────
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitEmail, setExitEmail]           = useState('');
  const [exitSubmitting, setExitSubmitting] = useState(false);
  const [exitDone, setExitDone]             = useState(false);

  useEffect(() => {
    // Mostrar solo una vez por sesión; no mostrar si ya tiene email guardado
    const alreadyShown = sessionStorage.getItem('vivante_exit_shown');
    if (alreadyShown) return;
    const handler = (e) => {
      // Solo disparar cuando el mouse sale por la parte superior de la ventana
      if (e.clientY <= 10 && !showForm) {
        sessionStorage.setItem('vivante_exit_shown', '1');
        setShowExitIntent(true);
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [showForm]);

  const handleExitSubmit = async () => {
    if (!exitEmail.includes('@') || !exitEmail.includes('.')) return;
    setExitSubmitting(true);
    try {
      localStorage.setItem('vivante_lead', JSON.stringify({ email: exitEmail, ts: Date.now(), source: 'exit_intent' }));
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: exitEmail, nombre: '', destino: '' }),
      }).catch(() => {});
      setExitDone(true);
    } catch (_) {}
    setExitSubmitting(false);
  };

  const destinosHero = [
    { nombre: 'Torres del Paine', pais: 'Chile', imagen: '/images/Torres del paine, Chile.jpg' },
    { nombre: 'Santorini', pais: 'Grecia', imagen: '/images/Santorini, Grecia.jpg' },
    { nombre: 'Bali', pais: 'Indonesia', imagen: '/images/Bali, Indonesia.jpg' },
    { nombre: 'Tokio', pais: 'Japón', imagen: '/images/Tokio, Japón.jpg' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDestino((prev) => (prev + 1) % destinosHero.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const destinos = [
    { nombre: 'Torres del Paine', pais: 'Chile', imagen: '/images/Torres del paine, Chile.jpg', tag: '🇨🇱 Local' },
    { nombre: 'Santorini', pais: 'Grecia', imagen: '/images/Santorini, Grecia.jpg', tag: '🔥 Popular' },
    { nombre: 'Bali', pais: 'Indonesia', imagen: '/images/Bali, Indonesia.jpg', tag: '✨ Trending' },
    { nombre: 'Machu Picchu', pais: 'Perú', imagen: '/images/Machu Picchu, Peru.jpg', tag: '🎒 Aventura' },
    { nombre: 'Cartagena', pais: 'Colombia', imagen: '/images/cartagena.jpg', tag: '🏖️ Playa' },
    { nombre: 'Barcelona', pais: 'España', imagen: '/images/Barcelona, España.jpg', tag: '🎨 Cultura' },
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
            style={{ backgroundImage: `url('${encodeURI(destino.imagen)}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Image
              src="/images/vivante_logo.svg"
              alt="VIVANTE"
              width={180}
              height={130}
              priority
              style={{ height: '70px', width: 'auto' }}
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
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Viaja más.<br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Planifica menos.
              </span>
            </h1>
            
            {/* ✅ CAMBIO 1: Nuevo texto del hero */}
            <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
              ¿40 horas planificando? ¡No gastes más tu tiempo! Cuéntanos tus preferencias de viaje y nosotros te diseñamos el itinerario para que tu experiencia sea inolvidable - todo listo para reservar
            </p>
            
            <button
              onClick={() => setShowForm(true)}
              className="group bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 flex items-center gap-3"
            >
              Planificar mi viaje
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Destino indicator */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
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
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center text-white">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">40+</div>
              <div className="text-white/80 text-xs sm:text-sm md:text-base mt-1">horas ahorradas por viaje</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">$10</div>
              <div className="text-white/80 text-xs sm:text-sm md:text-base mt-1">USD tu itinerario completo</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-white/80 text-xs sm:text-sm md:text-base mt-1">personalizado a tu viaje</div>
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

      {/* ── Vista previa del itinerario ───────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Así se ve
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tu itinerario, día a día
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              Cada actividad, restaurante y link listo para reservar con un clic
            </p>
          </div>

          {/* Tabs de días */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <span className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Día 1 ✓
            </span>
            {['Día 2','Día 3','Día 4'].map((d) => (
              <span key={d} className="flex-shrink-0 bg-gray-100 text-gray-400 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                🔒 {d}
              </span>
            ))}
            <span className="flex-shrink-0 bg-gray-100 text-gray-300 px-4 py-2 rounded-full text-sm font-semibold">
              +3 más…
            </span>
          </div>

          {/* Día 1 — visible */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-3">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-5 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-white/25 text-white text-sm font-bold px-3 py-1 rounded-full">Día 1</span>
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Llegada a Tokio · Asakusa</p>
                    <p className="text-white/70 text-xs">Tokio, Japón 🇯🇵</p>
                  </div>
                </div>
                <span className="hidden sm:block text-white/70 text-xs bg-white/10 px-3 py-1 rounded-full">
                  Vista previa gratuita
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {[
                { hora:'09:00', emoji:'🏛️', lugar:'Templo Senso-ji', tag:'Cultura',      link:'Ver en Get Your Guide →', desc:'El templo más visitado de Japón. Llegá temprano para vivirlo antes de las multitudes — el ambiente es otro.' },
                { hora:'12:30', emoji:'🍜', lugar:'Tsukiji Outer Market', tag:'Gastronomía', link:null,                       desc:'Sushi fresco, tamagoyaki y ramen auténtico desde $10 USD. Pedile recomendación al vendedor de turno.' },
                { hora:'15:00', emoji:'🌆', lugar:'Shibuya Crossing + Harajuku', tag:'Imperdible',  link:'Tour guiado →',              desc:'El cruce más transitado del mundo. Subí al Starbucks frente al semáforo para la foto perfecta. Gratis.' },
                { hora:'19:30', emoji:'🍶', lugar:'Cena en Omoide Yokocho', tag:'Local',        link:null,                       desc:'"Memory Lane": callejón de 1948 con tabernas de yakitori y sake. Una de las experiencias más auténticas de Tokio.' },
              ].map((item, i) => (
                <div key={i} className="px-5 sm:px-6 py-3 sm:py-4 flex gap-3 sm:gap-4 hover:bg-orange-50/30 transition-colors">
                  <div className="text-xs text-gray-400 font-mono w-10 flex-shrink-0 pt-1">{item.hora}</div>
                  <div className="text-lg sm:text-xl flex-shrink-0 mt-0.5">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">{item.lugar}</p>
                      <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100">{item.tag}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    {item.link && (
                      <p className="text-xs text-orange-500 font-medium mt-1 hover:underline cursor-pointer">{item.link}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-xs text-gray-500">💰 ~$45 USD/persona</span>
              <span className="hidden sm:block text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-500">🚇 Suica card recomendada</span>
              <span className="hidden sm:block text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-500">🏨 Hotel en Shinjuku (incluido)</span>
            </div>
          </div>

          {/* Día 2 — bloqueado */}
          <div className="relative mb-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden blur-[3px] select-none pointer-events-none">
              <div className="bg-gray-100 px-5 sm:px-6 py-4 flex items-center gap-3">
                <span className="bg-gray-200 text-gray-400 text-sm font-bold px-3 py-1 rounded-full">Día 2</span>
                <p className="text-gray-400 font-semibold text-sm">Kioto — Templos y tradición</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[1,2,3].map((_,i) => (
                  <div key={i} className="px-5 sm:px-6 py-4 flex gap-4">
                    <div className="w-10 h-3 bg-gray-100 rounded mt-1 flex-shrink-0"></div>
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-36"></div>
                      <div className="h-3 bg-gray-50 rounded w-full"></div>
                      <div className="h-3 bg-gray-50 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/98 border border-orange-100 rounded-2xl px-6 sm:px-10 py-4 sm:py-5 text-center shadow-xl">
                <span className="text-2xl sm:text-3xl mb-2 block">🔒</span>
                <p className="text-gray-800 font-bold text-sm sm:text-base">Días 2 al 7 en tu itinerario</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Kioto · Osaka · Hiroshima y más</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => setShowForm(true)}
              className="group bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 sm:px-10 py-4 rounded-2xl text-base sm:text-lg font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25 inline-flex items-center gap-3"
            >
              Crear mi itinerario completo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-3">Desde $10 USD · Tu plan listo en minutos</p>
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
                onClick={() => { setInitialDestino(`${destino.nombre}, ${destino.pais}`); setShowForm(true); }}
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
                  <div className="flex items-center justify-end">
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
              { icon: MapPin, title: 'Lugares secretos', desc: 'Tips de locales para una experiencia inolvidable', color: 'from-green-500 to-emerald-500' },
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

      {/* Planes y Precios */}
      <section id="precios" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Planes y Precios
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Elige tu experiencia
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Un solo pago. Todo el itinerario listo para reservar. Sin suscripciones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Vivante Básico */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all relative flex flex-col">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Vivante Básico</h3>
                <p className="text-gray-500 text-sm mb-6">Itinerario personalizado día a día</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">$10</span>
                  <span className="text-gray-500 ml-2">USD</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Itinerario completo en PDF',
                    'Links de vuelos y alojamientos',
                    'Puntos de interés',
                    'Tips culturales, de conectividad y dinero',
                    'Tips locales básicos para viajeros',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 rounded-2xl border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all mt-auto"
              >
                Comenzar con Básico
              </button>
            </div>

            {/* Vivante Pro */}
            <div className="bg-gray-900 rounded-3xl p-8 border-2 border-gray-900 transition-all relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-5 py-2 rounded-full whitespace-nowrap">
                ⭐ RECOMENDADO
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Vivante Pro</h3>
                <p className="text-gray-400 text-sm mb-6">Experiencia premium con todos los detalles</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$17</span>
                  <span className="text-gray-400 ml-2">USD</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Todo lo del Vivante Básico',
                    'Restaurantes recomendados por zona y RRSS',
                    'Opciones de tours y actividades',
                    'Tips de seguridad y transporte',
                    'Presupuesto detallado por día',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all mt-auto"
              >
                Comenzar con Pro →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios — debajo de Pricing (mejor conversión: social proof cierra la decisión) */}
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
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">&ldquo;{t.texto}&rdquo;</p>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{t.nombre}</div>
                  <div className="text-gray-500 text-sm">{t.ciudad}</div>
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

      {/* ✅ CAMBIO 3, 4: Footer con íconos de redes sociales y cajita de contacto */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <Image
                src="/images/vivante_logo.svg"
                alt="VIVANTE"
                width={150}
                height={108}
                style={{ height: '56px', width: 'auto' }}
              />
            </div>

            {/* Links + Contacto con cajita */}
            <div className="flex gap-8 text-sm items-center">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <div className="relative">
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="hover:text-white transition-colors"
                >
                  Contacto
                </button>
                {showContact && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white text-gray-800 rounded-xl p-4 shadow-xl min-w-[300px] text-sm z-50">
                    <button
                      onClick={() => setShowContact(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                    <p className="font-semibold mb-1">¿Dudas o consultas?</p>
                    <p className="text-gray-600">
                      Escríbenos a{' '}
                      <a
                        href="mailto:vive.vivante.ch@gmail.com"
                        className="text-orange-500 hover:underline font-medium"
                      >
                        vive.vivante.ch@gmail.com
                      </a>
                    </p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white shadow-sm"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ CAMBIO 3: Íconos de Instagram y TikTok */}
          <div className="flex justify-center gap-5 mt-8">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/vive.vivante"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="http://www.tiktok.com/@vivevivante"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="TikTok"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/>
              </svg>
            </a>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © {new Date().getFullYear()} VIVANTE. Hecho con ❤️ para viajeros como tú.
          </div>
        </div>
      </footer>

      {/* Modal del formulario */}
      {showForm && <TravelForm onClose={() => { setShowForm(false); setInitialDestino(''); }} initialDestino={initialDestino} />}

      {/* ── Exit Intent Popup (Option A) ─────────────────────────────────── */}
      {showExitIntent && !showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10 text-gray-500 font-bold"
            >
              ✕
            </button>

            {/* Header naranja */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-8 pt-8 pb-6 text-center">
              <div className="text-4xl mb-3">✈️</div>
              <h2 className="text-white text-2xl font-bold leading-tight">
                ¡Un segundo antes de irte!
              </h2>
              <p className="text-white/90 text-sm mt-2">
                Recibe tips de viaje exclusivos y sé el primero en enterarte de nuestras ofertas.
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              {!exitDone ? (
                <>
                  <div className="flex gap-3 mb-4 text-sm text-gray-600">
                    <span>✅ Tips de planificación</span>
                    <span>✅ Ofertas exclusivas</span>
                  </div>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={exitEmail}
                    onChange={(e) => setExitEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExitSubmit()}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-base mb-3"
                    autoFocus
                  />
                  <button
                    onClick={handleExitSubmit}
                    disabled={exitSubmitting || !exitEmail.includes('@')}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                      exitEmail.includes('@') && !exitSubmitting
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {exitSubmitting ? 'Guardando...' : '¡Quiero mis tips gratis! 🎒'}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Sin spam. Solo lo bueno. Podés darte de baja cuando quieras.
                  </p>
                  <button
                    onClick={() => setShowExitIntent(false)}
                    className="w-full text-center text-xs text-gray-400 mt-2 hover:text-gray-600 py-1"
                  >
                    No gracias, prefiero planificar solo.
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">¡Listo! Ya estás dentro.</h3>
                  <p className="text-gray-500 text-sm mb-5">
                    Pronto recibirás nuestros mejores tips de viaje. ✈️
                  </p>
                  <button
                    onClick={() => { setShowExitIntent(false); setShowForm(true); }}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                  >
                    Planificar mi viaje ahora →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
