'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const DESTINATION_IMAGES = {
  bali: '/images/Bali, Indonesia.jpg',
  santorini: '/images/Santorini, Grecia.jpg',
  tokio: '/images/Tokio, Japón.jpg',
  tokyo: '/images/Tokio, Japón.jpg',
  'torres del paine': '/images/Torres del paine, Chile.jpg',
  'machu picchu': '/images/Machu Picchu, Peru.jpg',
  cartagena: '/images/cartagena.jpg',
  barcelona: '/images/Barcelona, España.jpg',
};

function getDestinationImage(destino) {
  if (!destino) return null;
  const lower = destino.toLowerCase();
  for (const [key, path] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) return path;
  }
  return null;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-700">Generando tu itinerario personalizado...</h2>
        <p className="text-gray-500 mt-2">Esto puede tomar unos segundos ✨</p>
      </div>
    </div>
  );
}

function PagoExitosoContent() {
  const [itinerario, setItinerario] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const stored = localStorage.getItem('vivante_formData');
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    if (!stored) {
      setError('No se encontraron los datos de tu viaje. Por favor escríbenos a vive.vivante.ch@gmail.com');
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(stored);
    setFormData(parsed);

    fetch('/api/send-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: parsed, paymentId, status }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.itinerario) {
          setItinerario(data.itinerario);
          localStorage.removeItem('vivante_formData');
        } else {
          throw new Error(data.error || 'Error generando el itinerario');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Algo salió mal</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Escríbenos a{' '}
            <a href="mailto:vive.vivante.ch@gmail.com" className="text-orange-500 hover:underline">
              vive.vivante.ch@gmail.com
            </a>{' '}
            y te enviamos tu itinerario.
          </p>
        </div>
      </div>
    );
  }

  const destinoImagen = getDestinationImage(formData?.destino);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; background: white; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 py-12 text-white text-center no-print">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">¡Tu itinerario está listo, {formData?.nombre}!</h1>
          <p className="opacity-90">
            Enviamos todos los detalles a <strong>{formData?.email}</strong>
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex gap-3 mb-8 no-print">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              📄 Guardar como PDF
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{itinerario?.titulo}</h2>
            <p className="text-gray-500 mb-5">{itinerario?.resumen}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{formData?.dias}</div>
                <div className="text-xs text-gray-500 mt-0.5">días</div>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-xl">
                <div className="text-2xl font-bold text-pink-500">{formData?.numViajeros}</div>
                <div className="text-xs text-gray-500 mt-0.5">viajeros</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="text-lg font-bold text-purple-500">
                  {formData?.presupuesto >= 15000 ? '$15K+' : `$${formData?.presupuesto?.toLocaleString()}`}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">USD/persona</div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">📅 Tu itinerario día a día</h3>

          {itinerario?.dias?.map((dia, i) => (
            <div key={i} className="bg-white rounded-2xl mb-5 shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gradient-to-r from-orange-400 to-pink-400">
                <img
                  src={destinoImagen || `https://picsum.photos/seed/${encodeURIComponent((formData?.destino || 'travel') + i)}/800/400`}
                  alt={dia.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <span className="text-white/70 text-xs uppercase tracking-widest">Día {i + 1}</span>
                  <h3 className="text-white text-xl font-bold leading-tight">{dia.titulo}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 leading-relaxed mb-4">{dia.descripcion}</p>
                {dia.actividades?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📍 Actividades del día</h4>
                    <div className="space-y-1.5">
                      {dia.actividades.map((act, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5 flex-shrink-0 text-sm">•</span>
                          <span className="text-sm text-gray-600">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {dia.restaurante && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">
                      🍽️ {dia.restaurante}
                    </span>
                  )}
                  {dia.alojamiento && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
                      🏨 {dia.alojamiento}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {itinerario?.tips?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">💡 Tips importantes</h3>
              <div className="space-y-2">
                {itinerario.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-sm text-gray-600">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {itinerario?.presupuesto_desglose && (
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">💰 Estimado de presupuesto</h3>
              <div className="divide-y divide-gray-100">
                {Object.entries(itinerario.presupuesto_desglose).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-2.5">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-semibold text-gray-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center py-6 text-gray-400 text-sm no-print">
            <p>
              ¿Dudas? Escríbenos a{' '}
              <a href="mailto:vive.vivante.ch@gmail.com" className="text-orange-500 hover:underline">
                vive.vivante.ch@gmail.com
              </a>
            </p>
            <p className="mt-1">© VIVANTE — Viaja más. Planifica menos. ✈️</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PagoExitoso() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PagoExitosoContent />
    </Suspense>
  );
}
