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
};

function UpgradeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    // Reconstruir formData desde los params de la URL (enviados por Brevo)
    const n    = searchParams.get('n')    || '';
    const e    = searchParams.get('e')    || '';
    const dest = searchParams.get('dest') || '';
    const orig = searchParams.get('orig') || '';
    const dias = parseInt(searchParams.get('dias') || '7', 10);
    const pax  = parseInt(searchParams.get('pax')  || '1', 10);
    const fs   = searchParams.get('fs')   || '';
    const fr   = searchParams.get('fr')   || '';
    const intStr = searchParams.get('int') || '';
    const pre  = searchParams.get('pre')  || '';
    const tv   = searchParams.get('tv')   || '';
    const al   = searchParams.get('al')   || '';
    const rt   = parseInt(searchParams.get('rt') || '3', 10);

    if (!n || !e) return; // sin datos válidos → no hacer nada

    const fd = {
      nombre:       n,
      email:        e,
      destino:      dest,
      origen:       orig,
      dias,
      numViajeros:  pax,
      fechaSalida:  fs,
      fechaRegreso: fr,
      intereses:    intStr ? intStr.split(',').filter(Boolean) : [],
      presupuesto:  pre ? Number(pre) : undefined,
      tipoViaje:    tv,
      alojamiento:  al,
      ritmo:        rt,
      tieneDestino: dest ? true : null,
    };
    setFormData(fd);

    // Guardar en localStorage para que pago-exitoso lo use tras el pago
    try {
      localStorage.setItem('vivante_formData', JSON.stringify(fd));
    } catch {}
  }, [searchParams]);

  const handlePagar = async () => {
    if (!formData) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/upsell-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:  formData.email,
          nombre: formData.nombre,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setError('No se pudo iniciar el pago. Intenta de nuevo.');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const nombre = formData?.nombre || searchParams.get('n') || '';
  const destino = formData?.destino || searchParams.get('dest') || 'tu destino';

  return (
    <div style={{ minHeight: '100vh', background: C.crema, fontFamily: 'Inter, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;600&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* HEADER */}
      <div style={{ background: C.coral, padding: '20px 24px', textAlign: 'center' }}>
        <img src="/images/vivante_logo.svg" alt="VIVANTE" style={{ height: 48, width: 'auto' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <span style={{ display: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800 }}>VIVANTE</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>

        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${C.coral}, ${C.fucsia})`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 24, color: '#fff' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.2 }}>
            {nombre ? `${nombre}, lleva tu viaje` : 'Lleva tu viaje'} a <em>otro nivel</em>
          </h1>
          <p style={{ fontSize: 15, opacity: 0.95, margin: '0 0 6px', lineHeight: 1.6 }}>
            Mejora a <strong>VIVANTE Pro</strong> por solo <strong>$7 más</strong>
            {destino && destino !== 'tu destino' ? ` y descubre todo lo que preparamos para ${destino}.` : '.'}
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: C.carbon, fontSize: 17, margin: '0 0 18px' }}>
            ✨ ¿Qué incluye VIVANTE Pro?
          </p>
          {[
            ['🍸', 'Bares y vida nocturna',      '2 opciones por ciudad, con tips de insider'],
            ['📱', 'Recomendaciones de RRSS',    'TikToks e Instagrams reales del destino'],
            ['🚇', 'Transporte local completo',  'Apps, tarjetas, costos aeropuerto→centro'],
            ['🎒', 'Qué empacar',                'Lista personalizada según el clima y las fechas'],
            ['🔌', 'Conectividad',               'eSIM, SIM local, roaming y apps esenciales'],
            ['🏥', 'Salud y seguridad',          'Vacunas, zonas a evitar, estafas comunes'],
            ['🗣️', 'Idioma y cultura',           'Frases útiles, costumbres, vestimenta'],
            ['⭐', 'Lo imperdible expandido',    'Más cosas para hacer según tus intereses'],
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.carbon, fontSize: 14 }}>{title}</p>
                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PRECIO Y BOTÓN */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', color: '#888', fontSize: 13, textDecoration: 'line-through' }}>Valor normal: $17</p>
          <p style={{ margin: '0 0 4px', fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: C.coral }}>Solo $7 más</p>
          <p style={{ margin: '0 0 20px', color: '#666', fontSize: 13 }}>Pago único · Acceso inmediato · Sin suscripción</p>

          {error && (
            <div style={{ background: '#fff0eb', border: `1px solid ${C.coral}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.coral, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePagar}
            disabled={loading || !formData}
            style={{
              width: '100%', background: loading ? '#ccc' : `linear-gradient(135deg, ${C.coral}, ${C.fucsia})`,
              color: '#fff', border: 'none', padding: '16px', borderRadius: 12,
              fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800,
              cursor: loading || !formData ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Redirigiendo a pago...' : '🚀 Mejorar a Pro por $7 →'}
          </button>

          {!formData && (
            <p style={{ margin: '12px 0 0', color: '#aaa', fontSize: 12 }}>
              Este link es personalizado. Si no funciona escríbenos a{' '}
              <a href="mailto:vive.vivante.ch@gmail.com" style={{ color: C.coral }}>vive.vivante.ch@gmail.com</a>
            </p>
          )}

          <p style={{ margin: '14px 0 0', color: '#aaa', fontSize: 12 }}>
            🔒 Pago seguro con MercadoPago
          </p>
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: C.carbon, padding: '20px', textAlign: 'center', marginTop: 12 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
          VIVANTE ·{' '}
          <a href="https://vivevivante.com" style={{ color: 'rgba(255,255,255,0.5)' }}>vivevivante.com</a>
        </p>
      </div>
    </div>
  );
}

export default function UpgradePro() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#FCF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#FF6332', fontFamily: 'Syne, sans-serif', fontSize: 18 }}>Cargando... ✈️</p>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
