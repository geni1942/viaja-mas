'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const C = {
  coral:   '#FF6332',
  fucsia:  '#E83E8C',
  violeta: '#6F42C1',
  crema:   '#FCF8F4',
  carbon:  '#212529',
  bg0:     '#FFF8F5',
  bg1:     '#FFF0EB',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildBookingUrl(destino, checkin, checkout, adults) {
  const p = new URLSearchParams({ ss: destino || '', checkin: checkin || '', checkout: checkout || '', group_adults: adults || 2, no_rooms: 1, selected_currency: 'USD' });
  return `https://www.booking.com/searchresults.html?${p}`;
}

function buildAirbnbUrl(destino, checkin, checkout, adults) {
  return `https://www.airbnb.com/s/${encodeURIComponent(destino || '')}/homes?checkin=${checkin || ''}&checkout=${checkout || ''}&adults=${adults || 2}`;
}

function buildHostelworldUrl(destino, checkin, checkout, adults, nombre) {
  // Hostelworld requiere fechas en formato DD/MM/YYYY (codificado como DD%2FMM%2FYYYY)
  const fmtHW = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}%2F${m}%2F${y}`;
  };
  // Si hay nombre del hostal, buscar por nombre + ciudad para encontrar el hostal específico
  const keyword = nombre ? `${nombre}, ${destino}` : (destino || '');
  const dest = encodeURIComponent(keyword);
  return `https://www.hostelworld.com/search?search_keywords=${dest}&dateFrom=${fmtHW(checkin)}&dateTo=${fmtHW(checkout)}&numberOfGuests=${adults || 2}`;
}

function alojamientoLink(op, destino, checkin, checkout, adults, alojPref) {
  // Siempre ignoramos el link del AI (suelen ser genéricos o inválidos).
  // Construimos un link de búsqueda con el NOMBRE del hotel para que match sea específico.
  const plat = (op.plataforma || '').toLowerCase();
  const nombre = (op.nombre || '').trim();

  if (plat.includes('hostel')) return buildHostelworldUrl(destino, checkin, checkout, adults, nombre);

  if (plat.includes('airbnb')) {
    // Airbnb: buscamos por ciudad + nombre en el query
    const base = `https://www.airbnb.com/s/${encodeURIComponent(destino || '')}/homes`;
    const p = new URLSearchParams({ checkin: checkin || '', checkout: checkout || '', adults: adults || 2, query: nombre });
    return `${base}?${p}`;
  }

  // Booking.com: buscar "Hotel Name, Ciudad" → encuentra el alojamiento específico
  const searchTerm = nombre ? `${nombre}, ${destino}` : destino;
  const p = new URLSearchParams({
    ss: searchTerm,
    checkin: checkin || '',
    checkout: checkout || '',
    group_adults: adults || 2,
    no_rooms: 1,
    selected_currency: 'USD',
  });
  // Si la preferencia es Bed & Breakfast, aplicar filtro de tipo de propiedad (pt=11)
  if (alojPref === 'bnb') p.append('nflt', 'pt%3D11');
  return `https://www.booking.com/searchresults.html?${p}`;
}

// ─── Airline URLs — página principal de cada aerolínea ────────────────────────
function buildAirlineUrl(aerolinea, origenIata, destinoIata, fechaSalida, fechaRegreso) {
  const a = (aerolinea || '').toLowerCase();

  // ── Latinoamericanas ──────────────────────────────────────────────────────
  if (a.includes('latam'))                                                        return 'https://www.latam.com/';
  if (a.includes('jetsmart'))                                                     return 'https://www.jetsmart.com/';
  if (a.includes('sky') && !a.includes('scanner'))                               return 'https://www.skyairline.com/';
  if (a.includes('avianca'))                                                      return 'https://www.avianca.com/';
  if (a.includes('copa'))                                                         return 'https://www.copaair.com/';
  if (a.includes('aerolineas') || a.includes('aerolíneas') || a.includes('argentinas')) return 'https://www.aerolineas.com.ar/';
  if (a.includes('aeromexico') || a.includes('aeroméxico'))                      return 'https://www.aeromexico.com/';
  if (a.includes('gol'))                                                          return 'https://www.voegol.com.br/';
  if (a.includes('azul'))                                                         return 'https://www.voeazul.com.br/';
  if (a.includes('tam'))                                                          return 'https://www.latam.com/'; // TAM = LATAM Brazil

  // ── Norteamericanas ───────────────────────────────────────────────────────
  if (a.includes('american'))                                                     return 'https://www.aa.com/';
  if (a.includes('united'))                                                       return 'https://www.united.com/';
  if (a.includes('delta'))                                                        return 'https://www.delta.com/';
  if (a.includes('air canada'))                                                   return 'https://www.aircanada.com/';
  if (a.includes('westjet'))                                                      return 'https://www.westjet.com/';

  // ── Europeas ──────────────────────────────────────────────────────────────
  if (a.includes('iberia express') || (a.includes('iberia') && a.includes('express'))) return 'https://www.iberiaexpress.com/';
  if (a.includes('iberia'))                                                       return 'https://www.iberia.com/';
  if (a.includes('air europa') || a.includes('aireuropa'))                       return 'https://www.aireuropa.com/';
  if (a.includes('turkish') || a.includes('thy'))                                return 'https://www.turkishairlines.com/';
  if (a.includes('air france') || a.includes('airfrance'))                       return 'https://www.airfrance.com/';
  if (a.includes('klm'))                                                          return 'https://www.klm.com/';
  if (a.includes('lufthansa'))                                                    return 'https://www.lufthansa.com/';
  if (a.includes('swiss'))                                                        return 'https://www.swiss.com/';
  if (a.includes('austrian'))                                                     return 'https://www.austrian.com/';
  if (a.includes('british') || (a.includes('ba') && a.length < 6))              return 'https://www.britishairways.com/';
  if (a.includes('tap') || (a.includes('portugal') && !a.includes('tap')))       return 'https://www.flytap.com/';
  if (a.includes('norwegian'))                                                    return 'https://www.norwegian.com/';
  if (a.includes('easyjet'))                                                      return 'https://www.easyjet.com/';
  if (a.includes('ryanair'))                                                      return 'https://www.ryanair.com/';
  if (a.includes('finnair'))                                                      return 'https://www.finnair.com/';
  if (a.includes('ita airways') || a.includes('ita air'))                        return 'https://www.ita-airways.com/';

  // ── Medio Oriente / África ────────────────────────────────────────────────
  if (a.includes('qatar'))                                                        return 'https://www.qatarairways.com/';
  if (a.includes('emirates'))                                                     return 'https://www.emirates.com/';
  if (a.includes('ethiopian'))                                                    return 'https://www.ethiopianairlines.com/';

  // ── Asiáticas ─────────────────────────────────────────────────────────────
  if (a.includes('japan airlines') || a.includes('jal'))                         return 'https://www.jal.co.jp/';
  if (a.includes('all nippon') || /\bana\b/.test(a))                             return 'https://www.ana.co.jp/';
  if (a.includes('singapore'))                                                    return 'https://www.singaporeair.com/';
  if (a.includes('cathay'))                                                       return 'https://www.cathaypacific.com/';
  if (a.includes('korean air'))                                                   return 'https://www.koreanair.com/';
  if (a.includes('asiana'))                                                       return 'https://www.flyasiana.com/';
  if (a.includes('thai'))                                                         return 'https://www.thaiairways.com/';
  if (a.includes('malaysia'))                                                     return 'https://www.malaysiaairlines.com/';
  if (a.includes('air new zealand'))                                              return 'https://www.airnewzealand.com/';
  if (a.includes('eva air') || (a.includes('eva') && !a.includes('evacuacion'))) return 'https://www.evaair.com/';
  if (a.includes('china airlines'))                                               return 'https://www.china-airlines.com/';

  // ── Fallback: Google Flights (aerolínea no reconocida) ────────────────────
  if (!origenIata || !destinoIata || !fechaSalida) return null;
  const dep = fechaSalida;
  const ret = fechaRegreso || '';
  return `https://www.google.com/travel/flights#flt=${origenIata}.${destinoIata}.${dep}${ret ? `*${destinoIata}.${origenIata}.${ret}` : ''};c:USD;e:1;sd:1;t:f`;
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

// ─── Photo con fallback ───────────────────────────────────────────────────────
function Photo({ keyword, seed = 1, height = 220, style = {} }) {
  const [hidden, setHidden] = useState(false);
  if (!keyword || hidden) return null;
  const kw = encodeURIComponent(keyword.replace(/\s+/g, ','));
  return (
    <img
      src={`https://loremflickr.com/800/${height}/${kw}?lock=${seed}`}
      alt={keyword}
      loading="lazy"
      onError={() => setHidden(true)}
      style={{ width: '100%', height, objectFit: 'cover', borderRadius: 12, marginBottom: 12, display: 'block', ...style }}
    />
  );
}

// ─── Sección wrapper ─────────────────────────────────────────────────────────
function Sec({ title, bg = C.coral, children, id }) {
  return (
    <div className="vivante-section" id={id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ background: bg, padding: '14px 20px' }}>
        <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17 }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function Tag({ children, bg = C.fucsia }) {
  return <span style={{ display: 'inline-block', background: bg, color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{children}</span>;
}

// ─── Btn link ─────────────────────────────────────────────────────────────────
function BtnLink({ href, children, color = C.coral, small }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-block', background: color, color: '#fff', padding: small ? '4px 12px' : '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: small ? 12 : 13, fontWeight: 700, marginTop: 6 }}>
      {children}
    </a>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Div() { return <div style={{ borderBottom: `1px solid ${C.bg1}`, margin: '14px 0' }} />; }

// ─── CONTENT ─────────────────────────────────────────────────────────────────
function ItinerarioContent() {
  const searchParams = useSearchParams();
  const [estado, setEstado]         = useState('cargando');
  const [itinerario, setItinerario] = useState(null);
  const [formData, setFormData]     = useState(null);
  const [planId, setPlanId]         = useState('basico');
  const [activeTab, setActiveTab]   = useState('resumen');
  const [contactOpen, setContactOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => {
    const plan = searchParams.get('plan') || localStorage.getItem('vivante_planId') || 'basico';
    setPlanId(plan);
    // Persistir planId en localStorage para que sobreviva recargas
    try { localStorage.setItem('vivante_planId', plan); } catch {}

    // ── Leer formData: intentar con preference_id (más seguro) y luego fallback genérico ──
    let data = null;
    const prefId = searchParams.get('preference_id');
    if (prefId) {
      try { data = JSON.parse(localStorage.getItem(`vivante_pref_${prefId}`) || 'null'); } catch {}
    }
    if (!data) {
      try {
        const raw = localStorage.getItem('vivante_formData');
        const ts  = parseInt(localStorage.getItem('vivante_formData_ts') || '0');
        // Aceptar datos recientes (últimas 4 horas) o sin timestamp (compatibilidad hacia atrás)
        if (raw && (ts === 0 || Date.now() - ts < 4 * 60 * 60 * 1000)) {
          data = JSON.parse(raw);
        }
      } catch {}
    }
    if (!data || !data.destino?.trim()) { setEstado('error'); return; }
    setFormData(data);
    // Basic→Pro continuity: si es upgrade Pro, pasar el itinerario básico como base
    // ⚠️ IMPORTANTE: verificar que el basicItinerary corresponde al MISMO destino actual
    // para evitar mezclar itinerarios de distintos viajes almacenados en localStorage
    let basicItinerary = null;
    if (plan === 'pro') {
      try {
        const storedBasic = JSON.parse(localStorage.getItem('vivante_basic_itinerary') || 'null');
        if (storedBasic) {
          const basicDest  = (storedBasic.resumen?.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
          const currentDest = (data.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
          // Solo usar el basicItinerary si el destino coincide razonablemente
          const destinosCoinciden = basicDest && currentDest && (
            basicDest.includes(currentDest) || currentDest.includes(basicDest)
          );
          if (destinosCoinciden) {
            basicItinerary = storedBasic;
          } else {
            console.log('basicItinerary ignorado: destino diferente (' + basicDest + ' vs ' + currentDest + ')');
            // Limpiar el básico obsoleto para evitar confusiones futuras
            try { localStorage.removeItem('vivante_basic_itinerary'); } catch {}
          }
        }
      } catch {}
    }
    fetch('/api/send-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: data, planId: plan, basicItinerary }),
    }).then(r => r.json()).then(res => {
      if (res.itinerario) {
        setItinerario(res.itinerario);
        setEstado('listo');
        // Guardar itinerario básico para futura continuidad en upgrade Pro
        if (plan !== 'pro') {
          try { localStorage.setItem('vivante_basic_itinerary', JSON.stringify(res.itinerario)); } catch {}
        }
        // ✅ Limpiar datos de sesión para evitar que una compra anterior contamine la próxima
        try {
          localStorage.removeItem('vivante_formData');
          localStorage.removeItem('vivante_formData_ts');
          if (prefId) localStorage.removeItem(`vivante_pref_${prefId}`);
        } catch {}
      }
      else setEstado('error');
    }).catch(() => setEstado('error'));
  }, [searchParams]);

  // ─── CARGANDO ───────────────────────────────────────────────────────────────
  if (estado === 'cargando') return (
    <div style={{ minHeight: '100vh', background: C.crema, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <img
        src="/images/vivante_logo.svg"
        alt="VIVANTE"
        style={{ height: 80, width: 'auto', marginBottom: 24, animation: 'spin 2s linear infinite' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, color: C.carbon, margin: '0 0 8px', textAlign: 'center' }}>Preparando tu aventura...</h1>
      <p style={{ color: '#666', textAlign: 'center', lineHeight: 1.6 }}>Armando tu itinerario personalizado.<br /><strong>Tarda unos 30 segundos.</strong></p>
      <p style={{ color: C.violeta, fontStyle: 'italic', fontSize: 14, marginTop: 8 }}>Mientras tanto, ¿ya pensaste qué ropa llevar? 😄</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─── ERROR ──────────────────────────────────────────────────────────────────
  if (estado === 'error') return (
    <div style={{ minHeight: '100vh', background: C.crema, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😔</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, color: C.carbon, margin: '0 0 10px' }}>Problema técnico</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Tu pago fue procesado. Recibirás el itinerario por email o escríbenos.</p>
        <a href="mailto:vive.vivante.ch@gmail.com" style={{ background: C.coral, color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
          ✉️ vive.vivante.ch@gmail.com
        </a>
      </div>
    </div>
  );

  // ─── DATOS LISTOS ───────────────────────────────────────────────────────────
  const isPro = planId === 'pro';
  const res   = itinerario?.resumen || {};

  // ─── Descargar PDF con html2pdf.js (sin URL de navegador, sin página en blanco, logo en cada página) ──
  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setPrintAll(true);
    // Esperar que React re-renderice con todas las secciones visibles
    await new Promise(r => setTimeout(r, 500));
    try {
      const html2pdfLib = await import('html2pdf.js');
      const html2pdfFn = html2pdfLib.default || html2pdfLib;
      const element = document.getElementById('vivante-print-content');
      if (!element) { window.print(); return; }
      const destName = ((itinerario?.resumen?.destino || formData?.destino || 'viaje')
        .split(',')[0]).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      await html2pdfFn()
        .set({
          margin: [14, 8, 10, 8], // top 14mm: espacio para el encabezado en páginas 2+
          filename: `itinerario-vivante-${destName}.pdf`,
          image: { type: 'jpeg', quality: 0.92 },
          html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          // Sin forced page-breaks (evita página 2 vacía). Solo previene cortes internos.
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(element)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            // Franja beige de encabezado
            pdf.setFillColor(252, 248, 244);
            pdf.rect(0, 0, 210, 12, 'F');
            // Línea coral separadora
            pdf.setDrawColor(255, 99, 50);
            pdf.setLineWidth(0.4);
            pdf.line(0, 12, 210, 12);
            // Texto VIVANTE alineado a la derecha
            pdf.setFontSize(11);
            pdf.setTextColor(255, 99, 50);
            pdf.setFont('helvetica', 'bold');
            pdf.text('VIVANTE', 202, 8, { align: 'right' });
          }
          return pdf;
        })
        .save();
    } catch (err) {
      console.error('PDF error:', err);
      window.print();
    } finally {
      setPrintAll(false);
      setPdfLoading(false);
    }
  };

  // Helpers para redes sociales — usa solo el nombre de la ciudad principal
  const destRaw = (res.destino || formData?.destino || '').split(/[,(]/)[0].trim();
  const destTag = destRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

  const baseTabs = ['resumen', 'dias', 'vuelos', 'alojamiento', 'comer', 'experiencias', 'tips', 'imperdible'];
  const proTabs  = ['resumen', 'dias', 'vuelos', 'alojamiento', 'comer', 'experiencias', 'tips', 'noche', 'transporte', 'conectividad', 'empacar', 'imperdible'];
  const allTabs  = isPro ? proTabs : baseTabs;

  const tabLabels = {
    resumen:      '📊 Resumen',
    dias:         '📅 Día a día',
    vuelos:       '✈️ Vuelos',
    alojamiento:  '🏨 Alojamiento',
    comer:        '🍽️ Comer',
    experiencias: '🎟️ Experiencias',
    tips:         '💡 Tips',
    noche:        '🍸 Noche',
    transporte:   '🚇 Transporte',
    conectividad: '📱 Conectividad',
    empacar:      '🎒 Qué Empacar',
    imperdible:   '⭐ Imperdible',
  };

  // printAll: true cuando se está generando el PDF (html2pdf.js necesita ver todas las secciones)
  const show = (tab) => printAll || activeTab === tab;

  return (
    <div style={{ minHeight: '100vh', background: C.crema, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        a { color: ${C.violeta}; }
        .tab-btn { border: none; background: none; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: Inter, sans-serif; }
        /* ── PRINT: mostrar TODAS las secciones ── */
        @media print {
          /* Eliminar URL/fecha del header y footer del navegador — margin:0 lo suprime */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          /* Padding interno para compensar el margin:0 */
          body { background: #FCF8F4 !important; margin: 0 !important; padding: 10mm !important; }
          /* Ocultar completamente elementos no imprimibles (sin espacio residual) */
          .no-print { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; max-height: 0 !important; }
          /* Mostrar TODAS las secciones del itinerario */
          .vivante-section  { display: block !important; margin-bottom: 14px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          /* IMPORTANTE: primera sección → sin salto de página antes (evita primera página en blanco) */
          .print-break:first-of-type { page-break-before: auto !important; break-before: auto !important; }
          /* Resto de secciones principales: salto de página entre ellas */
          .print-break ~ .print-break { page-break-before: always !important; break-before: page !important; }
          /* Tarjetas de días: no se cortan en el medio */
          .day-card         { page-break-inside: avoid !important; break-inside: avoid !important; margin-bottom: 12px !important; }
          /* Colores exactos en impresión */
          *                 { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.coral, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/images/vivante_logo.svg" alt="VIVANTE" style={{ height: 92, width: 'auto' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <span style={{ display: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>VIVANTE</span>
      </div>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, ${C.coral}, ${C.fucsia})`, padding: '28px 20px', textAlign: 'center', color: '#fff' }} className="no-print">
        <Tag bg="rgba(255,255,255,0.2)">{isPro ? '⭐ VIVANTE PRO' : '✅ VIVANTE BÁSICO'} · PAGO CONFIRMADO</Tag>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: '10px 0 6px', lineHeight: 1.2 }}>
          {itinerario?.titulo || `Tu aventura a ${formData?.destino}`}
        </h1>
        <p style={{ fontSize: 15, opacity: 0.9, margin: '0 0 6px', fontStyle: 'italic' }}>
          {itinerario?.subtitulo || `Todo listo, ${formData?.nombre}. ¡Solo falta hacer la maleta!`}
        </p>
        {res.fecha_optima_texto && (
          <p style={{ fontSize: 14, background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '4px 14px', borderRadius: 20, marginBottom: 16 }}>
            📅 {res.fecha_optima_texto}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            style={{ background: '#fff', color: C.coral, border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: pdfLoading ? 'wait' : 'pointer', fontSize: 14, opacity: pdfLoading ? 0.7 : 1 }}>
            {pdfLoading ? '⏳ Generando PDF...' : '📄 Descargar PDF completo'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setContactOpen(o => !o)}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              ✉️ Contactar soporte
            </button>
            {contactOpen && (
              <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 280, zIndex: 100, textAlign: 'left' }}>
                <button onClick={() => setContactOpen(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}>✕</button>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>¿Dudas o consultas?</p>
                <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                  Escríbenos a{' '}
                  <a href="mailto:vive.vivante.ch@gmail.com" style={{ color: C.coral, fontWeight: 700 }}>
                    vive.vivante.ch@gmail.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EMAIL NOTICE */}
      <div style={{ background: C.violeta, padding: '10px 20px', textAlign: 'center' }} className="no-print">
        <p style={{ color: '#fff', margin: 0, fontSize: 13 }}>
          📧 Itinerario enviado a <strong>{formData?.email}</strong>
        </p>
      </div>

      {/* PRICE DISCLAIMER */}
      <div style={{ background: '#FFF0EB', padding: '8px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
          💡 Precios estimativos {new Date().getFullYear()}. Los links de vuelos y alojamiento muestran precios en tiempo real.
        </p>
      </div>

      {/* TABS */}
      <div className="no-print" style={{ background: '#fff', borderBottom: `2px solid ${C.bg1}`, overflowX: 'auto', display: 'flex', padding: '0 8px' }}>
        {allTabs.map(tab => (
          <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)}
            style={{ padding: '13px 14px', fontSize: 13, fontWeight: show(tab) ? 700 : 400, color: show(tab) ? C.coral : '#666', borderBottom: show(tab) ? `3px solid ${C.coral}` : '3px solid transparent', marginBottom: -2 }}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* CONTENIDO — id necesario para html2pdf.js */}
      <div id="vivante-print-content" style={{ maxWidth: 760, margin: '0 auto', padding: '20px 14px' }}>

        {/* CABECERA PDF: solo visible en el PDF generado con html2pdf.js */}
        {printAll && (
          <div style={{ background: '#FCF8F4', textAlign: 'center', padding: '28px 0 24px', borderBottom: `3px solid ${C.coral}`, marginBottom: 24 }}>
            <img src="/images/vivante_logo.svg" alt="VIVANTE" style={{ height: 110, width: 'auto', marginBottom: 10 }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <div style={{ display: 'none', color: C.coral, fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>VIVANTE</div>
            <div style={{ color: C.carbon, fontSize: 18, fontWeight: 700, marginTop: 6 }}>{itinerario?.titulo || `Itinerario: ${formData?.destino}`}</div>
            {itinerario?.subtitulo && <div style={{ color: '#666', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>{itinerario.subtitulo}</div>}
          </div>
        )}

        {/* ══ RESUMEN ══════════════════════════════════════════════════════════ */}
        <div className="vivante-section" style={{ display: show('resumen') ? 'block' : 'none' }}>
          <Sec title="📊 Resumen de tu Viaje">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {[
                ['Destino', res.destino || formData?.destino],
                ['Desde', formData?.origen],
                ['Duración', `${formData?.dias} días · ${formData?.numViajeros} viajero${formData?.numViajeros > 1 ? 's' : ''}`],
                ['Fecha de ida', formatDate(res.fecha_salida)],
                ['Fecha de vuelta', formatDate(res.fecha_regreso)],
                ['Mejor época', res.fecha_optima_texto],
                ['Distribución', res.distribucion],
                ['Ritmo', res.ritmo],
              ].filter(r => r[1]).map(([l, v], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.bg1 : '#fff' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: C.carbon, width: '38%', fontSize: 14 }}>{l}</td>
                  <td style={{ padding: '10px 14px', color: C.carbon, fontSize: 14 }}>{v}</td>
                </tr>
              ))}
            </table>
          </Sec>

          {itinerario?.presupuesto_desglose && (
            <Sec title="💰 Presupuesto Estimado">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {Object.entries(itinerario.presupuesto_desglose).map(([k, v], i) => (
                  <tr key={i} style={{ background: k === 'total' ? C.coral : i % 2 === 0 ? C.bg1 : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: k === 'total' ? 700 : 400, color: k === 'total' ? '#fff' : C.carbon, textTransform: 'capitalize', fontSize: 14 }}>
                      {k.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: k === 'total' ? '#fff' : C.coral, fontSize: 14 }}>{v}</td>
                  </tr>
                ))}
              </table>
            </Sec>
          )}
        </div>

        {/* ══ DÍA A DÍA ═══════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('dias') ? 'block' : 'none' }}>
          {(itinerario?.dias || []).map((dia, di) => (
            <div key={di} className="day-card" style={{ background: '#fff', borderRadius: 16, marginBottom: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: `5px solid ${C.coral}` }}>
              <div style={{ background: C.coral, padding: '13px 18px' }}>
                <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
                  Día {dia.numero}: {dia.titulo}
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral, fontSize: 14 }}>🌅 Mañana {dia.manana?.horario ? `(${dia.manana.horario})` : ''}</p>
                  <p style={{ margin: '0 0 4px', color: C.carbon, fontSize: 14 }}>{dia.manana?.actividad}</p>
                  {dia.manana?.costo && <span style={{ fontSize: 12, color: '#666' }}>💰 {dia.manana.costo}</span>}
                  {dia.manana?.tip && <p style={{ margin: '5px 0 0', color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {dia.manana.tip}</p>}
                  {dia.manana?.plan_b && <p style={{ margin: '3px 0 0', color: '#aaa', fontSize: 12 }}>☔ Plan B: {dia.manana.plan_b}</p>}
                </div>
                <Div />
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral, fontSize: 14 }}>🌞 Tarde {dia.tarde?.horario ? `(${dia.tarde.horario})` : ''}</p>
                  {dia.tarde?.almuerzo && <p style={{ margin: '0 0 4px', color: C.carbon, fontSize: 14 }}>🍴 {dia.tarde.almuerzo}</p>}
                  <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{dia.tarde?.actividad}</p>
                </div>
                <Div />
                <div style={{ marginBottom: 8 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.coral, fontSize: 14 }}>🌙 Noche</p>
                  {dia.noche?.cena && <p style={{ margin: '0 0 4px', color: C.carbon, fontSize: 14 }}>🍷 {dia.noche.cena}</p>}
                  {dia.noche?.actividad && <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{dia.noche.actividad}</p>}
                </div>
                {dia.ruta_optimizada && (
                  <div style={{ background: C.bg1, borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>📍 <strong>Ruta del día:</strong> {dia.ruta_optimizada}</p>
                  </div>
                )}
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <Tag bg={C.violeta}>💰 {dia.gasto_dia}</Tag>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ VUELOS ═══════════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('vuelos') ? 'block' : 'none' }}>
          <Sec title="✈️ Vuelos Recomendados">
            {/* Ruta y fechas */}
            <div style={{ background: C.bg1, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: C.carbon }}>
              ✈️ Ruta: <strong>{formData?.origen}</strong> → <strong>{res.destino || formData?.destino}</strong>
              {res.fecha_salida && (
                <span style={{ color: '#666' }}>
                  {' '}· <strong>{formatDate(res.fecha_salida)}</strong> → <strong>{formatDate(res.fecha_regreso)}</strong>
                  {' '}· {formData?.numViajeros || 1} {formData?.numViajeros === 1 ? 'pasajero' : 'pasajeros'}
                </span>
              )}
            </div>

            {/* Tabla de aerolíneas */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: C.coral }}>
                    {['Aerolínea', 'Ruta', 'Precio estimado', 'Duración', 'Tip insider', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(itinerario?.vuelos || []).map((v, i) => {
                    const airlineUrl = buildAirlineUrl(v.aerolinea, res.origen_iata, res.destino_iata, res.fecha_salida, res.fecha_regreso, formData?.numViajeros);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : '#fff', verticalAlign: 'top' }}>
                        <td style={{ padding: '12px 12px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{v.aerolinea}</td>
                        <td style={{ padding: '12px 12px', color: '#555', fontSize: 13 }}>
                          <div>{v.ruta}</div>
                          {v.escala && (
                            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, background: v.escala.toLowerCase().includes('directo') ? '#e8f5e9' : '#FFF0EB', color: v.escala.toLowerCase().includes('directo') ? '#27ae60' : C.coral, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                              {v.escala}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', color: C.coral, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{v.precio_estimado}</td>
                        <td style={{ padding: '12px 12px', color: '#666', fontSize: 13, whiteSpace: 'nowrap' }}>{v.duracion || '—'}</td>
                        <td style={{ padding: '12px 12px', color: C.violeta, fontStyle: 'italic', fontSize: 12, maxWidth: 180 }}>{v.tip || '—'}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <BtnLink href={airlineUrl} small color={C.coral}>Buscar vuelo →</BtnLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Sec>
        </div>

        {/* ══ ALOJAMIENTO ══════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('alojamiento') ? 'block' : 'none' }}>
          {(itinerario?.alojamiento || []).map((zona, zi) => (
            <Sec key={zi} title={`🏨 Alojamiento en ${zona.destino || 'Destino'}${zona.noches ? ` (${zona.noches} noches)` : ''}`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: C.violeta }}>
                      {['Categoría', 'Hotel', 'Precio/noche', 'Por qué elegirlo', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(zona.opciones || []).map((op, oi) => (
                      <tr key={oi} style={{ background: oi % 2 === 0 ? C.bg0 : '#fff', verticalAlign: 'top' }}>
                        <td style={{ padding: '12px 12px' }}>
                          <Tag bg={op.categoria === 'Premium' ? C.fucsia : op.categoria === 'Confort' ? C.coral : '#888'}>
                            {op.categoria}
                          </Tag>
                          {op.plataforma && (
                            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 11 }}>{op.plataforma}</p>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{op.nombre}</p>
                          {op.puntuacion && <p style={{ margin: '0 0 2px', color: '#27ae60', fontSize: 12 }}>⭐ {op.puntuacion}</p>}
                          {op.cancelacion?.toLowerCase().includes('gratuita') && (
                            <p style={{ margin: 0, color: '#27ae60', fontSize: 11 }}>✅ Cancelación gratuita</p>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', color: C.coral, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
                          {op.precio_noche}<span style={{ color: '#888', fontWeight: 400, fontSize: 11 }}> /noche</span>
                        </td>
                        <td style={{ padding: '12px 12px', color: C.violeta, fontStyle: 'italic', fontSize: 13, maxWidth: 200 }}>
                          {op.por_que}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <BtnLink
                            href={alojamientoLink(op, zona.destino, res.fecha_salida, res.fecha_regreso, formData?.numViajeros, formData?.alojamiento)}
                            color={C.violeta}
                            small>
                            Ver alojamiento →
                          </BtnLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>
          ))}
        </div>

        {/* ══ COMER ════════════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('comer') ? 'block' : 'none' }}>
          <Sec title="🍽️ Restaurantes Recomendados">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: C.coral }}>
                    {['Restaurante', 'Ubicación', 'Tipo', 'Precio / pax', '¿Reserva?', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const data = itinerario?.restaurantes;
                    // Soporta formato nuevo (objeto por ciudad) y formato viejo (array plano)
                    const byCiudad = Array.isArray(data)
                      ? { [destRaw || 'Destino']: data }
                      : (data && typeof data === 'object' ? data : {});
                    return Object.entries(byCiudad).flatMap(([ciudad, lista], ci) => [
                      <tr key={`hdr-${ci}`} style={{ background: C.violeta }}>
                        <td colSpan={6} style={{ padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 13 }}>📍 {ciudad}</td>
                      </tr>,
                      ...(lista || []).map((r, i) => (
                        <tr key={`${ci}-${i}`} style={{ background: i % 2 === 0 ? C.bg0 : '#fff', verticalAlign: 'top' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{r.nombre}</p>
                            {r.por_que && <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 12 }}>{r.por_que}</p>}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#666', fontSize: 13 }}>{r.ubicacion || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#555', fontSize: 13 }}>{r.tipo}</td>
                          <td style={{ padding: '10px 12px', color: C.coral, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{r.precio_promedio}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 18 }}>
                            {r.requiere_reserva ? '✅' : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.link_reserva
                              ? <BtnLink href={r.link_reserva} small color={r.requiere_reserva ? C.fucsia : C.coral}>
                                  {r.requiere_reserva ? 'Reservar →' : 'Ver →'}
                                </BtnLink>
                              : r.instagram
                              ? <BtnLink href={`https://instagram.com/${r.instagram.replace('@', '')}`} small color="#E1306C">
                                  {r.instagram}
                                </BtnLink>
                              : <span style={{ fontSize: 12, color: '#aaa' }}>Sin reserva</span>
                            }
                          </td>
                        </tr>
                      ))
                    ]);
                  })()}
                </tbody>
              </table>
            </div>
          </Sec>
        </div>

        {/* ══ EXPERIENCIAS ═════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('experiencias') ? 'block' : 'none' }}>
          <Sec title="🎟️ Experiencias y Tours">
            {(itinerario?.experiencias?.length > 0) ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                  <thead>
                    <tr style={{ background: C.coral }}>
                      {['Experiencia', 'Por qué vale', 'Duración', 'Precio', 'Anticipación', 'Reservar'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(itinerario.experiencias || []).map((exp, ei) => {
                      const rawQ = ((exp.nombre || '') + ' ' + destRaw).trim();
                      const qPlus = rawQ.replace(/\s+/g, '+');
                      // GYG: SIEMPRE búsqueda con + encoding (nunca links del AI — son IDs inventados)
                      const gygUrl = `https://www.getyourguide.com/s/?q=${qPlus}&partner_id=UCJJVUD`;
                      // Civitatis: página de ciudad con actividad como búsqueda → ej: civitatis.com/es/barcelona/?q=Sagrada+Familia
                      const civiSlug = destRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                      const civitatisUrl = `https://www.civitatis.com/es/${civiSlug}/?q=${encodeURIComponent(exp.nombre || rawQ)}`;
                      // plataformas_disponibles: undefined → mostrar ambas (backward compat); [] → ninguna; ["X"] → solo X
                      const plats = exp.plataformas_disponibles;
                      const showGyg       = !plats || plats.includes('GetYourGuide');
                      const showCivitatis = !plats || plats.includes('Civitatis') || plats.includes('Viator'); // Viator = backward compat itinerarios viejos
                      const showNone      = Array.isArray(plats) && plats.length === 0;
                      return (
                      <tr key={ei} style={{ background: ei % 2 === 0 ? C.bg0 : '#fff', verticalAlign: 'top' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: C.carbon, fontSize: 14 }}>{exp.nombre}</p>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#555', fontSize: 13, maxWidth: 160 }}>{exp.por_que_vale}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 13, whiteSpace: 'nowrap' }}>{exp.duracion || '—'}</td>
                        <td style={{ padding: '10px 12px', color: C.coral, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{exp.precio || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>{exp.anticipacion || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {showGyg    && <BtnLink href={gygUrl}    small color="#FF6600">GetYourGuide →</BtnLink>}
                            {showCivitatis && <BtnLink href={civitatisUrl} small color="#00A651">Civitatis →</BtnLink>}
                            {showNone   && <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>Reservar localmente</span>}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Las experiencias se incluyen en el itinerario día a día.</p>
            )}
          </Sec>
        </div>

        {/* ══ TIPS ═════════════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('tips') ? 'block' : 'none' }}>
          {/* Tips culturales: SOLO en Pro */}
          {isPro && itinerario?.tips_culturales?.length > 0 && (
            <Sec title="🌍 Tips Culturales, Conectividad y Dinero" bg={C.violeta}>
              <div style={{ background: '#F5F0FF', borderRadius: 10, padding: 16 }}>
                {itinerario.tips_culturales.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <span style={{ background: C.violeta, color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 14 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {itinerario?.dinero && (
            <Sec title="💳 Dinero y Pagos">
              {[
                ['Moneda local', itinerario.dinero.moneda_local],
                ['Tipo de cambio', itinerario.dinero.tipo_cambio],
                ['¿Tarjeta o efectivo?', itinerario.dinero.tarjeta_o_efectivo],
                ['Dónde cambiar', itinerario.dinero.donde_cambiar],
                ...(itinerario.dinero.cajeros ? [['Cajeros', itinerario.dinero.cajeros]] : []),
                ['Propinas', itinerario.dinero.propinas],
              ].filter(r => r[1]).map(([l, v], i) => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13 }}>{l}</p>
                  <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{v}</p>
                </div>
              ))}
              {itinerario.dinero.tip_extra && (
                <div style={{ background: '#F5F0FF', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                  <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {itinerario.dinero.tip_extra}</p>
                </div>
              )}
            </Sec>
          )}

          {itinerario?.seguro?.length > 0 && (
            <Sec title="🏥 Seguro de Viaje">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: C.coral }}>
                      {['Seguro', 'Cobertura', 'Precio aprox.', ''].map(h => (
                        <th key={h} style={{ padding: '9px 12px', color: '#fff', textAlign: 'left', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Garantiza que IATI siempre aparezca (el AI a veces lo omite en Pro)
                      const base = itinerario.seguro || [];
                      const hasIati = base.some(s => s.nombre?.toLowerCase().includes('iati'));
                      const lista = hasIati ? base : [...base, {
                        nombre: 'IATI Seguros',
                        cobertura: 'Cancelación, asistencia médica, equipaje y accidentes',
                        precio_estimado: 'Desde $50 USD',
                        link: 'https://www.iatiseguros.com/',
                      }];
                      return lista.map((s, i) => {
                        const href = s.nombre?.toLowerCase().includes('iati')
                          ? 'https://www.iatiseguros.com/'
                          : s.link;
                        return (
                          <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : '#fff' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{s.nombre}</td>
                            <td style={{ padding: '10px 12px', color: '#555', fontSize: 13 }}>{s.cobertura}</td>
                            <td style={{ padding: '10px 12px', color: C.coral, fontWeight: 700 }}>{s.precio_estimado}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <BtnLink href={href} color={C.fucsia} small>COTIZAR</BtnLink>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </Sec>
          )}

          {itinerario?.checklist?.length > 0 && (
            <Sec title="✅ Checklist Pre-Viaje">
              <div style={{ columns: 2, gap: 16 }}>
                {itinerario.checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, breakInside: 'avoid' }}>
                    <span style={{ width: 18, height: 18, border: `2px solid ${C.coral}`, borderRadius: 4, flexShrink: 0, display: 'inline-block', marginTop: 1 }} />
                    <span style={{ color: C.carbon, fontSize: 13 }}>{item}</span>
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {itinerario?.emergencias && (
            <Sec title="🆘 Contactos de Emergencia" bg="#c0392b">
              {[
                ['Embajada chilena', itinerario.emergencias.embajada],
                ['Emergencias', itinerario.emergencias.emergencias_local],
                ['Policía turística', itinerario.emergencias.policia_turistica],
              ].filter(r => r[1]).map(([l, v], i) => (
                <p key={i} style={{ margin: '0 0 8px', color: C.carbon, fontSize: 14 }}><strong>{l}:</strong> {v}</p>
              ))}
            </Sec>
          )}
        </div>

        {/* ══ PRO: NOCHE (bares por ciudad) ══════════════════════════════════ */}
        {isPro && (
          <div className="vivante-section print-break" style={{ display: show('noche') ? 'block' : 'none' }}>
            {(() => {
              const bares = itinerario?.bares_vida_nocturna;
              // Nuevo formato: objeto por ciudad { "Barcelona": [{b1},{b2}] }
              if (bares && typeof bares === 'object' && !Array.isArray(bares) && Object.keys(bares).length > 0) {
                return Object.entries(bares).map(([ciudad, lista], ci) => (
                  <Sec key={ci} title={`🍸 Bares y Vida Nocturna — ${ciudad}`}>
                    {(lista || []).map((b, bi) => (
                      <div key={bi} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: bi < lista.length - 1 ? `1px solid ${C.bg1}` : 'none' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon, fontSize: 15 }}>{b.nombre}</p>
                        <p style={{ margin: '0 0 6px', color: '#555', fontSize: 13 }}>{b.tipo_ambiente}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          {b.precio_trago && <Tag bg={C.coral}>🍹 {b.precio_trago}</Tag>}
                          {b.mejor_dia && <Tag bg={C.violeta}>📅 {b.mejor_dia}</Tag>}
                        </div>
                        {b.tip && <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {b.tip}</p>}
                      </div>
                    ))}
                  </Sec>
                ));
              }
              // Backward compat: formato antiguo (array plano)
              const lista = Array.isArray(bares) ? bares : [];
              return (
                <Sec title="🍸 Bares y Vida Nocturna">
                  {lista.map((b, bi) => (
                    <div key={bi} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: bi < lista.length - 1 ? `1px solid ${C.bg1}` : 'none' }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.carbon, fontSize: 15 }}>{b.nombre}</p>
                      <p style={{ margin: '0 0 6px', color: '#555', fontSize: 13 }}>{b.tipo_ambiente}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        {b.precio_trago && <Tag bg={C.coral}>🍹 {b.precio_trago}</Tag>}
                        {b.mejor_dia && <Tag bg={C.violeta}>📅 {b.mejor_dia}</Tag>}
                      </div>
                      {b.tip && <p style={{ margin: 0, color: C.violeta, fontStyle: 'italic', fontSize: 13 }}>💡 {b.tip}</p>}
                    </div>
                  ))}
                </Sec>
              );
            })()}

            {/* ── Social media discovery ── */}
            <Sec title="📱 Descubre más en redes sociales" bg={C.fucsia}>
              <p style={{ margin: '0 0 14px', color: '#555', fontSize: 14 }}>
                Buscá recomendaciones reales de viajeros para <strong>{destRaw}</strong>:
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                  <thead>
                    <tr style={{ background: C.fucsia }}>
                      {['Plataforma', 'Búsqueda', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ikMap = {
                        playa:      { tiktok: 'playas',              ig: 'beach' },
                        cultura:    { tiktok: 'museos y cultura',    ig: 'culture' },
                        aventura:   { tiktok: 'aventura actividades',ig: 'adventure' },
                        gastronomia:{ tiktok: 'restaurantes locales',ig: 'food' },
                        relax:      { tiktok: 'spa relax',           ig: 'wellness' },
                        naturaleza: { tiktok: 'naturaleza hiking',   ig: 'nature' },
                        nocturna:   { tiktok: 'vida nocturna bares', ig: 'nightlife' },
                        deporte:    { tiktok: 'deportes outdoor',    ig: 'sports' },
                        shopping:   { tiktok: 'shopping mercados',   ig: 'shopping' },
                      };
                      const ints = formData?.intereses || [];
                      const kw1 = ints[0] ? (ikMap[ints[0]]?.tiktok || ints[0]) : 'restaurantes locales';
                      const kw2 = ints[1] ? (ikMap[ints[1]]?.tiktok || ints[1]) : 'hidden gems';
                      const ig1 = ints[0] ? (ikMap[ints[0]]?.ig    || ints[0]) : 'food';
                      const ig2 = ints[1] ? (ikMap[ints[1]]?.ig    || ints[1]) : 'travel';
                      return [
                        { plat: '🎵 TikTok', label: `${destRaw} ${kw1}`, url: `https://www.tiktok.com/search?q=${encodeURIComponent(destRaw + ' ' + kw1)}`, color: '#010101' },
                        { plat: '🎵 TikTok', label: `${destRaw} ${kw2}`, url: `https://www.tiktok.com/search?q=${encodeURIComponent(destRaw + ' ' + kw2)}`, color: '#010101' },
                        { plat: '📸 Instagram', label: `#${destTag}${ig1}`, url: `https://www.instagram.com/explore/tags/${destTag}${ig1}/`, color: '#E1306C' },
                        { plat: '📸 Instagram', label: `#${destTag}${ig2}`, url: `https://www.instagram.com/explore/tags/${destTag}${ig2}/`, color: '#E1306C' },
                      ];
                    })().map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : '#fff' }}>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{row.plat}</td>
                        <td style={{ padding: '11px 12px', color: '#555', fontSize: 13 }}>{row.label}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <BtnLink href={row.url} small color={row.color}>Ver →</BtnLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>
          </div>
        )}

        {/* ══ PRO: TRANSPORTE ══════════════════════════════════════════════════ */}
        {isPro && (
          <div className="vivante-section print-break" style={{ display: show('transporte') ? 'block' : 'none' }}>
            {itinerario?.transporte_local && (
              <Sec title="🚇 Transporte Local">
                {[
                  ['¿Cómo moverse?', itinerario.transporte_local.como_moverse],
                  ['Apps recomendadas', (itinerario.transporte_local.apps_recomendadas || []).join(', ')],
                  ['Tarjeta de transporte', itinerario.transporte_local.tarjeta_transporte],
                  ['¿Alquilar auto?', itinerario.transporte_local.conviene_auto],
                ].filter(r => r[1]).map(([l, v], i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13 }}>{l}</p>
                    <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{v}</p>
                  </div>
                ))}
                {/* Aeropuerto → Centro: tabla si viene como array, texto si es string legacy */}
                {(() => {
                  const t = itinerario.transporte_local;
                  const opciones = Array.isArray(t.opciones_aeropuerto_centro) && t.opciones_aeropuerto_centro.length > 0
                    ? t.opciones_aeropuerto_centro : null;
                  const fallback = t.costo_aeropuerto_centro;
                  if (!opciones && !fallback) return null;
                  return (
                    <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 700, color: C.coral, fontSize: 13 }}>✈️ Aeropuerto → Centro</p>
                      {opciones ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: C.bg1 }}>
                                {['Medio', 'Costo estimado', 'Duración', 'Tip'].map(h => (
                                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: C.carbon, fontWeight: 700, fontSize: 12 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {opciones.map((op, oi) => (
                                <tr key={oi} style={{ background: oi % 2 === 0 ? C.bg0 : '#fff' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: 600, color: C.carbon }}>{op.medio}</td>
                                  <td style={{ padding: '8px 10px', color: C.coral, fontWeight: 700 }}>{op.costo}</td>
                                  <td style={{ padding: '8px 10px', color: '#666' }}>{op.duracion || '—'}</td>
                                  <td style={{ padding: '8px 10px', color: C.violeta, fontStyle: 'italic', fontSize: 12 }}>{op.tip || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{fallback}</p>
                      )}
                    </div>
                  );
                })()}
              </Sec>
            )}
          </div>
        )}

        {/* ══ PRO: CONECTIVIDAD ════════════════════════════════════════════════ */}
        {isPro && (
          <div className="vivante-section print-break" style={{ display: show('conectividad') ? 'block' : 'none' }}>
            {itinerario?.conectividad && (
              <Sec title="📱 Conectividad">
                {[
                  ['eSIM recomendada', itinerario.conectividad.esim_recomendada],
                ].filter(r => r[1]).map(([l, v], i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13 }}>{l}</p>
                    <p style={{ margin: '0 0 8px', color: C.carbon, fontSize: 14 }}>{v}</p>
                    {l === 'eSIM recomendada' && (
                      <a href="https://airalo.tpx.lt/UPNJmvRR" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', background: '#1a1a2e', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        📲 Comprar eSIM en Airalo →
                      </a>
                    )}
                  </div>
                ))}
                {[
                  ['SIM local', itinerario.conectividad.sim_local],
                  ['Roaming', itinerario.conectividad.roaming],
                  ['WiFi en destino', itinerario.conectividad.wifi_destino],
                  ['Apps a descargar', (itinerario.conectividad.apps_descargar || []).join(', ')],
                ].filter(r => r[1]).map(([l, v], i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13 }}>{l}</p>
                    <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{v}</p>
                  </div>
                ))}
              </Sec>
            )}
            {isPro && itinerario?.festivos_horarios && (
              <Sec title="📅 Festivos y Horarios">
                {Object.entries(itinerario.festivos_horarios).filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</p>
                    <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{v}</p>
                  </div>
                ))}
              </Sec>
            )}
            {isPro && itinerario?.salud_seguridad && (
              <Sec title="🏥 Salud y Seguridad">
                {[
                  ['Vacunas', itinerario.salud_seguridad.vacunas],
                  ['Agua potable', itinerario.salud_seguridad.agua_potable],
                  ['Nivel de seguridad', itinerario.salud_seguridad.nivel_seguridad],
                  ['Zonas a evitar', itinerario.salud_seguridad.zonas_evitar],
                  ['Estafas comunes', itinerario.salud_seguridad.estafas_comunes],
                ].filter(r => r[1]).map(([l, v], i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.coral, fontSize: 13 }}>{l}</p>
                    <p style={{ margin: 0, color: C.carbon, fontSize: 14 }}>{v}</p>
                  </div>
                ))}
              </Sec>
            )}
            {isPro && itinerario?.idioma_cultura && (
              <Sec title="🗣️ Idioma y Cultura" bg={C.violeta}>
                <p style={{ margin: '0 0 8px', color: C.carbon, fontSize: 14 }}><strong>Costumbres:</strong> {itinerario.idioma_cultura.costumbres}</p>
                <p style={{ margin: '0 0 12px', color: C.carbon, fontSize: 14 }}><strong>Vestimenta:</strong> {itinerario.idioma_cultura.vestimenta}</p>
                {itinerario.idioma_cultura.frases_utiles?.length > 0 && (
                  <>
                    <p style={{ fontWeight: 700, color: C.carbon, marginBottom: 8, fontSize: 14 }}>Frases útiles:</p>
                    {itinerario.idioma_cultura.frases_utiles.map((f, i) => (
                      <div key={i} style={{ background: '#F5F0FF', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                        <strong style={{ color: C.violeta }}>{f.frase_local}</strong>
                        {f.pronunciacion && <span style={{ color: '#888', fontSize: 12 }}> ({f.pronunciacion})</span>}
                        {f.significado && <span style={{ color: C.carbon, fontSize: 13 }}> → {f.significado}</span>}
                      </div>
                    ))}
                  </>
                )}
              </Sec>
            )}
          </div>
        )}

        {/* ══ PRO: QUÉ EMPACAR ═════════════════════════════════════════════════ */}
        {isPro && (
          <div className="vivante-section print-break" style={{ display: show('empacar') ? 'block' : 'none' }}>
            {itinerario?.que_empacar ? (
              <>
                <Sec title="🌤️ Clima Esperado en tus Fechas" bg={C.violeta}>
                  <p style={{ color: C.carbon, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{itinerario.que_empacar.clima_esperado}</p>
                </Sec>
                <Sec title="👕 Ropa a Empacar">
                  <div style={{ columns: 1 }}>
                    {(itinerario.que_empacar.ropa || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.bg1}` }}>
                        <span style={{ width: 18, height: 18, border: `2px solid ${C.coral}`, borderRadius: 4, flexShrink: 0, marginTop: 2, display: 'inline-block' }} />
                        <span style={{ color: C.carbon, fontSize: 14 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </Sec>
                <Sec title="🔌 Adaptador de Enchufe">
                  <p style={{ color: C.carbon, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{itinerario.que_empacar.adaptador_enchufe}</p>
                </Sec>
                <Sec title="🩺 Botiquín Básico" bg={C.fucsia}>
                  {(itinerario.que_empacar.botiquin || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid #FFD0E8` }}>
                      <span style={{ fontSize: 16 }}>💊</span>
                      <span style={{ color: C.carbon, fontSize: 14 }}>{item}</span>
                    </div>
                  ))}
                </Sec>
                <Sec title="🔋 Power Bank">
                  <p style={{ color: C.carbon, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{itinerario.que_empacar.power_bank}</p>
                </Sec>
              </>
            ) : (
              <Sec title="🎒 Qué Empacar">
                <p style={{ color: '#888', fontStyle: 'italic' }}>Esta sección estará disponible en tu próximo itinerario.</p>
              </Sec>
            )}
          </div>
        )}

        {/* ══ IMPERDIBLE ═══════════════════════════════════════════════════════ */}
        <div className="vivante-section print-break" style={{ display: show('imperdible') ? 'block' : 'none' }}>
          <Sec title="⭐ Lo Imperdible" bg={C.fucsia}>
            {(itinerario?.lo_imperdible || []).map((item, i) => (
              <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < (itinerario.lo_imperdible.length - 1) ? `1px solid #FFD0E8` : 'none' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: C.carbon, fontSize: 16 }}>{i + 1}. {item.nombre}</p>
                <p style={{ margin: 0, color: '#555', fontSize: 14, lineHeight: 1.6 }}>{item.descripcion}</p>
              </div>
            ))}
          </Sec>

          {isPro && itinerario?.extras?.length > 0 && (
            <Sec title="🎯 Más Cosas Para Hacer">
              {itinerario.extras.map((ex, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: C.coral }}>{ex.categoria}</p>
                  {(ex.actividades || []).map((a, j) => (
                    <p key={j} style={{ margin: '0 0 4px', color: C.carbon, fontSize: 14, paddingLeft: 12, borderLeft: `2px solid ${C.bg1}` }}>• {a}</p>
                  ))}
                </div>
              ))}
            </Sec>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: C.coral, padding: '32px 20px', textAlign: 'center', marginTop: 12 }}>
        <img src="/images/vivante_logo.svg" alt="VIVANTE" style={{ height: 64, width: 'auto', marginBottom: 10 }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <span style={{ display: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>VIVANTE</span>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 12px', fontSize: 15 }}>
          ¡Que tengas el viaje de tu vida, {formData?.nombre}! ✈️
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>
          <a href="https://www.vivante.com" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>www.vivante.com</a>
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
        <p style={{ color: '#FF6332', fontFamily: 'Syne, sans-serif', fontSize: 18 }}>Cargando tu itinerario... ✈️</p>
      </div>
    }>
      <ItinerarioContent />
    </Suspense>
  );
}
