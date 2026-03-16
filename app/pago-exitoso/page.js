'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// ─── Colores VIVANTE Brandbook ────────────────────────────────────────────────
const C = {
  coral:   '#FF6332',
  fucsia:  '#E83E8C',
  violeta: '#6F42C1',
  crema:   '#FCF8F4',
  carbon:  '#212529',
  cremaCl: '#FFF8F5',
  cremalg: '#FFF0EB',
};

function ItinerarioContent() {
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [itinerario, setItinerario] = useState(null);
  const [formData, setFormData] = useState(null);
  const [planId, setPlanId] = useState('basico');
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    const status = searchParams.get('status');
    const savedPlan = searchParams.get('plan') || localStorage.getItem('vivante_planId') || 'basico';
    setPlanId(savedPlan);

    if (status === 'failure') {
      window.location.href = '/pago-fallido';
      return;
    }

    let data = null;
    try {
      const raw = localStorage.getItem('vivante_formData');
      if (raw) data = JSON.parse(raw);
    } catch {}

    if (!data) {
      setEstado('error');
      return;
    }

    setFormData(data);

    fetch('/api/send-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: data, planId: savedPlan }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.itinerario) {
          setItinerario(result.itinerario);
          setEstado('listo');
        } else {
          setEstado('error');
        }
      })
      .catch(() => setEstado('error'));
  }, [searchParams]);

  // ─── CARGANDO ──────────────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', background: C.crema, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36, animation: 'spin 2s linear infinite' }}>
            ✈️
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: C.carbon, marginBottom: 12 }}>
            Preparando tu aventura...
          </h1>
          <p style={{ color: '#666', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            Estamos armando tu itinerario personalizado.<br />
            <strong>Esto tarda unos 30 segundos.</strong>
          </p>
          <p style={{ color: C.violeta, fontStyle: 'italic', fontSize: 14 }}>
            Mientras tanto, puedes ir pensando qué ropa llevar 😄
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: C.coral, opacity: 0.4, animation: `pulse 1.2s ${i * 0.4}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        `}</style>
      </div>
    );
  }

  // ─── ERROR ─────────────────────────────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: C.crema, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😔</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, color: C.carbon, marginBottom: 12 }}>
            Hubo un problema técnico
          </h1>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Tu pago fue procesado correctamente. Recibirás tu itinerario por email a la brevedad.
          </p>
          <a href="mailto:vive.vivante.ch@gmail.com" style={{ background: C.coral, color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
            Contactar soporte
          </a>
        </div>
      </div>
    );
  }

  // ─── ITINERARIO LISTO ─────────────────────────────────────────────────────
  const isPro = planId === 'pro';
  const tabs = [
    { id: 'resumen', label: '📊 Resumen' },
    { id: 'dias', label: '📅 Día a día' },
    { id: 'vuelos', label: '✈️ Vuelos' },
    { id: 'alojamiento', label: '🏨 Alojamiento' },
    { id: 'restaurantes', label: '🍽️ Comer' },
    { id: 'tips', label: '🌍 Tips' },
    ...(isPro ? [
      { id: 'nocturno', label: '🍸 Noche' },
      { id: 'transporte', label: '🚇 Transporte' },
      { id: 'conectividad', label: '📱 Conectividad' },
    ] : []),
    { id: 'imperdible', label: '⭐ Imperdible' },
  ];

  const sectionStyle = {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };
  const sectionHeader = (title, bg = C.coral) => ({
    background: bg,
    padding: '14px 20px',
    color: '#fff',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 700,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  });
  const sectionBody = { padding: '20px' };

  return (
    <div style={{ minHeight: '100vh', background: C.crema, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: #FCF8F4 !important; }
        }
        .tab-btn { border: none; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .tab-btn:hover { opacity: 0.8; }
        a { color: ${C.violeta}; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.coral, padding: '24px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -1 }}>VIVANTE</p>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, margin: '4px 0 0', letterSpacing: 2 }}>VIAJA MÁS. PLANIFICA MENOS.</p>
      </div>

      {/* HERO ITINERARIO */}
      <div style={{ background: `linear-gradient(135deg, ${C.coral} 0%, ${C.fucsia} 100%)`, padding: '32px 20px', color: '#fff', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
          {isPro ? '⭐ VIVANTE PRO' : '✅ VIVANTE BÁSICO'} · PAGO CONFIRMADO
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
          {itinerario?.titulo || `Tu aventura a ${formData?.destino}`}
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, margin: '0 0 20px', fontStyle: 'italic' }}>
          {itinerario?.subtitulo || `Todo listo, ${formData?.nombre}. Solo falta hacer la maleta.`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }} className="no-print">
          <button
            onClick={() => window.print()}
            style={{ background: '#fff', color: C.coral, border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
          >
            📄 Guardar como PDF
          </button>
          <a
            href="mailto:vive.vivante.ch@gmail.com"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 600, textDecoration: 'none', fontSize: 15, border: '2px solid rgba(255,255,255,0.4)' }}
          >
            ✉️ Contactar soporte
          </a>
        </div>
      </div>

      {/* EMAIL NOTICE */}
      <div style={{ background: C.violeta, padding: '12px 20px', textAlign: 'center' }} className="no-print">
        <p style={{ color: '#fff', margin: 0, fontSize: 14 }}>
          📧 Este itinerario también fue enviado a <strong>{formData?.email}</strong>
        </p>
      </div>

      {/* TABS */}
      <div className="no-print" style={{ background: '#fff', borderBottom: `3px solid ${C.cremalg}`, overflowX: 'auto', display: 'flex', padding: '0 12px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? C.coral : '#666',
              background: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${C.coral}` : '3px solid transparent',
              marginBottom: -3,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── RESUMEN ──────────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'resumen' ? 'block' : 'none' }} className="print-section">
          <div style={sectionStyle}>
            <div style={sectionHeader('📊 Resumen de tu Viaje')}>📊 Resumen de tu Viaje</div>
            <div style={sectionBody}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['Destino', itinerario?.resumen?.destino || formData?.destino],
                  ['Origen', formData?.origen],
                  ['Duración', `${formData?.dias} días`],
                  ['Viajeros', formData?.numViajeros],
                  ['Fecha óptima', itinerario?.resumen?.fecha_optima],
                  ['Distribución', itinerario?.resumen?.distribucion],
                  ['Ritmo', itinerario?.resumen?.ritmo],
                ].filter(r => r[1]).map(([label, value], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.cremalg : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: C.carbon, width: '35%' }}>{label}</td>
                    <td style={{ padding: '10px 14px', color: C.carbon }}>{value}</td>
                  </tr>
                ))}
              </table>
            </div>
          </div>

          {itinerario?.presupuesto_desglose && (
            <div style={sectionStyle}>
              <div style={sectionHeader('💰 Presupuesto Estimado')}>💰 Presupuesto Estimado</div>
              <div style={sectionBody}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  {Object.entries(itinerario.presupuesto_desglose).map(([key, val], i) => (
                    <tr key={i} style={{ background: key === 'total' ? C.coral : i % 2 === 0 ? C.cremalg : '#fff' }}>
                      <td style={{ padding: '10px 14px', fontWeight: key === 'total' ? 700 : 400, color: key === 'total' ? '#fff' : C.carbon, textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: key === 'total' ? '#fff' : C.coral }}>
                        {val}
                      </td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>
          )}

          {itinerario?.lo_imperdible?.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ ...sectionHeader('⭐ Lo Imperdible', C.fucsia) }}>⭐ Lo Imperdible</div>
              <div style={sectionBody}>
                {itinerario.lo_imperdible.map((item, i) => (
                  <div key={i} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: `3px solid ${C.fucsia}` }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon }}>{i + 1}. {item.nombre}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: 14 }}>{item.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DÍA A DÍA ────────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'dias' ? 'block' : 'none' }}>
          {(itinerario?.dias || []).map(dia => (
            <div key={dia.numero} style={{ ...sectionStyle, borderLeft: `5px solid ${C.coral}` }}>
              <div style={{ background: C.coral, padding: '14px 20px' }}>
                <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17 }}>
                  Día {dia.numero}: {dia.titulo}
                </span>
              </div>
              <div style={sectionBody}>
                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.cremalg}` }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral }}>🌅 Mañana {dia.manana?.horario ? `(${dia.manana.horario})` : ''}</p>
                  <p style={{ margin: '0 0 6px', color: C.carbon }}>{dia.manana?.actividad}</p>
                  {dia.manana?.costo && <span style={{ fontSize: 13, color: '#666' }}>💰 {dia.manana.costo}</span>}
                  {dia.manana?.tip && <p style={{ margin: '6px 0 0', color: C.violeta, fontStyle: 'italic', fontSize: 14 }}>💡 {dia.manana.tip}</p>}
                  {dia.manana?.plan_b && <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>☔ Plan B: {dia.manana.plan_b}</p>}
                </div>
                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.cremalg}` }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral }}>🌞 Tarde {dia.tarde?.horario ? `(${dia.tarde.horario})` : ''}</p>
                  {dia.tarde?.almuerzo && <p style={{ margin: '0 0 4px', color: C.carbon }}>🍽️ {dia.tarde.almuerzo}</p>}
                  <p style={{ margin: 0, color: C.carbon }}>{dia.tarde?.actividad}</p>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral }}>🌙 Noche {dia.noche?.horario ? `(${dia.noche.horario})` : ''}</p>
                  {dia.noche?.cena && <p style={{ margin: '0 0 4px', color: C.carbon }}>🍷 {dia.noche.cena}</p>}
                  {dia.noche?.actividad && <p style={{ margin: 0, color: C.carbon }}>{dia.noche.actividad}</p>}
                </div>
                {dia.ruta_optimizada && (
                  <div style={{ background: C.cremalg, borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#555' }}>📍 <strong>Ruta:</strong> {dia.ruta_optimizada}</p>
                  </div>
                )}
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <span style={{ background: C.violeta, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    {dia.gasto_dia}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── VUELOS ───────────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'vuelos' ? 'block' : 'none' }}>
          <div style={sectionStyle}>
            <div style={sectionHeader('✈️ Vuelos Recomendados')}>✈️ Vuelos Recomendados</div>
            <div style={sectionBody}>
              {(itinerario?.vuelos || []).map((v, i) => (
                <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.cremalg}` }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon }}>{v.aerolinea} — {v.ruta}</p>
                  <p style={{ margin: '0 0 6px', color: C.coral, fontWeight: 700, fontSize: 18 }}>{v.precio_estimado}</p>
                  {v.tip && <p style={{ margin: '0 0 6px', color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {v.tip}</p>}
                  {v.link && <a href={v.link} target="_blank" rel="noopener noreferrer" style={{ background: C.coral, color: '#fff', padding: '6px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Buscar vuelo →</a>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ALOJAMIENTO ──────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'alojamiento' ? 'block' : 'none' }}>
          <div style={sectionStyle}>
            <div style={sectionHeader('🏨 Alojamiento')}>🏨 Alojamiento</div>
            <div style={sectionBody}>
              {(itinerario?.alojamiento || []).map((a, i) => (
                <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.cremalg}` }}>
                  <span style={{ background: C.fucsia, color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{a.categoria}</span>
                  <p style={{ margin: '8px 0 4px', fontWeight: 700, color: C.carbon, fontSize: 16 }}>{a.nombre}</p>
                  <p style={{ margin: '0 0 4px', color: C.coral, fontWeight: 600 }}>{a.precio_noche} / noche</p>
                  <p style={{ margin: '0 0 8px', color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>{a.por_que}</p>
                  {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ background: C.violeta, color: '#fff', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Ver alojamiento →</a>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RESTAURANTES ─────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'restaurantes' ? 'block' : 'none' }}>
          <div style={sectionStyle}>
            <div style={sectionHeader('🍽️ Restaurantes Recomendados')}>🍽️ Restaurantes Recomendados</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: C.coral }}>
                    {['Restaurante', 'Tipo', 'Precio prom.', 'Reserva'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: 'left', fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(itinerario?.restaurantes || []).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.cremalg : '#fff' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.carbon }}>
                        {r.nombre}
                        {r.ubicacion && <span style={{ display: 'block', fontWeight: 400, fontSize: 12, color: '#888' }}>{r.ubicacion}</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#555', fontSize: 14 }}>{r.tipo}</td>
                      <td style={{ padding: '10px 14px', color: C.coral, fontWeight: 600 }}>{r.precio_promedio}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {r.link
                          ? <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ color: C.violeta, fontWeight: 600, fontSize: 13 }}>Reservar →</a>
                          : <span style={{ color: r.requiere_reserva ? C.fucsia : '#aaa', fontSize: 13 }}>{r.requiere_reserva ? 'Reserva requerida' : 'Sin reserva'}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── TIPS CULTURALES ──────────────────────────────────────── */}
        <div style={{ display: activeTab === 'tips' ? 'block' : 'none' }}>
          {itinerario?.tips_culturales?.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ background: C.violeta, padding: '14px 20px' }}>
                <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17 }}>🌍 Tips Culturales, Conectividad y Dinero</span>
              </div>
              <div style={{ padding: '20px', background: '#F5F0FF' }}>
                {itinerario.tips_culturales.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                    <span style={{ background: C.violeta, color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 15 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {itinerario?.dinero && (
            <div style={sectionStyle}>
              <div style={sectionHeader('💳 Dinero y Pagos')}>💳 Dinero y Pagos</div>
              <div style={sectionBody}>
                {[
                  ['Moneda local', itinerario.dinero.moneda_local],
                  ['Tipo de cambio', itinerario.dinero.tipo_cambio],
                  ['¿Tarjeta o efectivo?', itinerario.dinero.tarjeta_o_efectivo],
                  ['Dónde cambiar', itinerario.dinero.donde_cambiar],
                  ...(itinerario.dinero.cajeros ? [['Cajeros', itinerario.dinero.cajeros]] : []),
                  ['Propinas', itinerario.dinero.propinas],
                ].filter(r => r[1]).map(([label, value], i) => (
                  <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.cremalg}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 600, color: C.carbon, fontSize: 14 }}>{label}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: 14 }}>{value}</p>
                  </div>
                ))}
                {itinerario.dinero.tip_extra && (
                  <div style={{ background: '#F5F0FF', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic' }}>💡 {itinerario.dinero.tip_extra}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {itinerario?.seguro?.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionHeader('🏥 Seguro de Viaje')}>🏥 Seguro de Viaje</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.coral }}>
                      {['Seguro', 'Cobertura', 'Precio aprox.'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: 'left', fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itinerario.seguro.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.cremalg : '#fff' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: C.violeta, fontWeight: 700 }}>{s.nombre}</a>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#555', fontSize: 13 }}>{s.cobertura}</td>
                        <td style={{ padding: '10px 14px', color: C.coral, fontWeight: 600 }}>{s.precio_estimado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {itinerario?.checklist?.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionHeader('✅ Checklist Pre-Viaje')}>✅ Checklist Pre-Viaje</div>
              <div style={sectionBody}>
                {itinerario.checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ width: 20, height: 20, border: `2px solid ${C.coral}`, borderRadius: 4, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ color: C.carbon, fontSize: 14 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {itinerario?.emergencias && (
            <div style={sectionStyle}>
              <div style={sectionHeader('🆘 Contactos de Emergencia', '#dc3545')}>🆘 Contactos de Emergencia</div>
              <div style={sectionBody}>
                {itinerario.emergencias.embajada && <p style={{ margin: '0 0 8px', color: C.carbon }}><strong>Embajada/Consulado:</strong> {itinerario.emergencias.embajada}</p>}
                {itinerario.emergencias.emergencias_local && <p style={{ margin: '0 0 8px', color: C.carbon }}><strong>Emergencias:</strong> {itinerario.emergencias.emergencias_local}</p>}
                {itinerario.emergencias.policia_turistica && <p style={{ margin: 0, color: C.carbon }}><strong>Policía turística:</strong> {itinerario.emergencias.policia_turistica}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── PRO: NOCHE ────────────────────────────────────────────── */}
        {isPro && (
          <div style={{ display: activeTab === 'nocturno' ? 'block' : 'none' }}>
            {itinerario?.bares_vida_nocturna?.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionHeader('🍸 Bares y Vida Nocturna')}>🍸 Bares y Vida Nocturna</div>
                <div style={sectionBody}>
                  {itinerario.bares_vida_nocturna.map((b, i) => (
                    <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.cremalg}` }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon }}>{b.nombre}</p>
                      <p style={{ margin: '0 0 4px', color: '#555', fontSize: 14 }}>{b.tipo_ambiente} · {b.precio_trago} · {b.mejor_dia}</p>
                      {b.tip && <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {b.tip}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {itinerario?.tours_experiencias?.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionHeader('🎟️ Experiencias y Tours')}>🎟️ Experiencias y Tours</div>
                <div style={sectionBody}>
                  {itinerario.tours_experiencias.map((t, i) => (
                    <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.cremalg}` }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon }}>{t.nombre}</p>
                      <p style={{ margin: '0 0 4px', color: '#555', fontSize: 14 }}>{t.por_que_vale}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                        {t.duracion && <span style={{ background: C.cremalg, color: C.carbon, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>⏱ {t.duracion}</span>}
                        {t.precio && <span style={{ background: C.cremalg, color: C.coral, fontWeight: 600, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>💰 {t.precio}</span>}
                        {t.anticipacion && <span style={{ background: '#FFF0F8', color: C.fucsia, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>📅 {t.anticipacion}</span>}
                      </div>
                      {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, background: C.coral, color: '#fff', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Reservar experiencia →</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PRO: TRANSPORTE ──────────────────────────────────────── */}
        {isPro && (
          <div style={{ display: activeTab === 'transporte' ? 'block' : 'none' }}>
            {itinerario?.transporte_local && (
              <div style={sectionStyle}>
                <div style={sectionHeader('🚇 Transporte Local')}>🚇 Transporte Local</div>
                <div style={sectionBody}>
                  {[
                    ['¿Cómo moverse?', itinerario.transporte_local.como_moverse],
                    ['Apps recomendadas', (itinerario.transporte_local.apps_recomendadas || []).join(', ')],
                    ['Tarjeta de transporte', itinerario.transporte_local.tarjeta_transporte],
                    ['Aeropuerto → Centro', itinerario.transporte_local.costo_aeropuerto_centro],
                    ['¿Alquilar auto?', itinerario.transporte_local.conviene_auto],
                  ].filter(r => r[1]).map(([label, value], i) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.cremalg}` }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 14 }}>{label}</p>
                      <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PRO: CONECTIVIDAD ────────────────────────────────────── */}
        {isPro && (
          <div style={{ display: activeTab === 'conectividad' ? 'block' : 'none' }}>
            {itinerario?.conectividad && (
              <div style={sectionStyle}>
                <div style={sectionHeader('📱 Conectividad')}>📱 Conectividad</div>
                <div style={sectionBody}>
                  {[
                    ['Roaming', itinerario.conectividad.roaming],
                    ['eSIM recomendada', itinerario.conectividad.esim_recomendada],
                    ['SIM local', itinerario.conectividad.sim_local],
                    ['WiFi en destino', itinerario.conectividad.wifi_destino],
                    ['Apps a descargar', (itinerario.conectividad.apps_descargar || []).join(', ')],
                  ].filter(r => r[1]).map(([label, value], i) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.cremalg}` }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 14 }}>{label}</p>
                      <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {itinerario?.salud_seguridad && (
              <div style={sectionStyle}>
                <div style={sectionHeader('🏥 Salud y Seguridad')}>🏥 Salud y Seguridad</div>
                <div style={sectionBody}>
                  {[
                    ['Vacunas', itinerario.salud_seguridad.vacunas],
                    ['Agua potable', itinerario.salud_seguridad.agua_potable],
                    ['Nivel de seguridad', itinerario.salud_seguridad.nivel_seguridad],
                    ['Zonas a evitar', itinerario.salud_seguridad.zonas_evitar],
                    ['Estafas comunes', itinerario.salud_seguridad.estafas_comunes],
                  ].filter(r => r[1]).map(([label, value], i) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.cremalg}` }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 14 }}>{label}</p>
                      <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {itinerario?.idioma_cultura && (
              <div style={sectionStyle}>
                <div style={sectionHeader('🗣️ Idioma y Cultura', C.violeta)}>🗣️ Idioma y Cultura</div>
                <div style={sectionBody}>
                  <p style={{ marginBottom: 12, color: C.carbon }}><strong>Costumbres:</strong> {itinerario.idioma_cultura.costumbres}</p>
                  <p style={{ marginBottom: 12, color: C.carbon }}><strong>Vestimenta:</strong> {itinerario.idioma_cultura.vestimenta}</p>
                  {itinerario.idioma_cultura.frases_utiles?.length > 0 && (
                    <>
                      <p style={{ fontWeight: 700, color: C.carbon, marginBottom: 8 }}>Frases útiles:</p>
                      {itinerario.idioma_cultura.frases_utiles.map((f, i) => (
                        <div key={i} style={{ background: '#F5F0FF', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: C.violeta }}>{f.frase_local}</span>
                          {f.pronunciacion && <span style={{ color: '#888', fontSize: 12 }}> ({f.pronunciacion})</span>}
                          {f.significado && <span style={{ color: C.carbon, fontSize: 13 }}> — {f.significado}</span>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LO IMPERDIBLE ─────────────────────────────────────────── */}
        <div style={{ display: activeTab === 'imperdible' ? 'block' : 'none' }}>
          {itinerario?.lo_imperdible?.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ background: C.fucsia, padding: '14px 20px' }}>
                <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>⭐ Lo Imperdible</span>
              </div>
              <div style={sectionBody}>
                {itinerario.lo_imperdible.map((item, i) => (
                  <div key={i} style={{ marginBottom: 20, paddingLeft: 16, borderLeft: `4px solid ${C.fucsia}` }}>
                    <p style={{ margin: '0 0 6px', fontWeight: 700, color: C.carbon, fontSize: 16 }}>{i + 1}. {item.nombre}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: 14, lineHeight: 1.6 }}>{item.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isPro && itinerario?.extras?.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionHeader('🎯 Más Cosas Para Hacer')}>🎯 Más Cosas Para Hacer</div>
              <div style={sectionBody}>
                {itinerario.extras.map((extra, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <p style={{ margin: '0 0 6px', fontWeight: 700, color: C.coral }}>{extra.categoria}</p>
                    {(extra.actividades || []).map((act, j) => (
                      <p key={j} style={{ margin: '0 0 4px', color: C.carbon, paddingLeft: 12, borderLeft: `2px solid ${C.cremalg}`, fontSize: 14 }}>• {act}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: C.coral, padding: '32px 20px', textAlign: 'center', marginTop: 16 }}>
        <p style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>VIVANTE</p>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', fontSize: 14 }}>
          ¡Que tengas el viaje de tu vida, {formData?.nombre}! ✈️
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>
          <a href="https://vivante.vercel.app" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>vivante.vercel.app</a>
          {' · '}
          <a href="https://instagram.com/vive.vivante" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>@vive.vivante</a>
          {' · viaja más. planifica menos.'}
        </p>
      </div>
    </div>
  );
}

export default function PagoExitoso() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#FCF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#FF6332', fontFamily: 'Syne, sans-serif', fontSize: 20 }}>Cargando tu itinerario... ✈️</p>
      </div>
    }>
      <ItinerarioContent />
    </Suspense>
  );
}
