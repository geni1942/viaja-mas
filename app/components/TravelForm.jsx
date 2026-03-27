'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plane, MapPin, Users, Sparkles, Loader2, RefreshCw, Check, CreditCard } from 'lucide-react';

export default function TravelForm({ onClose, initialDestino = '' }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [showOptions, setShowOptions] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [destinoOptions, setDestinoOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const [destinoHistory, setDestinoHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    tieneDestino: initialDestino ? true : null,
    destino: initialDestino,
    origen: '',
    presupuesto: 2000,
    dias: 7,
    mesViaje: '',
    prioridadGasto: 'equilibrado',
    tipoViaje: '',
    numViajeros: 2,
    numNinos: 0,
    ocasionEspecial: '',
    movilidadReducida: false,
    intereses: [],
    restriccionDietaria: 'sin-restriccion',
    ritmo: 3,
    horarioPreferido: 'normal',
    alojamiento: '',
    aerolineaPreferida: '',
    experienciaViajero: '',
    primeraVisita: null,
    nombre: '',
    email: '',
  });

  const planes = [
    {
      id: 'basico',
      nombre: 'Vivante Básico',
      precio: 10,
      precioClp: 9990,
      descripcion: 'Itinerario personalizado día a día',
      incluye: [
        'Itinerario completo en PDF',
        'Links de vuelos y alojamientos',
        'Puntos de interés',
        'Tips culturales, de conectividad y dinero',
        'Tips locales básicos para viajeros',
      ],
    },
    {
      id: 'pro',
      nombre: 'Vivante Pro',
      precio: 17,
      precioClp: 16990,
      descripcion: 'Experiencia premium con todos los detalles',
      incluye: [
        'Todo lo del Vivante Básico',
        'Restaurantes recomendados por zona y RRSS',
        'Opciones de tours y actividades',
        'Tips de seguridad y transporte',
        'Tips culturales, de conectividad y dinero',
        'Presupuesto detallado por día',
      ],
      popular: true,
    },
  ];

  const interesesOptions = [
    { id: 'playa', label: 'Playa', emoji: '🏖️' },
    { id: 'cultura', label: 'Cultura', emoji: '🏛️' },
    { id: 'aventura', label: 'Aventura', emoji: '🏔️' },
    { id: 'gastronomia', label: 'Gastronomía', emoji: '🍽️' },
    { id: 'relax', label: 'Relax', emoji: '🧘' },
    { id: 'naturaleza', label: 'Naturaleza', emoji: '🌲' },
    { id: 'nocturna', label: 'Vida Nocturna', emoji: '🎉' },
    { id: 'deporte', label: 'Deporte', emoji: '⚽' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  ];

  const alojamientoOptions = [
    { id: 'hotel', label: 'Hotel', emoji: '🏨' },
    { id: 'airbnb', label: 'Airbnb', emoji: '🏠' },
    { id: 'hostal', label: 'Hostal', emoji: '🛏️' },
    { id: 'bnb', label: 'Bed & Breakfast', emoji: '🏡' },
  ];

  // Intereses: el ORDEN de selección = prioridad (primero = más importante)
  const toggleInteres = (id) => {
    if (formData.intereses.includes(id)) {
      setFormData({ ...formData, intereses: formData.intereses.filter(i => i !== id) });
    } else if (formData.intereses.length < 4) {
      setFormData({ ...formData, intereses: [...formData.intereses, id] });
    }
  };

  const getRitmoLabel = () => {
    if (formData.ritmo <= 2) return { text: 'Relajado', desc: 'Máximo 2 actividades por día' };
    if (formData.ritmo <= 3) return { text: 'Moderado', desc: '2-3 actividades con pausas' };
    return { text: 'Intenso', desc: '3-4 actividades, aprovechando cada momento' };
  };

  // Genera los próximos 18 meses como opciones
  const getMesOptions = () => {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const now = new Date();
    const result = [];
    for (let i = 1; i <= 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ label: `${meses[d.getMonth()]} ${d.getFullYear()}`, value: val });
    }
    return result;
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.tieneDestino !== null && (formData.tieneDestino === false || formData.destino.trim());
      case 2: return formData.origen.trim() && formData.presupuesto >= 500 && formData.dias >= 3;
      case 3: return formData.tipoViaje !== '';
      case 4: return formData.intereses.length > 0 && formData.alojamiento !== '';
      case 5: return formData.nombre.trim() && formData.email.includes('@');
      default: return true;
    }
  };

  const fetchDestinationOptions = async () => {
    setIsLoadingOptions(true);
    setError(null);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al obtener sugerencias');
      setDestinoOptions(data.opciones);
      setShowOptions(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const requestNewOptions = async () => {
    if (attemptsLeft <= 0) return;
    if (destinoOptions.length > 0) {
      setDestinoHistory(prev => [...prev, destinoOptions]);
    }
    setAttemptsLeft(attemptsLeft - 1);
    setSelectedOption(null);
    await fetchDestinationOptions();
  };

  const goBackToPreviousOptions = () => {
    if (destinoHistory.length === 0) return;
    const prev = destinoHistory[destinoHistory.length - 1];
    setDestinoHistory(h => h.slice(0, -1));
    setDestinoOptions(prev);
    setSelectedOption(null);
  };

  const handleStep5Submit = async () => {
    if (formData.tieneDestino) {
      setShowPayment(true);
    } else {
      await fetchDestinationOptions();
    }
  };

  const confirmSelection = () => {
    if (!selectedOption) return;
    const destinoTexto = `${selectedOption.destino} (${selectedOption.paises}) - ${selectedOption.dias_distribucion}`;
    setFormData({ ...formData, destino: destinoTexto });
    setShowOptions(false);
    setShowPayment(true);
  };

  // ─── PANTALLA DE ÉXITO ──────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Excelente, {formData.nombre}!</h2>
          <p className="text-gray-600 mb-4">
            Tu pago fue recibido. Recibirás tu itinerario personalizado en <strong>{formData.email}</strong> en breve.
          </p>
          <p className="text-orange-500 font-medium mb-8 italic">Tu aventura está a punto de comenzar. ✈️</p>
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium">¡Entendido!</button>
        </div>
      </div>
    );
  }

  // ─── PANTALLA DE PAGO ───────────────────────────────────────────────────────
  if (showPayment) {
    const planSeleccionado = planes.find(p => p.id === selectedPlan);
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirma tu itinerario</h2>
              <p className="text-gray-500">Un paso más para tu viaje perfecto</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Resumen de tu viaje</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Destino:</span> {formData.destino || 'Por definir'}</p>
                <p><span className="font-medium">Días:</span> {formData.dias}</p>
                <p><span className="font-medium">Viajeros:</span> {formData.numViajeros}</p>
                <p><span className="font-medium">Presupuesto:</span> {formData.presupuesto >= 15000 ? '$15.000+ USD' : `$${formData.presupuesto.toLocaleString()} USD`}</p>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">✨ Elige tu plan</h3>
              <div className="space-y-3">
                {planes.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${selectedPlan === plan.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {selectedPlan === plan.id && <Check className="w-5 h-5 text-orange-500" />}
                        <span className="font-semibold text-gray-800">{plan.nombre}</span>
                      </div>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">${plan.precio} USD</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{plan.descripcion}</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {plan.incluye.map((item, i) => (
                        <li key={i} className="flex items-start gap-1"><span className="text-green-500">✓</span> {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            {selectedPlan && (
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">${planSeleccionado?.precio} USD</p>
              </div>
            )}
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">{error}</div>}
            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (!selectedPlan) return;
                  const snapFormData = { ...formData };
                  try {
                    localStorage.setItem('vivante_formData', JSON.stringify(snapFormData));
                    localStorage.setItem('vivante_planId', selectedPlan);
                    localStorage.setItem('vivante_formData_ts', Date.now().toString());
                  } catch {}
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const res = await fetch('/api/payment/create-preference', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        planId: selectedPlan,
                        planNombre: planSeleccionado?.nombre,
                        precio: planSeleccionado?.precioClp,
                        precioUsd: planSeleccionado?.precio,
                        email: snapFormData.email,
                        nombre: snapFormData.nombre,
                        destino: snapFormData.destino,
                      }),
                    });
                    const data = await res.json();
                    if (data.init_point) {
                      if (data.preference_id) {
                        try { localStorage.setItem(`vivante_pref_${data.preference_id}`, JSON.stringify(snapFormData)); } catch {}
                      }
                      window.location.href = data.init_point;
                    } else {
                      throw new Error(data.error || 'No se pudo iniciar el pago');
                    }
                  } catch (e) {
                    setError('Error al procesar el pago. Por favor intenta nuevamente.');
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || !selectedPlan}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!isSubmitting && selectedPlan ? 'text-white shadow-lg hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                style={!isSubmitting && selectedPlan ? { backgroundColor: '#009EE3' } : {}}
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo a Mercado Pago...</> : <>💳 Pagar con Mercado Pago</>}
              </button>
              <button
                onClick={() => { setShowPayment(false); setSelectedPlan(null); if (!formData.tieneDestino) setShowOptions(true); }}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PANTALLA DE OPCIONES DE DESTINO ────────────────────────────────────────
  if (showOptions) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Te recomendamos estos destinos</h2>
              <p className="text-gray-500">Basado en tus preferencias, presupuesto y días de viaje</p>
            </div>
            {isLoadingOptions && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Buscando los destinos perfectos para ti...</p>
              </div>
            )}
            {!isLoadingOptions && destinoOptions.length > 0 && (
              <div className="space-y-4">
                {destinoOptions.map((opcion) => (
                  <div
                    key={opcion.id}
                    onClick={() => setSelectedOption(opcion)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedOption?.id === opcion.id ? 'border-orange-500 bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold text-gray-800">{opcion.destino}</span>
                          {selectedOption?.id === opcion.id && <Check className="w-5 h-5 text-orange-500" />}
                        </div>
                        <p className="text-sm text-gray-500">{opcion.paises}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">${opcion.precio_estimado.toLocaleString()}</div>
                        <p className="text-xs text-gray-400">USD por persona</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-sm text-gray-600"><span className="font-medium">📅</span> {opcion.dias_distribucion}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3"><span className="font-medium">💡</span> {opcion.porque}</p>
                    <div className="flex flex-wrap gap-2">
                      {opcion.highlights.map((h, i) => (
                        <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600">{h}</span>
                      ))}
                    </div>
                    <div className="mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${opcion.tipo === 'multidestino' ? 'bg-purple-100 text-purple-600' : opcion.tipo === 'monopais' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {opcion.tipo === 'multidestino' ? '🌍 Multidestino' : opcion.tipo === 'monopais' ? '🗺️ Monopaís' : '📍 Destino único'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mt-4">{error}</div>}
            <div className="mt-8 space-y-3">
              <button
                onClick={confirmSelection}
                disabled={!selectedOption}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${selectedOption ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <Check className="w-5 h-5" /> Elegir este destino
              </button>
              {attemptsLeft > 0 && !isLoadingOptions && (
                <button onClick={requestNewOptions} className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  Ver otras opciones ({attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'})
                </button>
              )}
              {destinoHistory.length > 0 && !isLoadingOptions && (
                <button onClick={goBackToPreviousOptions} className="w-full py-3 rounded-xl border-2 border-orange-200 text-orange-600 font-medium flex items-center justify-center gap-2 hover:bg-orange-50">
                  ← Ver opciones anteriores
                </button>
              )}
              {attemptsLeft === 0 && destinoHistory.length === 0 && (
                <p className="text-center text-sm text-gray-400">Ya no puedes pedir más opciones. Elige una de las anteriores.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORMULARIO PRINCIPAL (5 PASOS) ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
        <div className="p-6 sm:p-8">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${step >= s ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* ══ PASO 1: Destino ══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">¿A dónde vamos?</h2>
                <p className="text-gray-500">Empecemos por lo más importante</p>
              </div>
              <div className="space-y-4">
                {/* Tipo de destino */}
                <button
                  onClick={() => setFormData({ ...formData, tieneDestino: false, destino: '', primeraVisita: null })}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${formData.tieneDestino === false ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">✨</span>
                    <div>
                      <div className="font-semibold text-gray-800">Sorpréndeme con opciones</div>
                      <div className="text-sm text-gray-500">Te recomendaremos 3 destinos perfectos</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, tieneDestino: true })}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${formData.tieneDestino === true ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🗺️</span>
                    <div>
                      <div className="font-semibold text-gray-800">Ya sé a dónde quiero ir</div>
                      <div className="text-sm text-gray-500">Crearemos tu itinerario a medida</div>
                    </div>
                  </div>
                </button>

                {/* Destino libre (solo si tiene destino) */}
                {formData.tieneDestino === true && (
                  <div className="fade-in pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuál es tu destino?</label>
                    <input
                      type="text"
                      placeholder="Ej: Lisboa, Portugal"
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value, primeraVisita: null })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Primera visita (solo si tiene destino escrito) */}
                {formData.tieneDestino === true && formData.destino.trim().length > 2 && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Ya visitaste {formData.destino.split(',')[0].trim()} antes?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: false, label: 'Sí, ya fui', emoji: '✅' },
                        { id: true, label: 'Primera vez', emoji: '🌟' },
                      ].map((op) => (
                        <button
                          key={String(op.id)}
                          onClick={() => setFormData({ ...formData, primeraVisita: op.id })}
                          className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${formData.primeraVisita === op.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <span>{op.emoji}</span>
                          <span className="text-sm font-medium text-gray-700">{op.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experiencia de viajero */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Con qué frecuencia viajás al exterior? <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'primera-vez', label: 'Primera vez', emoji: '🌟' },
                      { id: 'algunas-veces', label: 'Algunas veces', emoji: '✈️' },
                      { id: 'frecuente', label: 'Viajero frecuente', emoji: '🌍' },
                    ].map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => setFormData({ ...formData, experienciaViajero: formData.experienciaViajero === exp.id ? '' : exp.id })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.experienciaViajero === exp.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="text-xl">{exp.emoji}</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{exp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 2: Básicos ══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Los básicos</h2>
                <p className="text-gray-500">Para encontrar las mejores opciones</p>
              </div>
              <div className="space-y-6">
                {/* Origen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Desde qué ciudad viajas?</label>
                  <input
                    type="text"
                    placeholder="Ej: Santiago, Chile"
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Presupuesto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto por persona (USD)</label>
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-3">
                      {formData.presupuesto >= 15000 ? '$15.000+ USD' : `$${formData.presupuesto.toLocaleString()}`}
                    </div>
                    <input
                      type="range" min="500" max="15000" step="500"
                      value={formData.presupuesto}
                      onChange={(e) => setFormData({ ...formData, presupuesto: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1"><span>$500</span><span>$15.000+</span></div>
                  </div>
                </div>

                {/* Prioridad de gasto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿En qué preferís gastar más? <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'equilibrado', label: 'Equilibrado', emoji: '⚖️' },
                      { id: 'vuelo-directo', label: 'Vuelo directo', emoji: '✈️' },
                      { id: 'mejor-hotel', label: 'Mejor hotel', emoji: '🏨' },
                      { id: 'actividades', label: 'Actividades', emoji: '🎯' },
                      { id: 'gastronomia', label: 'Gastronomía', emoji: '🍷' },
                    ].map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setFormData({ ...formData, prioridadGasto: op.id })}
                        className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.prioridadGasto === op.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="text-lg">{op.emoji}</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{op.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Días */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuántos días de viaje?</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => formData.dias > 3 && setFormData({ ...formData, dias: formData.dias - 1 })}
                      className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                    >−</button>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 w-16 text-center">{formData.dias}</div>
                    <button
                      onClick={() => formData.dias < 30 && setFormData({ ...formData, dias: formData.dias + 1 })}
                      className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                    >+</button>
                  </div>
                </div>

                {/* Mes de viaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuándo querés viajar? <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={formData.mesViaje}
                    onChange={(e) => setFormData({ ...formData, mesViaje: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-gray-700 bg-white"
                  >
                    <option value="">Todavía no lo sé</option>
                    {getMesOptions().map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 3: Viajeros ══════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Quiénes viajan?</h2>
                <p className="text-gray-500">Para personalizar la experiencia</p>
              </div>
              <div className="space-y-6">
                {/* Tipo de viaje */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'solo', label: 'Solo/a', emoji: '🧍' },
                    { id: 'pareja', label: 'Pareja', emoji: '💑' },
                    { id: 'familia', label: 'Familia', emoji: '👨‍👩‍👧‍👦' },
                    { id: 'amigos', label: 'Amigos/as', emoji: '👯' },
                  ].map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => setFormData({
                        ...formData,
                        tipoViaje: tipo.id,
                        numViajeros: tipo.id === 'solo' ? 1 : tipo.id === 'pareja' ? 2 : formData.numViajeros,
                        ocasionEspecial: '',
                      })}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.tipoViaje === tipo.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-3xl">{tipo.emoji}</span>
                      <span className="font-medium text-gray-800">{tipo.label}</span>
                    </button>
                  ))}
                </div>

                {/* Número de viajeros */}
                {formData.tipoViaje && !['solo', 'pareja'].includes(formData.tipoViaje) && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuántos viajeros en total?</label>
                    <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-xl">
                      <button onClick={() => formData.numViajeros > 2 && setFormData({ ...formData, numViajeros: formData.numViajeros - 1 })} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold">−</button>
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{formData.numViajeros}</span>
                      <button onClick={() => setFormData({ ...formData, numViajeros: formData.numViajeros + 1 })} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                )}

                {/* Niños (solo familia) */}
                {formData.tipoViaje === 'familia' && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuántos niños viajan? <span className="text-gray-400 font-normal">(aproximado)</span>
                    </label>
                    <div className="flex items-center justify-center gap-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, numNinos: Math.max(0, (prev.numNinos || 0) - 1) }))} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold text-orange-500 hover:bg-orange-50">−</button>
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{formData.numNinos || 0}</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, numNinos: Math.min(8, (prev.numNinos || 0) + 1) }))} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold text-orange-500 hover:bg-orange-50">+</button>
                    </div>
                  </div>
                )}

                {/* Movilidad reducida (solo familia) */}
                {formData.tipoViaje === 'familia' && (
                  <div className="fade-in flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer"
                    onClick={() => setFormData({ ...formData, movilidadReducida: !formData.movilidadReducida })}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${formData.movilidadReducida ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                      {formData.movilidadReducida && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <label className="text-sm text-gray-700 cursor-pointer">
                      ♿ Alguien en el grupo tiene movilidad reducida
                    </label>
                  </div>
                )}

                {/* Ocasión especial (pareja o amigos) */}
                {(formData.tipoViaje === 'pareja' || formData.tipoViaje === 'amigos') && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.tipoViaje === 'pareja' ? '¿Es una ocasión especial?' : '¿Es para celebrar algo?'}
                      <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(formData.tipoViaje === 'pareja'
                        ? [
                          { id: 'luna-de-miel', label: 'Luna de miel', emoji: '💍' },
                          { id: 'aniversario', label: 'Aniversario', emoji: '💕' },
                          { id: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂' },
                          { id: 'sin-ocasion', label: 'Sin ocasión especial', emoji: '✈️' },
                        ]
                        : [
                          { id: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂' },
                          { id: 'despedida', label: 'Despedida de soltero/a', emoji: '🎉' },
                          { id: 'graduacion', label: 'Graduación', emoji: '🎓' },
                          { id: 'sin-ocasion', label: 'Viaje entre amigos', emoji: '👯' },
                        ]
                      ).map((oc) => (
                        <button
                          key={oc.id}
                          onClick={() => setFormData({ ...formData, ocasionEspecial: formData.ocasionEspecial === oc.id ? '' : oc.id })}
                          className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${formData.ocasionEspecial === oc.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <span className="text-xl">{oc.emoji}</span>
                          <span className="text-sm font-medium text-gray-700 leading-tight">{oc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PASO 4: Estilo de viaje ══════════════════════════════════════════ */}
          {step === 4 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu estilo de viaje</h2>
                <p className="text-gray-500">¿Qué te hace feliz viajando?</p>
              </div>
              <div className="space-y-6">
                {/* Intereses con prioridad */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">¿Qué te interesa? <span className="text-gray-400 font-normal">en orden de prioridad</span></label>
                    <span className="text-xs text-gray-400">{formData.intereses.length}/4</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">El primero que elijas será el más importante para tu itinerario</p>
                  <div className="grid grid-cols-3 gap-2">
                    {interesesOptions.map((interes) => {
                      const idx = formData.intereses.indexOf(interes.id);
                      const selected = idx !== -1;
                      return (
                        <button
                          key={interes.id}
                          onClick={() => toggleInteres(interes.id)}
                          className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          {selected && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                              {idx + 1}
                            </span>
                          )}
                          <span className="text-xl">{interes.emoji}</span>
                          <span className="text-xs font-medium text-gray-700">{interes.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Restricción dietaria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferencia alimentaria</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'sin-restriccion', label: 'Sin restricciones', emoji: '🍽️' },
                      { id: 'vegetariano', label: 'Vegetariano', emoji: '🥗' },
                      { id: 'vegano', label: 'Vegano', emoji: '🌱' },
                      { id: 'sin-gluten', label: 'Sin gluten', emoji: '🌾' },
                      { id: 'halal', label: 'Halal', emoji: '☪️' },
                    ].map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setFormData({ ...formData, restriccionDietaria: op.id })}
                        className={`px-3 py-2 rounded-xl border-2 flex items-center gap-1 text-xs font-medium transition-all ${formData.restriccionDietaria === op.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                      >
                        <span>{op.emoji}</span> {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ritmo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">¿Qué ritmo prefieres?</label>
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl">
                    <div className="text-center mb-3">
                      <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{getRitmoLabel().text}</span>
                      <p className="text-xs text-gray-500 mt-1">{getRitmoLabel().desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>🧘</span>
                      <input
                        type="range" min="1" max="5"
                        value={formData.ritmo}
                        onChange={(e) => setFormData({ ...formData, ritmo: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span>🏃</span>
                    </div>
                  </div>
                </div>

                {/* Horario preferido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo arrancas el día?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'madrugador', label: 'Madrugador', emoji: '🌅', desc: 'Arranco a las 7' },
                      { id: 'normal', label: 'Normal', emoji: '☀️', desc: 'Arranco a las 9-10' },
                      { id: 'nocturno', label: 'Noctámbulo', emoji: '🌙', desc: 'Arranco al mediodía' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setFormData({ ...formData, horarioPreferido: h.id })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.horarioPreferido === h.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="text-xl">{h.emoji}</span>
                        <span className="text-xs font-medium text-gray-700">{h.label}</span>
                        <span className="text-xs text-gray-400">{h.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alojamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">¿Dónde prefieres alojarte?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {alojamientoOptions.map((aloj) => (
                      <button
                        key={aloj.id}
                        onClick={() => setFormData({ ...formData, alojamiento: aloj.id })}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${formData.alojamiento === aloj.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="text-2xl">{aloj.emoji}</span>
                        <span className="font-medium text-gray-800">{aloj.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferencias avanzadas */}
                <details className="rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="p-3 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 flex items-center gap-2 select-none">
                    <span>⚙️</span> Preferencias avanzadas <span className="text-gray-400">(opcional)</span>
                  </summary>
                  <div className="p-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Tienes aerolínea preferida o acumulas millas?</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: '', label: 'Sin preferencia' },
                        { id: 'latam', label: 'LATAM' },
                        { id: 'avianca', label: 'Avianca' },
                        { id: 'copa', label: 'Copa' },
                        { id: 'american', label: 'American' },
                        { id: 'united', label: 'United' },
                      ].map((al) => (
                        <button
                          key={al.id + '_al'}
                          onClick={() => setFormData({ ...formData, aerolineaPreferida: al.id })}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${formData.aerolineaPreferida === al.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                        >
                          {al.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* ══ PASO 5: Contacto ══════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📧</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Último paso!</h2>
                <p className="text-gray-500">¿Dónde te enviamos los detalles?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo te llamas?</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tu email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                </div>
                {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              </div>
            </div>
          )}

          {/* ══ Navegación ════════════════════════════════════════════════════════ */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" /> Atrás
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${canProceed() ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleStep5Submit}
                disabled={!canProceed() || isSubmitting || isLoadingOptions}
                className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${canProceed() && !isSubmitting && !isLoadingOptions ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {isSubmitting || isLoadingOptions
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> {isLoadingOptions ? 'Buscando destinos...' : 'Enviando...'}</>
                  : <>Continuar <ChevronRight className="w-5 h-5" /></>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
