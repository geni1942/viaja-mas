import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ─── Helper: HTML del email de confirmación ───────────────────────────────────
function buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tu itinerario VIVANTE</title>
</head>
<body style="margin:0;padding:0;background:#FCF8F4;font-family:Arial,sans-serif;color:#212529;">
<div style="max-width:640px;margin:0 auto;background:#FCF8F4;">

  <div style="background:#FF6332;padding:28px;text-align:center;">
    <img src="https://vivevivante.com/images/vivante_logo.svg" alt="VIVANTE" style="height:52px;width:auto;" onerror="this.style.display='none'"/>
    <p style="color:#fff;font-size:13px;margin:6px 0 0;letter-spacing:2px;">VIAJA MÁS. PLANIFICA MENOS.</p>
  </div>

  <div style="padding:32px;">
    <h1 style="font-size:24px;color:#212529;margin:0 0 8px;">
      ¡Hola, ${formData.nombre}! ✈️
    </h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 6px;">
      Tu plan <strong style="color:#FF6332;">${planLabel}</strong> está listo.
    </p>
    ${fechaTexto ? `<p style="color:#6F42C1;font-style:italic;font-size:14px;margin:0 0 20px;">📅 ${fechaTexto}</p>` : ''}

    <div style="background:#FFF0EB;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="color:#FF6332;font-size:18px;margin:0 0 12px;">📊 Resumen</h2>
      <p style="margin:4px 0;"><strong>Destino:</strong> ${itinerario.resumen?.destino || formData.destino}</p>
      <p style="margin:4px 0;"><strong>Duración:</strong> ${formData.dias} días · ${formData.numViajeros} viajero${formData.numViajeros > 1 ? 's' : ''}</p>
      <p style="margin:4px 0;"><strong>Fecha de ida:</strong> ${itinerario.resumen?.fecha_salida || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Fecha de vuelta:</strong> ${itinerario.resumen?.fecha_regreso || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Presupuesto estimado:</strong> ${itinerario.presupuesto_desglose?.total || ''}</p>
    </div>

    <div style="background:#FF6332;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#fff;font-size:14px;margin:0 0 8px;">Tu itinerario completo está adjunto como PDF en este correo.</p>
      <p style="color:#fff;font-size:13px;font-style:italic;margin:0;">¿Problemas? Escribinos a <a href="mailto:vive.vivante.ch@gmail.com" style="color:#FFE0D0;">vive.vivante.ch@gmail.com</a></p>
    </div>

    ${(itinerario.dias || []).slice(0, 3).map(dia => `
    <div style="border-left:4px solid #FF6332;padding:12px 16px;margin-bottom:16px;background:#FFF8F5;border-radius:0 8px 8px 0;">
      <p style="font-weight:700;color:#FF6332;margin:0 0 6px;">Día ${dia.numero}: ${dia.titulo}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">🌅 ${dia.manana?.actividad || ''}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">🌞 ${dia.tarde?.almuerzo || ''}</p>
      <p style="margin:0;color:#6F42C1;font-size:12px;font-style:italic;">💰 ${dia.gasto_dia || ''}</p>
    </div>`).join('')}
    ${(itinerario.dias || []).length > 3 ? `<p style="text-align:center;color:#888;font-size:13px;">... y ${itinerario.dias.length - 3} días más en tu itinerario completo (ver PDF adjunto)</p>` : ''}

  </div>

  <div style="background:#FF6332;padding:32px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 16px;">
      ${itinerario.subtitulo || `Solo falta hacer la maleta, ${formData.nombre}. ✈️`}
    </p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
      <a href="https://vivevivante.com" style="color:rgba(255,255,255,0.85);">vivevivante.com</a> ·
      <a href="https://instagram.com/vive.vivante" style="color:rgba(255,255,255,0.85);">@vive.vivante</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

// ─── Helper: Generar PDF del itinerario con pdfmake ───────────────────────────
async function generateItinerarioPdf(itinerario, formData, planLabel) {
  try {
    // pdfmake/build/pdfmake.js funciona en Node.js y en el browser (API unificada).
    // Importamos el bundle completo y le asignamos el VFS con las fuentes Roboto.
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');
    const vfsFonts = vfsFontsModule.default || vfsFontsModule;
    pdfMake.vfs = vfsFonts?.pdfMake?.vfs || vfsFonts?.vfs || {};
    const coral   = '#FF6332';
    const carbon  = '#212529';
    const purple  = '#6F42C1';
    const content = [];

    // ── Encabezado ──
    content.push({ text: 'VIVANTE', fontSize: 28, bold: true, color: coral, alignment: 'center', margin: [0, 0, 0, 2] });
    content.push({ text: 'VIAJÁ MÁS. PLANIFICÁ MENOS.', fontSize: 9, color: '#888', alignment: 'center', margin: [0, 0, 0, 6] });
    content.push({ text: planLabel, fontSize: 10, bold: true, color: coral, alignment: 'center', margin: [0, 0, 0, 8] });
    if (itinerario.titulo)    content.push({ text: itinerario.titulo,    fontSize: 18, bold: true,   color: carbon, margin: [0, 0, 0, 4] });
    if (itinerario.subtitulo) content.push({ text: itinerario.subtitulo, fontSize: 13, italics: true, color: '#555', margin: [0, 0, 0, 14] });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: coral }], margin: [0, 0, 0, 14] });

    // ── Resumen ──
    const resumen = itinerario.resumen || {};
    content.push({ text: 'RESUMEN', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
    const resumenRows = [
      resumen.destino || formData.destino   ? ['Destino',              resumen.destino || formData.destino]               : null,
      resumen.origen  || formData.origen    ? ['Origen',               resumen.origen  || formData.origen]                : null,
      resumen.fecha_salida                  ? ['Fecha de ida',         resumen.fecha_salida]                              : null,
      resumen.fecha_regreso                 ? ['Fecha de vuelta',      resumen.fecha_regreso]                             : null,
      formData.dias                         ? ['Duración',             `${formData.dias} días`]                          : null,
      formData.numViajeros                  ? ['Viajeros',             String(formData.numViajeros)]                      : null,
      resumen.fecha_optima_texto            ? ['Mejor época',          resumen.fecha_optima_texto]                        : null,
      itinerario.presupuesto_desglose?.total? ['Presupuesto estimado', itinerario.presupuesto_desglose.total]             : null,
    ].filter(Boolean);
    if (resumenRows.length) {
      content.push({
        table: { widths: [140, '*'], body: resumenRows.map(([k, v]) => [{ text: k, bold: true, fontSize: 10 }, { text: v, fontSize: 10 }]) },
        layout: 'lightHorizontalLines', margin: [0, 0, 0, 18],
      });
    }

    // ── Días ──
    if (itinerario.dias?.length) {
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 0, 0, 14] });
      content.push({ text: 'ITINERARIO DÍA A DÍA', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 10] });
      itinerario.dias.forEach(dia => {
        content.push({ text: `Día ${dia.numero}: ${dia.titulo || ''}`, fontSize: 12, bold: true, color: coral, margin: [0, 0, 0, 5] });
        const rows = [
          dia.manana?.actividad  ? `🌅 Mañana: ${dia.manana.actividad}`     : null,
          dia.manana?.desayuno   ? `☕ Desayuno: ${dia.manana.desayuno}`    : null,
          dia.tarde?.actividad   ? `🌞 Tarde: ${dia.tarde.actividad}`       : null,
          dia.tarde?.almuerzo    ? `🍽 Almuerzo: ${dia.tarde.almuerzo}`    : null,
          dia.noche?.actividad   ? `🌙 Noche: ${dia.noche.actividad}`      : null,
          dia.noche?.cena        ? `🍷 Cena: ${dia.noche.cena}`            : null,
        ].filter(Boolean);
        rows.forEach(r => content.push({ text: r, fontSize: 10, margin: [10, 0, 0, 2] }));
        if (dia.alojamiento?.nombre) {
          const al = dia.alojamiento;
          content.push({ text: `🏨 Alojamiento: ${al.nombre}${al.tipo ? ` (${al.tipo})` : ''}${al.precio ? ` – ${al.precio}` : ''}`, fontSize: 10, color: purple, margin: [10, 0, 0, 2] });
        }
        if (dia.gasto_dia) content.push({ text: `💰 Gasto del día: ${dia.gasto_dia}`, fontSize: 10, color: '#777', italics: true, margin: [10, 0, 0, 2] });
        if (dia.tip_local)  content.push({ text: `💡 Tip local: ${dia.tip_local}`, fontSize: 10, color: purple, italics: true, margin: [10, 0, 0, 2] });
        content.push({ text: '', margin: [0, 0, 0, 8] });
      });
    }

    // ── Secciones Pro ──
    const sep = () => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 6, 0, 10] });

    if (itinerario.bares_vida_nocturna?.length) {
      content.push(sep());
      content.push({ text: '🍺 BARES Y VIDA NOCTURNA', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      itinerario.bares_vida_nocturna.forEach(b => content.push({ text: `• ${b.nombre || ''}${b.tipo ? ` (${b.tipo})` : ''}${b.descripcion ? ` – ${b.descripcion}` : ''}`, fontSize: 10, margin: [8, 0, 0, 3] }));
    }
    if (itinerario.transporte_local) {
      content.push(sep());
      content.push({ text: '🚌 TRANSPORTE LOCAL', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const tl = itinerario.transporte_local;
      if (tl.opciones?.length) tl.opciones.forEach(o => content.push({ text: `• ${o.tipo || ''}: ${o.descripcion || ''}${o.costo_aprox ? ` (${o.costo_aprox})` : ''}`, fontSize: 10, margin: [8, 0, 0, 3] }));
      if (tl.consejo) content.push({ text: `💡 ${tl.consejo}`, fontSize: 10, italics: true, color: purple, margin: [8, 4, 0, 0] });
    }
    if (itinerario.conectividad) {
      content.push(sep());
      content.push({ text: '📱 CONECTIVIDAD', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const co = itinerario.conectividad;
      if (co.esim_recomendada) content.push({ text: `📡 eSIM recomendada: ${co.esim_recomendada}${co.esim_precio ? ` – ${co.esim_precio}` : ''}`, fontSize: 10, margin: [8, 0, 0, 3] });
      if (co.operador_local)   content.push({ text: `📞 Operador local: ${co.operador_local}`,    fontSize: 10, margin: [8, 0, 0, 3] });
    }
    if (itinerario.festivos_horarios) {
      content.push(sep());
      content.push({ text: '📅 FESTIVOS Y HORARIOS', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const fh = itinerario.festivos_horarios;
      if (fh.advertencia) content.push({ text: fh.advertencia, fontSize: 10, margin: [8, 0, 0, 3] });
      if (fh.horario_comercios) content.push({ text: `Horario comercios: ${fh.horario_comercios}`, fontSize: 10, margin: [8, 0, 0, 3] });
    }
    if (itinerario.salud_seguridad) {
      content.push(sep());
      content.push({ text: '🏥 SALUD Y SEGURIDAD', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const ss = itinerario.salud_seguridad;
      if (ss.vacunas_recomendadas?.length) content.push({ text: `Vacunas: ${ss.vacunas_recomendadas.join(', ')}`, fontSize: 10, margin: [8, 0, 0, 3] });
      if (ss.zonas_evitar?.length)         content.push({ text: `Zonas a evitar: ${ss.zonas_evitar.join(', ')}`, fontSize: 10, color: '#c0392b', margin: [8, 0, 0, 3] });
      if (ss.emergencias) {
        const em = ss.emergencias;
        const emTxt = [em.policia && `Policía: ${em.policia}`, em.ambulancia && `Ambulancia: ${em.ambulancia}`, em.bomberos && `Bomberos: ${em.bomberos}`].filter(Boolean).join(' · ');
        if (emTxt) content.push({ text: `Emergencias: ${emTxt}`, fontSize: 10, margin: [8, 0, 0, 3] });
      }
    }
    if (itinerario.idioma_cultura?.frases_utiles?.length) {
      content.push(sep());
      content.push({ text: '🗣 IDIOMA Y CULTURA', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      itinerario.idioma_cultura.frases_utiles.slice(0, 8).forEach(f => content.push({ text: `• "${f.frase || ''}" → ${f.traduccion || ''}`, fontSize: 10, margin: [8, 0, 0, 3] }));
    }
    if (itinerario.que_empacar) {
      content.push(sep());
      content.push({ text: '🧳 QUÉ EMPACAR', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const qe = itinerario.que_empacar;
      if (qe.esencial?.length)    content.push({ text: `Esencial: ${qe.esencial.join(', ')}`,       fontSize: 10, margin: [8, 0, 0, 3] });
      if (qe.recomendado?.length) content.push({ text: `Recomendado: ${qe.recomendado.join(', ')}`, fontSize: 10, margin: [8, 0, 0, 3] });
    }
    if (itinerario.presupuesto_desglose) {
      content.push(sep());
      content.push({ text: '💰 PRESUPUESTO ESTIMADO', fontSize: 13, bold: true, color: coral, margin: [0, 0, 0, 8] });
      const pd = itinerario.presupuesto_desglose;
      const budgetRows = [
        pd.alojamiento ? ['Alojamiento', pd.alojamiento] : null,
        pd.comidas     ? ['Comidas',     pd.comidas]     : null,
        pd.transporte  ? ['Transporte',  pd.transporte]  : null,
        pd.actividades ? ['Actividades', pd.actividades] : null,
        pd.extras      ? ['Extras',      pd.extras]      : null,
        pd.total       ? ['TOTAL',       pd.total]       : null,
      ].filter(Boolean);
      if (budgetRows.length) {
        content.push({
          table: { widths: [150, '*'], body: budgetRows.map(([k, v]) => [{ text: k, bold: k === 'TOTAL', fontSize: 10, color: k === 'TOTAL' ? coral : carbon }, { text: v, bold: k === 'TOTAL', fontSize: 10, color: k === 'TOTAL' ? coral : carbon }]) },
          layout: 'lightHorizontalLines', margin: [0, 0, 0, 16],
        });
      }
    }

    // ── Pie ──
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: coral }], margin: [0, 6, 0, 10] });
    content.push({ text: 'VIVANTE · vivevivante.com · @vive.vivante', fontSize: 9, color: '#888', alignment: 'center' });

    const docDefinition = {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 11, color: carbon },
      pageMargins: [40, 50, 40, 50],
      info: { title: itinerario.titulo || 'Itinerario VIVANTE', author: 'VIVANTE' },
    };

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
      try {
        pdfMake.createPdf(docDefinition).getBase64((base64data) => {
          clearTimeout(timeout);
          resolve(base64data);
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  } catch (e) {
    console.error('PDF generation error:', e.message);
    return null;
  }
}

// ─── A: Tabla de contexto de viaje por origen→destino ────────────────────────
// Devuelve texto con info de visa/pasaporte y adaptador para inyectar en el checklist
function getCountryTravelContext(origenStr, destinoStr) {
  const o = (origenStr || '').toLowerCase();
  const d = (destinoStr || '').toLowerCase();

  const isChile     = o.includes('chile') || o.includes('santiago') || o.includes('scl') || o.includes('valparaíso') || o.includes('valparaiso') || o.includes('concepción') || o.includes('concepcion');
  const isArgentina = o.includes('argentin') || o.includes('buenos aires') || o.includes('córdoba') || o.includes('cordoba') || o.includes('rosario') || o.includes('mendoza') || o.includes('bariloche') || o.includes('salta') || o.includes('tucumán') || o.includes('tucuman');
  const isBrasil    = o.includes('brasil') || o.includes('brazil') || o.includes('são paulo') || o.includes('sao paulo') || o.includes('rio de janeiro') || o.includes('brasília') || o.includes('brasilia') || o.includes('porto alegre') || o.includes('florianópolis') || o.includes('florianopolis') || o.includes('belo horizonte') || o.includes('salvador') || o.includes('fortaleza') || o.includes('recife');
  const isColombia  = o.includes('colombia') || o.includes('bogotá') || o.includes('bogota') || o.includes('medellín') || o.includes('medellin') || o.includes('cali') || o.includes('cartagena de indias') || o.includes('barranquilla') || o.includes('bucaramanga');
  const isMexico    = (o.includes('méxico') || o.includes('mexico')) && !o.includes('nuevo mexico') || o.includes('ciudad de méxico') || o.includes('cdmx') || o.includes('guadalajara') || o.includes('monterrey') || o.includes('cancún') || o.includes('cancun') || o.includes('puebla') || o.includes('tijuana');
  const isPerú      = o.includes('perú') || o.includes('peru') || o.includes('lima') || o.includes('arequipa') || o.includes('cusco') || o.includes('trujillo') || o.includes('piura') || o.includes('iquitos');
  const isUruguay   = o.includes('uruguay') || o.includes('montevideo') || o.includes('punta del este') || o.includes('salto') || o.includes('colonia del sacramento');
  const isEcuador   = o.includes('ecuador') || o.includes('quito') || o.includes('guayaquil') || o.includes('cuenca') || o.includes('manta') || o.includes('loja');

  // ── Adaptador de enchufe según destino ──────────────────────────────────
  let adapterInfo = '';
  if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('usa') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('boston') || d.includes('san francisco') || d.includes('washington') || d.includes('orlando') || d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal') || d.includes('méxico') || d.includes('mexico') || d.includes('colombia') || d.includes('bogotá') || d.includes('bogota') || d.includes('medellín') || d.includes('medellin') || d.includes('cartagena') || d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('ecuador') || d.includes('quito') || d.includes('venezuela') || d.includes('cuba') || d.includes('habana'))
    adapterInfo = 'Tipo A/B (2 patas planas) — estándar de EE.UU., Canadá, México y varios países latinoamericanos';
  else if (d.includes('europa') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berlín') || d.includes('grecia') || d.includes('atenas') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('bélgica') || d.includes('belgica') || d.includes('bruselas') || d.includes('suecia') || d.includes('estocolmo') || d.includes('noruega') || d.includes('oslo') || d.includes('dinamarca') || d.includes('copenhague') || d.includes('suiza') || d.includes('zurich') || d.includes('austria') || d.includes('viena') || d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul') || d.includes('rusia') || d.includes('moscú') || d.includes('croacia') || d.includes('zagreb') || d.includes('hungría') || d.includes('hungria') || d.includes('budapest') || d.includes('polonia') || d.includes('varsovia') || d.includes('república checa') || d.includes('republica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('sevilla') || d.includes('florencia') || d.includes('venecia') || d.includes('milan') || d.includes('milán') || d.includes('nápoles') || d.includes('napoles') || d.includes('amsterdam') || d.includes('frankfurt'))
    adapterInfo = 'Adaptador Tipo C/E/F (2 patas redondas) — necesario en casi toda Europa continental';
  else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london') || d.includes('irlanda') || d.includes('dublin') || d.includes('hong kong') || d.includes('singapur') || d.includes('singapore') || d.includes('malasia') || d.includes('malaysia') || d.includes('kuala lumpur'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) — Reino Unido, Hong Kong, Singapur y Malasia';
  else if (d.includes('australia') || d.includes('sídney') || d.includes('sydney') || d.includes('melbourne') || d.includes('brisbane') || d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
    adapterInfo = 'Tipo I (2 patas en V) — Australia y Nueva Zelanda. También usado en Chile y Argentina';
  else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo') || d.includes('salvador') || d.includes('florianópolis') || d.includes('florianopolis') || d.includes('iguazú') || d.includes('iguazu') || d.includes('foz do iguaçu'))
    adapterInfo = 'Tipo N (2 patas redondas) — estándar propio de Brasil, diferente del resto de Sudamérica';
  else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('tokio') || d.includes('osaka') || d.includes('kyoto') || d.includes('hiroshima') || d.includes('nara') || d.includes('sapporo'))
    adapterInfo = 'Adaptador Tipo A (2 patas planas, 110V) — Japón usa 110V. Verifica que tus dispositivos soporten 110-240V';
  else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai') || d.includes('chengdu') || d.includes('canton') || d.includes('guangzhou'))
    adapterInfo = 'Adaptador universal recomendado — China acepta varios tipos de enchufe (A, C, I)';
  else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa') || d.includes('bangalore') || d.includes('jaipur'))
    adapterInfo = 'Adaptador universal recomendado — India usa tipos C, D y M según la zona';
  else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai') || d.includes('bali') || d.includes('indonesia') || d.includes('jakarta') || d.includes('vietnam') || d.includes('hanoi') || d.includes('ho chi minh') || d.includes('camboya') || d.includes('siem reap'))
    adapterInfo = 'Adaptador universal recomendado — el Sudeste Asiático tiene múltiples estándares de enchufe';
  else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche') || d.includes('córdoba') || d.includes('cordoba') || d.includes('salta') || d.includes('uruguay') || d.includes('montevideo') || d.includes('paraguay') || d.includes('asunción') || d.includes('asuncion'))
    adapterInfo = 'Tipo L (2 patas en V) — estándar de Chile, Argentina, Uruguay y Paraguay';
  else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi') || d.includes('qatar') || d.includes('doha'))
    adapterInfo = 'Adaptador Tipo G o C — Emiratos y Qatar. Mejor llevar adaptador universal';
  else if (d.includes('sudáfrica') || d.includes('sudafrica') || d.includes('cape town') || d.includes('ciudad del cabo') || d.includes('johannesburg') || d.includes('johannesburgo'))
    adapterInfo = 'Adaptador Tipo M (3 patas gruesas) — Sudáfrica tiene su propio estándar';
  else if (d.includes('marruecos') || d.includes('marrakech') || d.includes('fez') || d.includes('casablanca') || d.includes('tánger'))
    adapterInfo = 'Adaptador Tipo C/E (2 patas redondas) — igual que Europa continental';
  else if (d.includes('kenia') || d.includes('kenya') || d.includes('nairobi') || d.includes('mombasa'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) — Kenia usa el estándar británico';
  else if (d.includes('maldivas') || d.includes('maldives') || d.includes('islas maldivas'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) — Maldivas usa estándar británico';
  else
    adapterInfo = 'Adaptador universal recomendado — verifica el tipo de enchufe específico del país de destino';

  // ── Visa / Pasaporte para viajeros chilenos ──────────────────────────────
  let visaInfo = '';
  if (isChile) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('boston') || d.includes('san francisco') || d.includes('washington') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + ESTA: Los chilenos viajan SIN VISA a EE.UU. pero necesitan ESTA (Electronic System for Travel Authorization, ~US$21). Tramítala en esta-online.us con al menos 72h de anticipación. Pasaporte vigente obligatorio.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal') || d.includes('ottawa') || d.includes('calgary'))
      visaInfo = 'PASAPORTE + eTA: Los chilenos necesitan eTA para Canadá (Electronic Travel Authorization, ~CAD$7), tramitable online en canada.ca. No es visa, se aprueba en minutos. Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berlín') || d.includes('grecia') || d.includes('atenas') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('bélgica') || d.includes('belgica') || d.includes('bruselas') || d.includes('suecia') || d.includes('estocolmo') || d.includes('noruega') || d.includes('oslo') || d.includes('dinamarca') || d.includes('copenhague') || d.includes('suiza') || d.includes('zurich') || d.includes('austria') || d.includes('viena') || d.includes('croacia') || d.includes('zagreb') || d.includes('hungría') || d.includes('budapest') || d.includes('polonia') || d.includes('varsovia') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('sevilla') || d.includes('florencia') || d.includes('venecia') || d.includes('milan') || d.includes('frankfurt'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a toda la Zona Schengen hasta 90 días. Solo pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso. No es necesario el DNI.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london') || d.includes('irlanda') || d.includes('dublin'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio. El UK NO forma parte de Schengen — si combinas con Europa, son permisos de entrada separados.';
    else if (d.includes('australia') || d.includes('sídney') || d.includes('sydney') || d.includes('melbourne') || d.includes('brisbane'))
      visaInfo = 'PASAPORTE + eVisitor: Los chilenos necesitan eVisitor (subclass 651) para Australia. Es GRATUITO y se tramita online en immi.homeaffairs.gov.au en minutos. Pasaporte vigente obligatorio.';
    else if (d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
      visaInfo = 'PASAPORTE + NZeTA: Los chilenos necesitan NZeTA (New Zealand Electronic Travel Authority, ~NZD$23) tramitable online o en la app oficial. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('tokio') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Japón hasta 90 días. Solo pasaporte vigente. Sin trámite previo. Una ventaja enorme frente a otros latinoamericanos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio. Prórroga posible a 60 días en oficina de inmigración local.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai') || d.includes('chengdu'))
      visaInfo = 'PASAPORTE + VISA: Los chilenos necesitan visa para China continental (tramitar en la Embajada China en Santiago). Para Hong Kong no se requiere visa (14 días). Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('hong kong'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos no necesitan visa para Hong Kong — entrada libre por 14 días. Pasaporte vigente obligatorio.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa') || d.includes('jaipur'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para India (~US$25), tramitable online en indianvisaonline.gov.in. Se obtiene en 72-96h. Pasaporte con al menos 6 meses de vigencia desde el ingreso.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE / CARNET: Los chilenos viajan SIN VISA a Brasil. Con carnet de identidad chileno vigente alcanza para 90 días. No es necesario el pasaporte.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche') || d.includes('salta') || d.includes('córdoba') || d.includes('cordoba'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Argentina basta con el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia hasta 90 días.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu') || d.includes('arequipa'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Perú basta el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia hasta 183 días.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('bogota') || d.includes('cartagena') || d.includes('medellín') || d.includes('medellin') || d.includes('cali'))
      visaInfo = 'PASAPORTE / CARNET (SIN VISA): Los chilenos viajan SIN VISA a Colombia hasta 90 días. Pasaporte o carnet de identidad vigente. Completar formulario Check-Mig online previo al viaje (gratuito).';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Uruguay basta el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia libre hasta 90 días.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('cochabamba') || d.includes('santa cruz de la sierra'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Bolivia basta el carnet de identidad chileno vigente. No se requiere pasaporte ni visa.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los chilenos obtienen visa gratuita al llegar a Dubai por convenio. Pasaporte con al menos 6 meses de validez. Verificar vigencia del convenio antes del viaje.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul') || d.includes('capadocia') || d.includes('cappadocia') || d.includes('antalya'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Turquía (~US$50), tramitable en evisa.gov.tr en minutos. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('vietnam') || d.includes('hanoi') || d.includes('ho chi minh') || d.includes('hoi an') || d.includes('da nang'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Vietnam (~US$25), tramitable en xuatnhapcanh.gov.vn. Aprobación en 3 días hábiles. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta') || d.includes('lombok') || d.includes('yogyakarta'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los chilenos obtienen Visa on Arrival en Indonesia (~US$35) por 30 días, prorrogable 30 días más. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('maldivas') || d.includes('maldives') || d.includes('islas maldivas'))
      visaInfo = 'PASAPORTE (VISA GRATUITA): Los chilenos obtienen Visa on Arrival GRATUITA en Maldivas por 30 días. Solo pasaporte vigente y reserva de alojamiento.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('la habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los chilenos necesitan Tarjeta del Turista (~US$25) para Cuba, comprable en el aeropuerto de salida o en la aerolínea. Pasaporte vigente obligatorio.';
    else if (d.includes('marruecos') || d.includes('marrakech') || d.includes('fez') || d.includes('casablanca') || d.includes('tánger'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Marruecos hasta 90 días. Pasaporte vigente obligatorio. Control migratorio estricto — lleva reservas de hotel impresas.';
    else if (d.includes('kenia') || d.includes('kenya') || d.includes('nairobi') || d.includes('safari') || d.includes('masai mara'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Kenia (~US$51), tramitable en evisa.go.ke. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('sudáfrica') || d.includes('sudafrica') || d.includes('cape town') || d.includes('ciudad del cabo') || d.includes('johannesburg'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Sudáfrica hasta 30 días. Pasaporte con al menos 6 meses de validez y 2 páginas en blanco.';
    else if (d.includes('qatar') || d.includes('doha'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Qatar hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun') || d.includes('ciudad de méxico') || d.includes('cdmx') || d.includes('playa del carmen') || d.includes('tulum'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a México hasta 180 días. Pasaporte vigente obligatorio. Se exige llenar Forma Migratoria Múltiple (FMM) en el avión o en el aeropuerto.';
    else if (d.includes('costa rica') || d.includes('san josé') || d.includes('san jose'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Costa Rica hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('panamá') || d.includes('panama') || d.includes('ciudad de panamá'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Panamá hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Singapur hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('seúl') || d.includes('busan') || d.includes('jeju'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Corea del Sur hasta 90 días. Pasaporte vigente obligatorio.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en minrel.gob.cl (Ministerio de Relaciones Exteriores de Chile). Estándar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // ── Visa / Pasaporte para viajeros ARGENTINOS ──────────────────────────────
  } else if (isArgentina) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('orlando') || d.includes('washington') || d.includes('boston') || d.includes('san francisco'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los argentinos NECESITAN visa para EE.UU. (no es visa-free). Tramitar en la Embajada de EE.UU. en Buenos Aires (usembassy.gov). El proceso puede tardar semanas o meses — ¡gestionarla con anticipación!';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los argentinos generalmente necesitan visa de turista para Canadá. Tramitar en el Consulado de Canadá en Argentina (canada.ca/es). Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berlín') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('florencia') || d.includes('venecia'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a la Zona Schengen hasta 90 días. Solo pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio. UK es independiente de Schengen.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('sídney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los argentinos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
      visaInfo = 'PASAPORTE + NZeTA: Los argentinos necesitan NZeTA (~NZD$23), tramitable online en immigation.govt.nz. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Japón hasta 90 días. Solo pasaporte vigente.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los argentinos necesitan visa para China continental. Tramitar en la Embajada China en Buenos Aires. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los argentinos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobación en 72-96h. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Los argentinos viajan a Brasil sin visa. Con DNI argentino vigente alcanza para 90 días — no es necesario el pasaporte.';
    else if (d.includes('chile') || d.includes('santiago') || d.includes('valparaíso') || d.includes('patagonia chilena'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Chile basta el DNI argentino vigente. Sin visa ni trámite previo.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Los argentinos viajan a Perú sin visa. Con DNI argentino vigente alcanza hasta 183 días.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('cartagena') || d.includes('medellín'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan a Colombia sin visa hasta 90 días. Pasaporte o DNI argentino vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Uruguay basta el DNI argentino vigente. Libre hasta 90 días.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('cochabamba'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Bolivia basta el DNI argentino vigente. Sin visa.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan a México sin visa hasta 180 días. Pasaporte vigente. Completar FMM en el avión o aeropuerto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los argentinos obtienen visa gratuita al llegar a Dubai. Pasaporte con al menos 6 meses de validez. Verificar vigencia del convenio.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los argentinos necesitan e-Visa para Turquía (~US$50), en evisa.gov.tr. Proceso de minutos online.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Singapur hasta 30 días. Pasaporte vigente.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('seúl'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Corea del Sur hasta 90 días. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los argentinos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o con la aerolínea.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en cancilleria.gob.ar (Cancillería argentina). Estándar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // ── Visa / Pasaporte para viajeros BRASILEÑOS ──────────────────────────────
  } else if (isBrasil) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + VISA: Los brasileños históricamente han necesitado visa B1/B2 para EE.UU. Los requisitos están cambiando (2023-2024). Verifica el estado actual en br.usembassy.gov antes de viajar.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los brasileños generalmente necesitan visa de turista para Canadá. Verifica si calificas para eTA en canada.ca. Tramitar con anticipación.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungary') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('florencia') || d.includes('venecia'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO para a Zona Schengen por até 90 dias. Apenas passaporte válido com pelo menos 6 meses de validade a partir da data de retorno.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO para o Reino Unido por até 6 meses. Passaporte válido obrigatório. O UK não faz parte do Schengen — são permissões separadas.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASSAPORTE + ETA: Os brasileiros precisam de Electronic Travel Authority (ETA subclass 601, gratuita) para a Austrália, disponível em immi.homeaffairs.gov.au. Passaporte válido obrigatório.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO ao Japão por até 90 dias. Apenas passaporte válido — sem burocracia prévia.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO à Tailândia por até 30 dias. Passaporte válido obrigatório.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASSAPORTE + VISTO: Os brasileiros precisam de visto para a China continental. Solicitar na Embaixada/Consulado da China no Brasil. Passaporte com ao menos 6 meses de validade.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASSAPORTE + e-VISA: Os brasileiros precisam de e-Visa para a Índia (~US$25), em indianvisaonline.gov.in. Aprovação em 72-96h. Passaporte com ao menos 6 meses de validade.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para a Argentina basta a Carteira de Identidade (RG) brasileira válida. Não é necessário passaporte. Estadia livre por 90 dias.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Chile basta a Carteira de Identidade (RG) brasileira válida. Sem visto, sem burocracia.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Peru basta a Carteira de Identidade (RG) brasileira válida. Estadia até 183 dias.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('cartagena') || d.includes('medellín'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam à Colômbia sem visto por até 90 dias. Passaporte válido obrigatório.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Uruguai basta a Carteira de Identidade (RG) brasileira válida.';
    else if (d.includes('bolivia') || d.includes('la paz'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para a Bolívia basta a Carteira de Identidade (RG) brasileira válida.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam ao México sem visto. Passaporte válido. Preencher FMM no avião ou aeroporto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASSAPORTE (VISTO NA CHEGADA): Os brasileiros obtêm visto gratuito ao chegar em Dubai por acordo bilateral. Passaporte com ao menos 6 meses de validade. Confirmar o acordo antes de viajar.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASSAPORTE + e-VISTO: Os brasileiros precisam de e-Visa para a Turquia (~US$50), em evisa.gov.tr. Processo online em minutos.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASSAPORTE + CARTÃO DE TURISTA: Os brasileiros precisam do Cartão de Turista para Cuba (~US$25), comprado no aeroporto ou com a companhia aérea. Passaporte válido.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta'))
      visaInfo = 'PASSAPORTE (VISTO NA CHEGADA): Os brasileiros obtêm Visto na Chegada na Indonésia (~US$35) por 30 dias, prorrogável por mais 30. Passaporte com ao menos 6 meses de validade.';
    else
      visaInfo = 'PASSAPORTE: Verifique os requisitos de visto no portal do Itamaraty (itamaraty.gov.br). Padrão: passaporte válido com ao menos 6 meses de validade a partir da data de retorno.';

  // ── Visa / Pasaporte para viajeros COLOMBIANOS ─────────────────────────────
  } else if (isColombia) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los colombianos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Bogotá (co.usembassy.gov). Iniciar el proceso con meses de anticipación.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa de turista para Canadá. Tramitar en el Consulado de Canadá en Colombia (canada.ca). Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Desde junio 2023, los colombianos viajan SIN VISA a la Zona Schengen hasta 90 días. Solo pasaporte vigente con al menos 6 meses de validez. ¡Gran avance para los viajeros colombianos!';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos NECESITAN visa para el Reino Unido. Tramitar online en gov.uk. El UK no aplica el acuerdo Schengen. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa de turista para Australia (Visitor Visa subclass 600). Tramitar online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Japón hasta 90 días. Solo pasaporte vigente — sin burocracia previa.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa para China. Tramitar en la Embajada China en Bogotá. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los colombianos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobación en 72-96h.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Argentina sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Chile sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASAPORTE O CÉDULA (SIN VISA): Los colombianos viajan a Perú sin visa. Pasaporte o cédula de ciudadanía colombiana vigente hasta 183 días.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('são paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Brasil sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('uruguay') || d.includes('montevideo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Uruguay sin visa hasta 90 días. Pasaporte vigente.';
    else if (d.includes('bolivia') || d.includes('la paz'))
      visaInfo = 'PASAPORTE O CÉDULA (SIN VISA): Para Bolivia basta la cédula de ciudadanía colombiana vigente. Sin visa.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a México sin visa. Pasaporte vigente. Completar FMM en el avión o aeropuerto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los colombianos obtienen visa gratuita al llegar a Dubai. Pasaporte con al menos 6 meses de validez. Verificar convenio vigente.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los colombianos necesitan e-Visa para Turquía (~US$50), en evisa.gov.tr.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Singapur hasta 30 días. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los colombianos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerolínea.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en cancilleria.gov.co (Cancillería de Colombia). Estándar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // ── Visa / Pasaporte para viajeros MEXICANOS ───────────────────────────────
  } else if (isMexico) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los mexicanos generalmente NECESITAN visa para EE.UU. Si ya la tienes vigente, ¡perfecto! Si no, tramitar en la Embajada de EE.UU. en México (mx.usembassy.gov). El proceso puede tardar meses.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los mexicanos necesitan visa de turista para Canadá (o eTA si viajaron en avión con visa canadiense previa). Tramitar con anticipación en canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a la Zona Schengen hasta 90 días. Solo pasaporte vigente con al menos 6 meses de validez.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los mexicanos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Japón hasta 90 días. Solo pasaporte vigente — sin trámites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los mexicanos necesitan visa para China. Tramitar en la Embajada China en México. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los mexicanos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobación en 72-96h.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Argentina sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Chile sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Perú sin visa hasta 183 días. Pasaporte vigente obligatorio.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('cartagena') || d.includes('medellín'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Colombia sin visa hasta 90 días. Pasaporte vigente.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('são paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Brasil sin visa hasta 90 días. Pasaporte vigente obligatorio.';
    else if (d.includes('uruguay') || d.includes('montevideo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Uruguay sin visa. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los mexicanos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerolínea. Pasaporte vigente.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los mexicanos obtienen visa gratuita al llegar a Dubai por acuerdo. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los mexicanos necesitan e-Visa para Turquía (~US$50), en evisa.gov.tr.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Singapur hasta 30 días. Pasaporte vigente.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('seúl'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Corea del Sur hasta 90 días. Pasaporte vigente.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los mexicanos obtienen Visa on Arrival en Indonesia (~US$35) por 30 días, prorrogable 30 días más. Pasaporte con 6 meses de validez.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en sre.gob.mx (Secretaría de Relaciones Exteriores de México). Estándar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  } else if (isPerú) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los peruanos NECESITAN visa para EE.UU. Tramitar con anticipación en la Embajada de EE.UU. en Lima (pe.usembassy.gov). El proceso puede tardar semanas o meses.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los peruanos necesitan visa de turista para Canadá. Tramitar con anticipación en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a la Zona Schengen hasta 90 días gracias al acuerdo UE-Perú vigente desde 2023. Solo pasaporte con al menos 6 meses de validez.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA UK: Los peruanos necesitan visa para el Reino Unido. Tramitar en gov.uk/uk-visa. Pasaporte vigente con al menos 6 meses de validez.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los peruanos necesitan Visitor Visa (Subclase 600) para Australia. Tramitar online en immi.homeaffairs.gov.au.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a Japón hasta 90 días por acuerdo bilateral. Solo pasaporte vigente — sin trámites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los peruanos necesitan e-Visa para Turquía (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los peruanos pueden obtener visa gratuita al llegar a Emiratos Árabes. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos pueden entrar a Chile con su DNI peruano vigente. Sin visa — estadía hasta 90 días.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos ingresan a Argentina con DNI peruano vigente. Sin visa — estadía hasta 90 días.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo') || d.includes('florianópolis') || d.includes('florianopolis'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a Brasil sin visa hasta 90 días. Pasaporte peruano vigente (en Brasil no se acepta DNI extranjero).';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('bogota') || d.includes('cartagena') || d.includes('medellín') || d.includes('medellin'))
      visaInfo = 'PASAPORTE O CÉDULA PERUANA: Los peruanos viajan a Colombia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con cédula/DNI peruano vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz') || d.includes('cochabamba'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos viajan a Bolivia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con DNI peruano vigente.';
    else if (d.includes('ecuador') || d.includes('quito') || d.includes('guayaquil'))
      visaInfo = 'PASAPORTE O CÉDULA PERUANA: Los peruanos viajan a Ecuador sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con cédula/DNI peruano vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a Uruguay sin visa hasta 90 días. Pasaporte peruano vigente.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun') || d.includes('ciudad de méxico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a México sin visa hasta 180 días. Pasaporte peruano vigente obligatorio.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los peruanos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerolínea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en rree.gob.pe (Ministerio de Relaciones Exteriores del Perú) antes de viajar. Los requisitos pueden cambiar — consulta siempre la fuente oficial más cercana a tu fecha de viaje.';

  } else if (isUruguay) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los uruguayos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Montevideo (uy.usembassy.gov). El proceso puede tardar semanas.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los uruguayos necesitan visa de turista para Canadá (o eTA si viajaron antes en avión con visa canadiense). Tramitar en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a la Zona Schengen hasta 90 días. Pasaporte con al menos 6 meses de validez desde la fecha de regreso.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los uruguayos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Japón hasta 90 días. Solo pasaporte vigente — sin trámites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Tailandia hasta 30 días. Pasaporte vigente obligatorio.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los uruguayos necesitan e-Visa para Turquía (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Emiratos Árabes Unidos hasta 90 días. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los uruguayos necesitan visa para China. Tramitar en la Embajada de China en Montevideo con anticipación.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'DNI URUGUAYO O PASAPORTE: Los uruguayos entran a Argentina con su DNI uruguayo vigente (MERCOSUR). Sin visa — estadía hasta 90 días.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo') || d.includes('florianópolis') || d.includes('florianopolis'))
      visaInfo = 'DNI URUGUAYO O PASAPORTE: Los uruguayos entran a Brasil con su DNI uruguayo vigente (MERCOSUR). Sin visa — estadía hasta 90 días.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE O DNI URUGUAYO: Los uruguayos entran a Chile con DNI uruguayo vigente. Sin visa — estadía hasta 90 días.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('bogota') || d.includes('cartagena') || d.includes('medellín') || d.includes('medellin'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Colombia sin visa hasta 90 días. Pasaporte uruguayo vigente.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Perú sin visa hasta 90 días. Pasaporte uruguayo vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Bolivia sin visa. Pasaporte uruguayo vigente.';
    else if (d.includes('ecuador') || d.includes('quito') || d.includes('guayaquil'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Ecuador sin visa hasta 90 días. Pasaporte uruguayo vigente.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun') || d.includes('ciudad de méxico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a México sin visa hasta 180 días. Pasaporte uruguayo vigente obligatorio.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los uruguayos necesitan Tarjeta del Turista para Cuba, comprable en el aeropuerto o aerolínea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en mrree.gub.uy (Ministerio de Relaciones Exteriores del Uruguay) antes de viajar. Los requisitos pueden cambiar — consulta siempre la fuente oficial más cercana a tu fecha de viaje.';

  } else if (isEcuador) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los ecuatorianos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Quito (ec.usembassy.gov). El proceso puede tardar semanas o meses.';
    else if (d.includes('canadá') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa de turista para Canadá. Tramitar con anticipación en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('españa') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungría') || d.includes('budapest') || d.includes('república checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE + VISA SCHENGEN: Los ecuatorianos NECESITAN visa para la Zona Schengen (Ecuador no tiene acuerdo de liberalización de visas con la UE, a diferencia de Colombia y Perú). Tramitar en la embajada del país de mayor estadía.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA UK: Los ecuatorianos necesitan visa para el Reino Unido. Tramitar en gov.uk/uk-visa con anticipación.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan Visitor Visa (Subclase 600) para Australia. Tramitar online en immi.homeaffairs.gov.au.';
    else if (d.includes('japon') || d.includes('japón') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para Japón. Tramitar en la Embajada de Japón en Quito con anticipación.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE + VISA ON ARRIVAL: Los ecuatorianos pueden obtener Visa on Arrival en Tailandia (30 días). Pasaporte vigente y fondos suficientes.';
    else if (d.includes('turquía') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los ecuatorianos necesitan e-Visa para Turquía (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para Emiratos Árabes Unidos. Tramitar con la aerolínea o embajada de EAU en Quito. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Chile sin visa hasta 90 días. Pasaporte ecuatoriano vigente obligatorio.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Argentina sin visa hasta 90 días. Pasaporte ecuatoriano vigente.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('río de janeiro') || d.includes('rio de janeiro') || d.includes('são paulo') || d.includes('sao paulo') || d.includes('florianópolis') || d.includes('florianopolis'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Brasil sin visa hasta 90 días. Pasaporte ecuatoriano vigente.';
    else if (d.includes('colombia') || d.includes('bogotá') || d.includes('bogota') || d.includes('cartagena') || d.includes('medellín') || d.includes('medellin'))
      visaInfo = 'PASAPORTE O CÉDULA ECUATORIANA: Los ecuatorianos viajan a Colombia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con cédula ecuatoriana vigente.';
    else if (d.includes('perú') || d.includes('peru') || d.includes('lima') || d.includes('cusco'))
      visaInfo = 'PASAPORTE O CÉDULA ECUATORIANA: Los ecuatorianos viajan a Perú sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con cédula ecuatoriana vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz') || d.includes('cochabamba'))
      visaInfo = 'PASAPORTE O CÉDULA ECUATORIANA: Los ecuatorianos viajan a Bolivia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con cédula ecuatoriana vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Uruguay sin visa hasta 90 días. Pasaporte ecuatoriano vigente.';
    else if (d.includes('méxico') || d.includes('mexico') || d.includes('cancún') || d.includes('cancun') || d.includes('ciudad de méxico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para México (requerida desde 2023 por acuerdo migratorio). Tramitar en la Embajada de México en Quito con anticipación.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los ecuatorianos necesitan Tarjeta del Turista para Cuba, comprable en el aeropuerto o aerolínea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en cancilleria.gob.ec (Ministerio de Relaciones Exteriores del Ecuador) antes de viajar. Los requisitos pueden cambiar — consulta siempre la fuente oficial más cercana a tu fecha de viaje.';
  }

  const lines = [];
  if (visaInfo) lines.push(visaInfo);
  if (adapterInfo) lines.push(`ADAPTADOR DE ENCHUFE: ${adapterInfo}`);
  return lines.join('\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, planId } = body;
    let basicItinerary = body.basicItinerary ?? null; // let para poder invalidarlo si el destino no coincide

    if (!formData?.email || !formData?.nombre) {
      return NextResponse.json({ error: 'Faltan datos del formulario' }, { status: 400 });
    }

    const isPro = planId === 'pro';
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    const today = new Date().toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const currentYear = new Date().getFullYear();

    // ── Validación de presupuesto vs destino ────────────────────────────────
    const presupuesto = formData.presupuesto || 0;
    const destino     = (formData.destino || '').toLowerCase();
    const origen      = (formData.origen  || 'Santiago').toLowerCase();
    const dias        = formData.dias || 7;

    // Umbrales mínimos estimados para viaje completo desde Chile (vuelo + alojamiento + comidas)
    const umbralMin = (() => {
      if (destino.includes('chile') || !destino) return 300;
      if (/argentina|uruguay|bolivia|perú|peru/.test(destino)) return 800;
      if (/brasil|colombia|ecuador|venezuela|paraguay/.test(destino)) return 1200;
      if (/méxico|mexico|cuba|caribe|dominicana|costa rica|panamá|panama/.test(destino)) return 1500;
      if (/eeuu|ee\.uu|estados unidos|new york|miami|florida|california|chicago/.test(destino)) return 2000;
      if (/canadá|canada/.test(destino)) return 2200;
      if (/europa|españa|portugal|francia|italia|alemania|reino unido|grecia|turquía|turquia/.test(destino)) return 2500;
      if (/japón|japon|china|corea|tailandia|vietnam|india|indonesia|singapur|asia/.test(destino)) return 3000;
      if (/australia|nueva zelanda|oceanía|oceania/.test(destino)) return 4000;
      return 1500; // internacional genérico
    })();

    const budgetWarning = presupuesto < umbralMin ? `
⚠️ ALERTA DE PRESUPUESTO: El cliente tiene $${presupuesto} USD/persona pero el viaje a ${formData.destino || 'este destino'} típicamente cuesta $${umbralMin}+ USD/persona.
DEBES:
1. Mencionarlo con empatía en el campo "resumen.ritmo" o añadir una nota en "resumen.distribucion": "⚠️ Tu presupuesto es ajustado para este destino — considera fechas flexibles y hostels."
2. Adaptar TODAS las recomendaciones al presupuesto real: hostels/Airbnb económico, comida callejera, actividades gratuitas.
3. En presupuesto_desglose.total NO superar $${presupuesto * 1.1} USD.
4. Si el presupuesto solo alcanza para el pasaje (menos de $${Math.round(umbralMin * 0.4)} USD), indicarlo claramente y sugerir destinos alternativos más económicos.` : '';

    const clienteCtx = `
DATOS DEL CLIENTE:
- Nombre: ${formData.nombre}
- Destino: ${formData.destino || 'Destino flexible'}
- Origen: ${formData.origen || 'Santiago, Chile'}
- Presupuesto: $${presupuesto >= 15000 ? '15.000+' : presupuesto} USD por persona (TOTAL para TODO el viaje: vuelos + alojamiento + comidas + actividades)
- Duración: ${dias} días
- Tipo de viajero: ${formData.tipoViaje || 'pareja'}
- Número de viajeros: ${formData.numViajeros || 2}
- Intereses: ${Array.isArray(formData.intereses) ? formData.intereses.join(', ') : (formData.intereses || 'cultura, gastronomía')}
- Ritmo: ${formData.ritmo <= 2 ? 'Relajado (max 2 actividades/día)' : formData.ritmo <= 3 ? 'Moderado (2-3 actividades)' : 'Intenso (3-4 actividades)'}
- Alojamiento preferido: ${formData.alojamiento || 'hotel'}
${budgetWarning}
Hoy es ${today}. Los precios, vuelos y datos de alojamiento deben ser realistas para esta fecha.
Para fecha_salida y fecha_regreso: propón fechas REALES en formato YYYY-MM-DD, mínimo 6-8 semanas desde hoy (${today}), en temporada ideal para el destino. fecha_regreso = fecha_salida + ${dias} días.
Para origen_iata y destino_iata: código IATA de 3 letras del aeropuerto principal.`;

    // ── Detección de viaje doméstico ─────────────────────────────────────────
    const origenStr  = (formData.origen  || 'Santiago, Chile').toLowerCase();
    const destinoStr = (formData.destino || '').toLowerCase();
    const paisesComunes = ['chile','argentina','perú','peru','bolivia','colombia','ecuador',
                           'brasil','brazil','uruguay','paraguay','venezuela','méxico','mexico',
                           'costa rica','panamá','panama','cuba'];
    const isDomestic = paisesComunes.find(p => origenStr.includes(p) && destinoStr.includes(p)) || null;

    // ── B: Contexto de viaje personalizado (visa + adaptador) para el checklist ─
    const travelContext = !isDomestic ? getCountryTravelContext(origenStr, destinoStr) : '';
    const checklistRule = travelContext
      ? `- CHECKLIST PERSONALIZADO: Para los ítems del checklist, usa OBLIGATORIAMENTE esta información verificada sobre los requisitos del viaje desde ${formData.origen || 'Chile'} hacia ${formData.destino}:\n${travelContext}\nEstos ítems DEBEN aparecer literalmente en el checklist (no los parafrasees ni inventes información diferente). Completa el resto con ítems prácticos de preparativos: contratar seguro de viaje, llevar efectivo en la moneda local, confirmar reservas de vuelo y alojamiento, descargar apps útiles (Google Maps offline, Uber, traductor), ropa adecuada al clima del destino. Total: 8-10 ítems concisos y accionables.`
      : '';

    // ── Regla OPTIMIZACIÓN GEOGRÁFICA ────────────────────────────────────────
    const geoRule = `- OPTIMIZACIÓN GEOGRÁFICA DE RUTA: (1) Para viajes MULTI-DESTINO: ordena las ciudades/países de forma geográficamente lógica para minimizar distancias y tiempos de traslado. Nunca plantees rutas que obliguen a retroceder innecesariamente (ej: si visitas Madrid, Barcelona y Lisboa, no vayas Madrid→Lisboa→Barcelona). (2) Para el día a día de CADA CIUDAD: agrupa las actividades por zona geográfica. Mañana: zona norte o centro. Tarde: zona sur o cercana. Nunca propongas en el mismo día visitar atracciones en extremos opuestos de la ciudad sin lógica de desplazamiento. Siempre incluye en "ruta_optimizada" el orden sugerido para minimizar traslados. (3) Para vuelos: prioriza conexiones lógicas (no escalas en dirección contraria al destino).`;

    // ── Regla DÍAS: siempre generar los N días completos ─────────────────────
    const diasRule = `- DÍAS COMPLETOS: El array "dias" del JSON DEBE contener EXACTAMENTE ${dias} objetos (uno por cada día del viaje). NUNCA generes menos días aunque el presupuesto sea ajustado. Si el presupuesto es bajo, adapta con actividades gratuitas (parques, iglesias, miradores, mercados), comida callejera y alojamiento económico — pero SIEMPRE genera los ${dias} días completos. Un presupuesto ajustado NO es excusa para recortar el itinerario.`;

    // ── Regla viaje doméstico ────────────────────────────────────────────────
    const domesticRule = isDomestic
      ? `- VIAJE DOMÉSTICO: Origen (${formData.origen}) y destino (${formData.destino}) están en el MISMO PAÍS. Reglas ESTRICTAS: (1) "checklist": ESTÁ ABSOLUTAMENTE PROHIBIDO incluir la palabra "pasaporte" en cualquier ítem del checklist. El viajero solo necesita su cédula de identidad / DNI nacional. NO incluyas visa de turismo, adaptador de enchufe extranjero ni seguro de viaje internacional. Nunca menciones pasaporte en el checklist de un viaje doméstico. (2) "dinero.tipo_cambio": pon "No aplica — misma moneda"; "dinero.donde_cambiar": pon "No aplica — no se necesita cambiar divisas". (3) "seguro": solo asistencia médica nacional, sin mención a cobertura internacional. (4) "que_empacar.adaptador_enchufe": pon "No necesario — mismo país, mismo voltaje y tipo de enchufes". (5) "emergencias.embajada": pon "No aplica — viaje doméstico". (6) tips_culturales: NO menciones tipo de cambio, casas de cambio, conversión de divisas, adaptador de corriente ni seguro de viaje internacional.`
      : '';

    // Plataformas según preferencia del cliente
    // hotel → Eco=Airbnb, Mid=Booking.com, Prem=Booking.com
    // airbnb → todo Airbnb | hostal → todo Hostelworld | bnb → todo Booking.com
    const alojPref   = formData.alojamiento || 'hotel';
    const interesStr = Array.isArray(formData.intereses) ? formData.intereses.join(', ') : (formData.intereses || 'cultura, gastronomía');
    const tipoViaje  = (formData.tipoViaje || 'pareja').toLowerCase();
    const tipoViajeRule = tipoViaje === 'familia'
      ? `- TIPO DE VIAJE: FAMILIA. Adapta TODO el itinerario para viaje familiar: (1) Actividades aptas para niños de distintas edades (zoológicos, parques de diversiones, playas seguras, museos interactivos). (2) Restaurantes con menú infantil y mesas amplias. (3) Alojamiento con habitaciones familiares o conectadas. (4) Ritmo más tranquilo con descansos y opciones de backup si los niños se cansan. (5) Evita actividades de alto riesgo o exclusivas para adultos. Tono del texto: cálido, familiar y considerado con todas las edades.`
      : tipoViaje === 'pareja'
        ? `- TIPO DE VIAJE: PAREJA. Adapta TODO el itinerario para viaje romántico: (1) Experiencias íntimas (cenas con vista, paseos al atardecer, spas, tours privados). (2) Restaurantes con ambiente romántico (no bulliciosos). (3) Alojamiento con opción de habitación doble especial o suite. (4) Actividades en pareja (clases de cocina para dos, paseos en bote, miradores). Tono del texto: cálido, evocador y romántico.`
        : tipoViaje === 'solo'
          ? `- TIPO DE VIAJE: VIAJERO SOLO. Adapta TODO el itinerario para viaje individual: (1) Tours grupales (excelente para conocer gente). (2) Cafés con ambiente tranquilo para trabajar o leer. (3) Experiencias sociales y hostales con zonas comunes. (4) Énfasis en seguridad: zonas seguras, apps de transporte, contactos de emergencia. (5) Consejos sobre cómo moverse solo en el destino. Tono del texto: empoderador y práctico.`
          : tipoViaje === 'amigos'
            ? `- TIPO DE VIAJE: GRUPO DE AMIGOS. Adapta TODO el itinerario para grupo: (1) Actividades grupales (deportes de aventura, tours en grupo, vida nocturna). (2) Restaurantes con mesas grandes y ambiente animado. (3) Alojamiento tipo Airbnb casa completa o habitaciones múltiples en hotel/hostal. (4) Actividades de adrenalina y diversión colectiva. Tono del texto: energético, jovial y con humor.`
            : tipoViaje.includes('empresa') || tipoViaje.includes('corporat') || tipoViaje.includes('negocio')
              ? `- TIPO DE VIAJE: GRUPO EMPRESARIAL. Adapta el itinerario: (1) Hoteles de negocios con sala de reuniones y WiFi rápido. (2) Restaurantes apropiados para cenas de trabajo. (3) Opciones de team building y actividades grupales. (4) Transporte eficiente y servicio ejecutivo. Tono del texto: profesional pero cercano.`
              : `- TIPO DE VIAJE: ${tipoViaje}. Adapta el itinerario para este perfil de viajero.`;

    // ── Regla ALOJAMIENTO según preferencia ─────────────────────────────────
    const alojRule = alojPref === 'hostal'
      ? `- ALOJAMIENTO: El cliente eligió HOSTALES. Las 3 opciones (Económico, Confort, Premium) DEBEN ser hostales/albergues reales con nombre verificable en Hostelworld. PROHIBIDO recomendar hoteles de cadena (Hilton, Marriott, Ibis, etc.) ni Airbnb. Las 3 plataformas son TODAS "Hostelworld". Busca hostales reales en el destino.`
      : alojPref === 'airbnb'
        ? `- ALOJAMIENTO: El cliente eligió AIRBNB. Las 3 opciones deben ser propiedades reales en Airbnb (apartamentos, casas, estudios). SIEMPRE incluye EXACTAMENTE 3 opciones por ciudad: Económico, Confort y Premium. Nunca menos de 3.`
        : alojPref === 'bnb'
          ? `- ALOJAMIENTO: El cliente eligió BED & BREAKFAST. Las 3 opciones DEBEN ser Bed & Breakfast o casas de huéspedes reales con ese formato (pequeño, familiar, desayuno incluido). Búscalas en Booking.com usando el filtro "Bed and breakfast" (tipo de propiedad). SIEMPRE incluye EXACTAMENTE 3 opciones por ciudad. La plataforma de todas las opciones es "Booking.com".`
          : `- ALOJAMIENTO: Recomienda SOLO hoteles con nombre REAL y verificable. Prioriza cadenas conocidas (Hilton, Marriott, NH, Ibis, Radisson, Hyatt, etc.) o boutiques con alta presencia online. NUNCA inventes nombres. SIEMPRE incluye EXACTAMENTE 3 opciones por ciudad: Económico, Confort y Premium. Nunca menos de 3.`;
    const platEco  = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Airbnb';         // hotel → Económico en Airbnb
    const platMid  = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Booking.com';    // hotel → Confort en Booking.com
    const platPrem = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Booking.com';    // hotel → Premium en Booking.com
    // Links de búsqueda según plataforma
    const linkEco  = platEco  === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes'
                   : platEco  === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=CIUDAD'
                   : 'https://www.booking.com/searchresults.html?ss=CIUDAD&group_adults=VIAJEROS';
    const linkMid  = platMid  === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes'
                   : platMid  === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=CIUDAD'
                   : 'https://www.booking.com/searchresults.html?ss=CIUDAD&group_adults=VIAJEROS';
    const linkPrem = platPrem === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes'
                   : platPrem === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=CIUDAD'
                   : 'https://www.booking.com/searchresults.html?ss=CIUDAD&group_adults=VIAJEROS';

    const alojamientoSchema = `
"alojamiento": [
  {
    "destino": "string (ciudad/zona)",
    "noches": número,
    "opciones": [
      {
        "plataforma": "${platEco}",
        "nombre": "string (nombre real del alojamiento)",
        "categoria": "Económico",
        "precio_noche": "string en USD",
        "puntuacion": "string (ej: 8.7/10)",
        "cancelacion": "Gratuita",
        "highlights": ["string feature 1", "string feature 2"],
        "por_que": "string en voz VIVANTE cálida y directa",
        "link": "URL de búsqueda: ${linkEco}"
      },
      {
        "plataforma": "${platMid}",
        "nombre": "string",
        "categoria": "Confort",
        "precio_noche": "string",
        "puntuacion": "string",
        "cancelacion": "Gratuita",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL de búsqueda: ${linkMid}"
      },
      {
        "plataforma": "${platPrem}",
        "nombre": "string",
        "categoria": "Premium",
        "precio_noche": "string",
        "puntuacion": "string (ej: 4.9/5)",
        "cancelacion": "string",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL de búsqueda: ${linkPrem}"
      }
    ]
  }
]`;

    const restaurantesSchema = `
"restaurantes": {
  "NOMBRE_REAL_CIUDAD_1": [
    {
      "nombre": "string (nombre real del restaurante)",
      "ubicacion": "string (barrio/zona específica)",
      "tipo": "string (ej: Japonés tradicional, Tapas modernas)",
      "precio_promedio": "string (ej: $15-25 USD por persona)",
      "requiere_reserva": boolean,
      "por_que": "string en voz VIVANTE de por qué vale la pena",
      "link_reserva": "usa siempre Google Maps search: https://www.google.com/maps/search/NOMBRE+CIUDAD",
      "instagram": "string @handle o null"
    },
    { "nombre": "segundo restaurante", "ubicacion": "string", "tipo": "string", "precio_promedio": "string", "requiere_reserva": boolean, "por_que": "string", "link_reserva": "https://www.google.com/maps/search/NOMBRE+CIUDAD", "instagram": "string o null" },
    { "nombre": "tercer restaurante", "ubicacion": "string", "tipo": "string", "precio_promedio": "string", "requiere_reserva": boolean, "por_que": "string", "link_reserva": "https://www.google.com/maps/search/NOMBRE+CIUDAD", "instagram": "string o null" }
  ],
  "NOMBRE_REAL_CIUDAD_2": [
    { "nombre": "restaurante 1", "ubicacion": "string", "tipo": "string", "precio_promedio": "string", "requiere_reserva": boolean, "por_que": "string", "link_reserva": "https://www.google.com/maps/search/NOMBRE+CIUDAD", "instagram": "string o null" },
    { "nombre": "restaurante 2", "ubicacion": "string", "tipo": "string", "precio_promedio": "string", "requiere_reserva": boolean, "por_que": "string", "link_reserva": "https://www.google.com/maps/search/NOMBRE+CIUDAD", "instagram": "string o null" },
    { "nombre": "restaurante 3", "ubicacion": "string", "tipo": "string", "precio_promedio": "string", "requiere_reserva": boolean, "por_que": "string", "link_reserva": "https://www.google.com/maps/search/NOMBRE+CIUDAD", "instagram": "string o null" }
  ]
}
IMPORTANTE: Reemplaza NOMBRE_REAL_CIUDAD_1 y NOMBRE_REAL_CIUDAD_2 con los nombres reales de las ciudades visitadas. Si el viaje es a UNA SOLA ciudad y dura más de ${dias > 7 ? `${dias} días (más de 7)` : '7 días'} incluye ${dias > 7 ? '5' : '3'} restaurantes para esa ciudad${dias > 7 ? ' — no 3, sino 5' : ''}. Para múltiples ciudades, incluye 3 restaurantes por ciudad. Varía barrios, tipos de cocina y rangos de precio.`;

    const experienciasSchema = `
"experiencias": [
  {
    "nombre": "string (nombre de la actividad/tour)",
    "por_que_vale": "string en voz VIVANTE",
    "duracion": "string (ej: 3 horas)",
    "precio": "string (ej: $25-40 USD por persona)",
    "anticipacion": "string (ej: Reservar con 1 semana de anticipación)",
    "plataformas_disponibles": ["GetYourGuide", "Civitatis"],
    "link_gyg": null
  }
]
IMPORTANTE sobre plataformas_disponibles: La GRAN MAYORÍA de tours y actividades turísticas están en GetYourGuide y/o Civitatis. REGLA: por defecto usa ["GetYourGuide", "Civitatis"]. Si solo está en una → pon solo esa. Usa [] ÚNICAMENTE para actividades gratuitas/locales que NO se comercializan online (ej: entrar a una iglesia gratis, caminar por un barrio, mercado sin entrada). NUNCA uses "Viator". En caso de duda, incluye GetYourGuide. Si ni GetYourGuide ni Civitatis tienen la actividad, usa [].`;

    // ─── PROMPT BÁSICO ─────────────────────────────────────────────────────────
    const promptBasico = `Eres el planificador de VIVANTE. Crea un itinerario COMPLETO con el tono VIVANTE: cercano, directo, como un amigo experto. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas aéreas. Incluye mínimo 3 aerolíneas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta específica. Si NO hay vuelo directo, nunca lo inventes — pon la mejor conexión con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL → BOG → NRT"). Si existe un vuelo directo en la ruta Y el presupuesto total ($${presupuesto} USD por persona) lo permite, incluye SIEMPRE al menos 1 opción de vuelo directo en el array, aunque cueste más que las opciones con escala.${isDomestic ? ' Si el viaje es DOMÉSTICO, los vuelos son dentro del mismo país — precios en moneda local y sin escalas internacionales.' : ''}
${alojRule}
- RESTAURANTES: Si el viaje se concentra en UNA SOLA ciudad y dura más de 7 días, incluye 5 restaurantes para esa ciudad. Para viajes multi-ciudad o de 7 días o menos, incluye exactamente 3 restaurantes por ciudad visitada.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta vuelos, alojamiento y actividades a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa el campo resumen.ritmo para incluir una nota como "⚠️ Presupuesto ajustado — hemos optimizado el itinerario para sacar el máximo con tu presupuesto."
${diasRule}
- RITMO: El cliente eligió ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el número de actividades por día: ritmo 1-2 = máximo 2 actividades por día (días relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por día con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por día, días aprovechados al máximo. NO incluyas más actividades de las correspondientes aunque el destino lo permita. El ritmo también afecta el tono: ritmo bajo = más descripción contemplativa, ritmo alto = más dinámico y energético.
- INTERESES: El cliente eligió: ${interesStr}. TODAS las actividades del día a día DEBEN relacionarse con estos intereses. Mapeo obligatorio → "gastronomia": mercados de comida, clases de cocina, tours gastronómicos, degustaciones; "aventura": senderismo, deportes extremos, escalada, kayak, rafting, zipline; "playa": playas, snorkeling, surf, buceo, paseos en barco; "cultura": museos, sitios históricos, arquitectura, arte local, barrios históricos; "naturaleza": parques nacionales, cascadas, reservas naturales, avistamiento de fauna; "vida nocturna": bares de moda, rooftops, tours nocturnos, clubes. Las actividades del día a día NO pueden contradecir los intereses elegidos (ej: si eligió gastronomía, no pongas excursiones a montañas si no hay relación gastronómica).
${tipoViajeRule}
- AEROLÍNEAS: SOLO recomienda aerolíneas de esta lista verificada: LATAM, JetSmart, Sky Airline, Avianca, Copa Airlines, Aerolíneas Argentinas, Aeroméxico, GOL, Azul, American Airlines, United Airlines, Delta, Air Canada, WestJet, Iberia, Iberia Express, Air Europa, Turkish Airlines, Air France, KLM, Lufthansa, Swiss, Austrian Airlines, British Airways, TAP Portugal, Norwegian, EasyJet, Ryanair, Finnair, ITA Airways, Qatar Airways, Emirates, Ethiopian Airlines, Japan Airlines, ANA, Singapore Airlines, Cathay Pacific, Korean Air, Asiana, Thai Airways, Malaysia Airlines, Air New Zealand, EVA Air, China Airlines. NO recomiendes aerolíneas que no estén en esta lista.
${geoRule}${domesticRule ? '\n' + domesticRule : ''}${checklistRule ? '\n' + checklistRule : ''}

GENERA JSON puro (sin markdown, sin \`\`\`):
{
  "titulo": "string creativo",
  "subtitulo": "string tagline motivador",
  "resumen": {
    "destino": "string",
    "origen": "string",
    "dias": número,
    "viajeros": número,
    "tipo": "string",
    "presupuesto_total": "string USD",
    "ritmo": "string",
    "fecha_salida": "YYYY-MM-DD",
    "fecha_regreso": "YYYY-MM-DD",
    "origen_iata": "string (3 letras, ej: SCL)",
    "destino_iata": "string (3 letras, ej: NRT)",
    "fecha_optima_texto": "string (ej: Salida 15 de mayo, regreso 25 de mayo 2026)",
    "distribucion": "string con distribución de días por zona"
  },
  "presupuesto_desglose": {
    "vuelos": "string",
    "alojamiento": "string",
    "comidas": "string",
    "actividades": "string",
    "transporte_local": "string",
    "extras": "string",
    "total": "string"
  },
  "vuelos": [
    {
      "aerolinea": "string",
      "ruta": "string (ej: SCL → NRT directo, o SCL → LIM → NRT vía Lima)",
      "precio_estimado": "string",
      "duracion": "string (ej: 14h directo, 22h con 1 escala)",
      "escala": "string (Directo / 1 escala en CIUDAD / 2 escalas)",
      "tip": "string insider"
    }
  ],
  ${alojamientoSchema},
  "dias": [
    {
      "numero": número,
      "titulo": "string creativo",
      "manana": {
        "horario": "string",
        "actividad": "string detallado",
        "costo": "string",
        "tip": "string insider"
      },
      "tarde": {
        "horario": "string",
        "almuerzo": "string (restaurante + precio)",
        "actividad": "string detallado",
        "costo": "string"
      },
      "noche": {
        "cena": "string (restaurante + precio)",
        "actividad": "string"
      },
      "ruta_optimizada": "string con orden lógico de las zonas del día para minimizar desplazamientos",
      "gasto_dia": "string USD"
    }
  ],
  ${restaurantesSchema},
  ${experienciasSchema},
  "tips_culturales": [
    "string tip cultural",
    "string tip conectividad o apps",
    "string tip de dinero o pagos",
    "string tip de transporte",
    "string tip de costumbres o seguridad"
  ],
  "dinero": {
    "moneda_local": "string",
    "tipo_cambio": "string (realista para ${today})",
    "tarjeta_o_efectivo": "string",
    "donde_cambiar": "string",
    "propinas": "string",
    "tip_extra": "string"
  },
  "seguro": [
    { "nombre": "Assist Card", "cobertura": "string adaptada al destino", "precio_estimado": "string USD", "link": "https://www.assistcard.com/cl/cotizar" },
    { "nombre": "World Nomads", "cobertura": "string", "precio_estimado": "string USD", "link": "https://www.worldnomads.com/es/travel-insurance" },
    { "nombre": "IATI Seguros", "cobertura": "string", "precio_estimado": "string USD", "link": "https://www.iatiseguros.com/" }
  ],
  "checklist": ["string", "string", "string", "string", "string", "string", "string", "string"],
  "emergencias": {
    "embajada": "string (dirección y teléfono de la embajada chilena en el destino)",
    "emergencias_local": "string (número de emergencias del país)",
    "policia_turistica": "string o null"
  },
  "lo_imperdible": [
    {
      "nombre": "string",
      "descripcion": "string inspirador en voz VIVANTE"
    }
  ]
}`;

    // ─── PROMPT PRO ────────────────────────────────────────────────────────────
    // ── Basic→Pro continuity: si existe itinerario básico, solo generar secciones Pro exclusivas ──
    // ESTRATEGIA: en lugar de pedirle al AI que "recuerde" el contenido básico,
    // generamos SOLO las secciones Pro y las fusionamos con el básico en el servidor.
    // Esto garantiza que vuelos, alojamiento, días, restaurantes y experiencias sean 100% idénticos.
    const basicCtx = basicItinerary ? `
CONTEXTO: El cliente ya tiene su plan Básico. Tu tarea es generar ÚNICAMENTE las secciones EXCLUSIVAS del plan Pro.
Datos del itinerario básico existente (para contexto de coherencia):
- Destino: ${basicItinerary.resumen?.destino || formData.destino}
- Fecha salida: ${basicItinerary.resumen?.fecha_salida || ''} / Regreso: ${basicItinerary.resumen?.fecha_regreso || ''}
- Distribución de días: ${basicItinerary.resumen?.distribucion || ''}
- Vuelos ya sugeridos: ${(basicItinerary.vuelos || []).map(v => v.aerolinea + ' (' + v.ruta + ')').join('; ')}

INSTRUCCIÓN CRÍTICA: El JSON que debes generar contiene ÚNICAMENTE las siguientes secciones Pro (NO repitas vuelos, alojamiento, dias, restaurantes, experiencias ni ninguna sección básica — esas ya las tiene el cliente y se fusionarán automáticamente):
` : '';

    const promptPro = `Eres el planificador PRO de VIVANTE. Itinerario PREMIUM ultra-detallado, con el tono cálido y experto VIVANTE. Precios realistas para ${currentYear}.
${basicCtx}
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas aéreas. Incluye mínimo 3 aerolíneas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta específica. Si NO hay vuelo directo, nunca lo inventes — pon la mejor conexión con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL → BOG → NRT"). Si existe un vuelo directo en la ruta Y el presupuesto total ($${presupuesto} USD por persona) lo permite, incluye SIEMPRE al menos 1 opción de vuelo directo en el array, aunque cueste más que las opciones con escala.${isDomestic ? ' Si el viaje es DOMÉSTICO, los vuelos son dentro del mismo país — precios en moneda local y sin escalas internacionales.' : ''}
${alojRule}
- RESTAURANTES: Si el viaje se concentra en UNA SOLA ciudad y dura más de 7 días, incluye 5 restaurantes para esa ciudad. Para viajes multi-ciudad o de 7 días o menos, incluye exactamente 3 restaurantes por ciudad visitada.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta todas las recomendaciones (vuelos, alojamiento, actividades, restaurantes) a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa resumen.ritmo para incluir una nota como "⚠️ Presupuesto ajustado — optimizamos el itinerario para sacar el máximo con tu presupuesto."
${diasRule}
- RITMO: El cliente eligió ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el número de actividades por día: ritmo 1-2 = máximo 2 actividades por día (días relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por día con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por día, días aprovechados al máximo. NO incluyas más actividades de las correspondientes aunque el destino lo permita. El ritmo también afecta el tono: ritmo bajo = más descripción contemplativa, ritmo alto = más dinámico y energético.
- INTERESES: El cliente eligió: ${interesStr}. TODAS las actividades del día a día DEBEN relacionarse con estos intereses. Mapeo obligatorio → "gastronomia": mercados de comida, clases de cocina, tours gastronómicos, degustaciones; "aventura": senderismo, deportes extremos, escalada, kayak, rafting, zipline; "playa": playas, snorkeling, surf, buceo, paseos en barco; "cultura": museos, sitios históricos, arquitectura, arte local, barrios históricos; "naturaleza": parques nacionales, cascadas, reservas naturales, avistamiento de fauna; "vida nocturna": bares de moda, rooftops, tours nocturnos, clubes. Las actividades del día a día NO pueden contradecir los intereses elegidos.
${tipoViajeRule}
- AEROLÍNEAS: SOLO recomienda aerolíneas de esta lista verificada: LATAM, JetSmart, Sky Airline, Avianca, Copa Airlines, Aerolíneas Argentinas, Aeroméxico, GOL, Azul, American Airlines, United Airlines, Delta, Air Canada, WestJet, Iberia, Iberia Express, Air Europa, Turkish Airlines, Air France, KLM, Lufthansa, Swiss, Austrian Airlines, British Airways, TAP Portugal, Norwegian, EasyJet, Ryanair, Finnair, ITA Airways, Qatar Airways, Emirates, Ethiopian Airlines, Japan Airlines, ANA, Singapore Airlines, Cathay Pacific, Korean Air, Asiana, Thai Airways, Malaysia Airlines, Air New Zealand, EVA Air, China Airlines. NO recomiendes aerolíneas fuera de esta lista.
${geoRule}
- TRANSPORTE aeropuerto→centro: lista TODAS las opciones disponibles (Uber, Taxi, Metro, Bus express, Tren, etc.) con costo estimado y duración en el array opciones_aeropuerto_centro.
- BARES: en bares_vida_nocturna usa un objeto cuyas claves son los nombres REALES de las ciudades visitadas. Si el viaje es de UNA SOLA ciudad y más de 7 días, incluye 5 bares/lugares para esa ciudad. Para el resto, incluye EXACTAMENTE 2 bares por ciudad.
- EXTRAS: las categorías deben relacionarse directamente con los intereses del cliente (${interesStr}). Ejemplo: si tiene 'gastronomia' → categoría gastronómica; si tiene 'aventura' → actividades de adrenalina. Siempre incluir una categoría "Para días de lluvia o descanso".
- QUE_EMPACAR: adapta el clima_esperado a las fechas reales propuestas (fecha_salida / fecha_regreso). La lista de ropa debe ser práctica y concisa para el tipo de viaje y el clima del destino.${domesticRule ? '\n' + domesticRule : ''}${checklistRule ? '\n' + checklistRule : ''}

GENERA JSON puro (sin markdown, sin \`\`\`):
{
  "titulo": "string creativo",
  "subtitulo": "string tagline inspirador",
  "resumen": {
    "destino": "string",
    "origen": "string",
    "dias": número,
    "viajeros": número,
    "tipo": "string",
    "presupuesto_total": "string USD",
    "ritmo": "string",
    "fecha_salida": "YYYY-MM-DD",
    "fecha_regreso": "YYYY-MM-DD",
    "origen_iata": "string (3 letras)",
    "destino_iata": "string (3 letras)",
    "fecha_optima_texto": "string (ej: Salida 15 de mayo, regreso 25 de mayo 2026)",
    "distribucion": "string"
  },
  "presupuesto_desglose": {
    "vuelos": "string",
    "alojamiento": "string",
    "comidas": "string",
    "actividades": "string",
    "transporte_local": "string",
    "extras": "string",
    "total": "string"
  },
  "vuelos": [
    {
      "aerolinea": "string",
      "ruta": "string (ej: SCL → NRT directo, o SCL → LIM → NRT vía Lima)",
      "precio_estimado": "string",
      "duracion": "string (ej: 14h directo, 22h con 1 escala)",
      "escala": "string (Directo / 1 escala en CIUDAD / 2 escalas)",
      "tip": "string insider"
    }
  ],
  ${alojamientoSchema},
  "dias": [
    {
      "numero": número,
      "titulo": "string creativo",
      "manana": {
        "horario": "string",
        "actividad": "string muy detallado",
        "costo": "string",
        "tip": "string insider exclusivo",
        "plan_b": "string si llueve o cierra"
      },
      "tarde": {
        "horario": "string",
        "almuerzo": "string (nombre restaurante + precio estimado)",
        "actividad": "string detallado",
        "costo": "string"
      },
      "noche": {
        "horario": "string",
        "cena": "string (nombre restaurante + precio)",
        "actividad": "string"
      },
      "ruta_optimizada": "string con orden lógico del día para minimizar traslados",
      "gasto_dia": "string USD"
    }
  ],
  ${restaurantesSchema},
  "bares_vida_nocturna": {
    "NOMBRE_REAL_CIUDAD_1": [
      { "nombre": "string", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string (ej: jueves)", "tip": "string" },
      { "nombre": "string 2", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" }
    ],
    "NOMBRE_REAL_CIUDAD_2": [
      { "nombre": "string", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" },
      { "nombre": "string 2", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" }
    ]
  },
  ${experienciasSchema},
  "transporte_local": {
    "como_moverse": "string",
    "apps_recomendadas": ["string"],
    "tarjeta_transporte": "string",
    "opciones_aeropuerto_centro": [
      { "medio": "string (ej: Uber, Taxi, Metro, Bus express, Tren)", "costo": "string (ej: $25-35 USD)", "duracion": "string (ej: 45 min)", "tip": "string o null" }
    ],
    "conviene_auto": "string (sí/no con razón)"
  },
  "dinero": {
    "moneda_local": "string",
    "tipo_cambio": "string (realista para ${today})",
    "tarjeta_o_efectivo": "string",
    "donde_cambiar": "string",
    "cajeros": "string",
    "propinas": "string",
    "tip_extra": "string"
  },
  "conectividad": {
    "roaming": "string",
    "esim_recomendada": "string (Airalo o Holafly con precio aprox ${currentYear})",
    "sim_local": "string",
    "wifi_destino": "string",
    "apps_descargar": ["string"]
  },
  "festivos_horarios": {
    "feriados_en_fechas": "string",
    "horario_comercial": "string",
    "horarios_comida": "string",
    "museos": "string"
  },
  "salud_seguridad": {
    "vacunas": "string",
    "agua_potable": "string",
    "nivel_seguridad": "string",
    "zonas_evitar": "string",
    "estafas_comunes": "string"
  },
  "idioma_cultura": {
    "idioma": "string",
    "frases_utiles": [
      { "frase_local": "string", "pronunciacion": "string", "significado": "string" }
    ],
    "costumbres": "string",
    "vestimenta": "string",
    "mala_educacion": "string"
  },
  "tips_culturales": [
    "string tip cultural relevante",
    "string tip conectividad",
    "string tip de dinero",
    "string tip de seguridad",
    "string tip de costumbres"
  ],
  "seguro": [
    { "nombre": "Assist Card", "cobertura": "string adaptada al destino", "precio_estimado": "string USD", "link": "https://www.assistcard.com/cl/cotizar" },
    { "nombre": "World Nomads", "cobertura": "string", "precio_estimado": "string USD", "link": "https://www.worldnomads.com/es/travel-insurance" },
    { "nombre": "IATI Seguros", "cobertura": "string", "precio_estimado": "string USD", "link": "https://www.iatiseguros.com/" }
  ],
  "checklist": ["string", "string", "string", "string", "string", "string", "string", "string", "string", "string"],
  "emergencias": {
    "embajada": "string (dirección y teléfono de la embajada chilena en el destino)",
    "emergencias_local": "string",
    "policia_turistica": "string o null"
  },
  "lo_imperdible": [
    {
      "nombre": "string",
      "descripcion": "string inspirador en voz VIVANTE"
    }
  ],
  "que_empacar": {
    "clima_esperado": "string (temperaturas mín y máx esperadas en las fechas del viaje, si llueve, humedad, etc.)",
    "ropa": ["string (ej: 5 poleras de manga corta)", "string (ej: 1 chaqueta liviana para noches)", "string (ej: 2 pantalones cómodos)", "string (ej: 1 traje de baño)", "string (ej: zapatillas cómodas para caminar)", "string (ej: ropa de abrigo para noches)"],
    "adaptador_enchufe": "string (tipo de enchufe del país, voltaje y si el viajero chileno necesita adaptador o no, y dónde comprarlo)",
    "botiquin": ["string (ej: analgésicos tipo paracetamol)", "string (ej: antihistamínico para alergias)", "string (ej: protector solar SPF50+)", "string (ej: repelente de mosquitos si aplica)", "string (ej: vendas, alcohol y desinfectante)"],
    "power_bank": "string (recomendación concreta según duración y destino: capacidad en mAh sugerida, si es necesario, adaptadores de carga)"
  },
  "extras": [
    { "categoria": "string - categoría basada en los intereses del cliente (${Array.isArray(formData.intereses) ? formData.intereses.join(', ') : 'cultura, aventura'})", "actividades": ["string", "string", "string"] },
    { "categoria": "string - segunda categoría basada en intereses", "actividades": ["string", "string", "string"] },
    { "categoria": "Para días de lluvia o descanso", "actividades": ["string", "string", "string"] }
  ]
}`;

    // ── RUTA ESPECIAL: Basic→Pro upgrade con itinerario básico disponible ──────
    // Si es Pro Y tenemos el itinerario básico, solo pedimos las secciones Pro exclusivas
    // y las fusionamos con el básico en el servidor → 100% continuidad garantizada
    // ⚠️ Validación de destino: el basicItinerary DEBE corresponder al mismo destino actual
    if (basicItinerary) {
      const basicDest   = (basicItinerary.resumen?.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
      const currentDest = (formData.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
      const coinciden   = basicDest && currentDest && (basicDest.includes(currentDest) || currentDest.includes(basicDest));
      if (!coinciden) {
        console.log(`⚠️ Server: basicItinerary ignorado (destino "${basicDest}" ≠ "${currentDest}"). Generando Pro completo.`);
        basicItinerary = null; // forzar generación completa
      }
    }
    if (isPro && basicItinerary) {
      const promptProSolo = `${basicCtx}
GENERA JSON puro (sin markdown, sin \`\`\`) con SOLO estas secciones Pro exclusivas, coherentes con el destino ${basicItinerary.resumen?.destino || formData.destino} y las fechas ${basicItinerary.resumen?.fecha_salida || ''} → ${basicItinerary.resumen?.fecha_regreso || ''}:
${clienteCtx}
${tipoViajeRule}

{
  "titulo": "string creativo para la versión Pro",
  "subtitulo": "string tagline inspirador Pro",
  "bares_vida_nocturna": {
    "NOMBRE_REAL_CIUDAD_1": [
      { "nombre": "string", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" },
      { "nombre": "string 2", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" }
    ]
  },
  "transporte_local": {
    "como_moverse": "string",
    "apps_recomendadas": ["string"],
    "tarjeta_transporte": "string",
    "opciones_aeropuerto_centro": [
      { "medio": "string", "costo": "string", "duracion": "string", "tip": "string o null" }
    ],
    "conviene_auto": "string"
  },
  "conectividad": {
    "roaming": "string",
    "esim_recomendada": "string (Airalo o Holafly con precio aprox)",
    "sim_local": "string",
    "wifi_destino": "string",
    "apps_descargar": ["string"]
  },
  "festivos_horarios": {
    "feriados_en_fechas": "string",
    "horario_comercial": "string",
    "horarios_comida": "string",
    "museos": "string"
  },
  "salud_seguridad": {
    "vacunas": "string",
    "agua_potable": "string",
    "nivel_seguridad": "string",
    "zonas_evitar": "string",
    "estafas_comunes": "string"
  },
  "idioma_cultura": {
    "idioma": "string",
    "frases_utiles": [
      { "frase_local": "string", "pronunciacion": "string", "significado": "string" }
    ],
    "costumbres": "string",
    "vestimenta": "string",
    "mala_educacion": "string"
  },
  "que_empacar": {
    "clima_esperado": "string",
    "ropa": ["string"],
    "adaptador_enchufe": "string",
    "botiquin": ["string"],
    "power_bank": "string"
  },
  "extras": [
    { "categoria": "string basado en intereses del cliente", "actividades": ["string", "string", "string"] },
    { "categoria": "string segunda categoría", "actividades": ["string", "string", "string"] },
    { "categoria": "Para días de lluvia o descanso", "actividades": ["string", "string", "string"] }
  ],
  "dias_pro": [
    { "numero": 1, "plan_b": "string si llueve o cierra", "ruta_optimizada": "string" }
  ]
}
IMPORTANTE sobre dias_pro: para CADA día del viaje (${formData.dias} días), incluye su número, un plan_b y una ruta_optimizada. NO repitas las actividades del día — solo plan_b y ruta_optimizada.`;

      const groqResProSolo = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptProSolo }],
          temperature: 0.7,
          max_tokens: 6000,
        }),
      });

      if (groqResProSolo.ok) {
        const groqDataProSolo = await groqResProSolo.json();
        const rawProSolo = groqDataProSolo.choices[0]?.message?.content || '';
        let proSections = null;
        try {
          const cleaned = rawProSolo.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const start = cleaned.indexOf('{');
          const str = start >= 0 ? cleaned.substring(start) : cleaned;
          try { proSections = JSON.parse(str); } catch {}
          if (!proSections) {
            let pos = str.lastIndexOf('}');
            while (pos > 0 && !proSections) {
              try { proSections = JSON.parse(str.substring(0, pos + 1)); }
              catch { pos = str.lastIndexOf('}', pos - 1); }
            }
          }
        } catch (e) { console.error('Pro-solo parse error:', e.message); }

        if (proSections) {
          // Fusionar: básico + secciones Pro exclusivas
          const diasEnriquecidos = (basicItinerary.dias || []).map(dia => {
            const proDay = (proSections.dias_pro || []).find(d => d.numero === dia.numero);
            return {
              ...dia,
              manana: { ...dia.manana, plan_b: proDay?.plan_b || dia.manana?.plan_b },
              ruta_optimizada: proDay?.ruta_optimizada || dia.ruta_optimizada,
            };
          });

          const mergedItinerary = {
            ...basicItinerary,
            titulo:              proSections.titulo     || basicItinerary.titulo,
            subtitulo:           proSections.subtitulo  || basicItinerary.subtitulo,
            dias:                diasEnriquecidos,
            bares_vida_nocturna: proSections.bares_vida_nocturna,
            transporte_local:    proSections.transporte_local,
            conectividad:        proSections.conectividad,
            festivos_horarios:   proSections.festivos_horarios,
            salud_seguridad:     proSections.salud_seguridad,
            idioma_cultura:      proSections.idioma_cultura,
            que_empacar:         proSections.que_empacar,
            extras:              proSections.extras,
          };

          console.log('Basic→Pro merge exitoso. Secciones Pro añadidas:', Object.keys(proSections).join(', '));

          // Guardar itinerario básico para posible uso futuro (ya existe, no sobreescribir)
          // Enviar email de confirmación Pro
          const planLabel = 'Vivante Pro ⭐';
          const fechaTexto = mergedItinerary.resumen?.fecha_optima_texto || '';
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            const emailHtmlPro = buildConfirmationEmail(formData, mergedItinerary, planLabel, fechaTexto);
            const pdfBase64Pro  = await generateItinerarioPdf(mergedItinerary, formData, planLabel);
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'VIVANTE <onboarding@resend.dev>',
                to: [formData.email],
                subject: `⭐ Tu itinerario VIVANTE Pro está listo — ${mergedItinerary.titulo || 'Tu aventura'}`,
                html: emailHtmlPro,
                ...(pdfBase64Pro && { attachments: [{ filename: 'itinerario-vivante-pro.pdf', content: pdfBase64Pro }] }),
              }),
            });
            if (!emailRes.ok) console.error('Resend Pro email error:', await emailRes.text());
          }

          return NextResponse.json({ itinerario: mergedItinerary, planId });
        }
      }
      // Si falla el merge, continuar con el flujo normal de Pro completo
      console.log('Basic→Pro merge falló, generando Pro completo...');
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: isPro ? promptPro : promptBasico }],
        temperature: 0.7,
        max_tokens: isPro ? 12000 : 8000,
      }),
    });

    if (!groqRes.ok) {
      const groqErrText = await groqRes.text();
      console.error('Groq error status:', groqRes.status, 'body:', groqErrText);
      // Si es rate limit (429), intentar con modelo más rápido como fallback
      if (groqRes.status === 429) {
        console.log('Rate limit 429 en modelo principal, intentando fallback con llama-3.1-8b-instant...');
        const groqFallback = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: isPro ? promptPro : promptBasico }],
            temperature: 0.7,
            max_tokens: isPro ? 8000 : 6000,
          }),
        });
        if (groqFallback.ok) {
          const groqData2 = await groqFallback.json();
          const rawContent2 = groqData2.choices[0]?.message?.content || '';
          if (rawContent2) {
            // usar rawContent2 como rawContent para el parseado
            try {
              const cleaned2 = rawContent2.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const start2 = cleaned2.indexOf('{');
              const str2 = start2 >= 0 ? cleaned2.substring(start2) : cleaned2;
              let parsed2 = null;
              try { parsed2 = JSON.parse(str2); } catch {}
              if (!parsed2) {
                let pos2 = str2.lastIndexOf('}');
                while (pos2 > 0 && !parsed2) {
                  try { parsed2 = JSON.parse(str2.substring(0, pos2 + 1)); }
                  catch { pos2 = str2.lastIndexOf('}', pos2 - 1); }
                }
              }
              if (parsed2) {
                console.log('Fallback OK. Secciones:', Object.keys(parsed2).join(', '));
                return NextResponse.json({ itinerario: parsed2, planId, _model: 'fallback' });
              }
            } catch (fe) { console.error('Fallback parse error:', fe.message); }
          }
        } else {
          const fallbackErr = await groqFallback.text();
          console.error('Fallback también falló:', groqFallback.status, fallbackErr);
        }
      }
      return NextResponse.json({ error: 'Error generando itinerario' }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices[0]?.message?.content || '';

    let itinerario;
    try {
      // Limpiar markdown si el modelo los incluyó
      const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('{');
      const str = start >= 0 ? cleaned.substring(start) : cleaned;

      // 1. Intento directo
      let parsed = null;
      try { parsed = JSON.parse(str); } catch {}

      // 2. Si el JSON fue truncado, buscar desde el último '}' válido hacia atrás
      if (!parsed) {
        let pos = str.lastIndexOf('}');
        while (pos > 0 && !parsed) {
          try { parsed = JSON.parse(str.substring(0, pos + 1)); }
          catch { pos = str.lastIndexOf('}', pos - 1); }
        }
      }

      if (!parsed) throw new Error('No valid JSON found');
      itinerario = parsed;
      console.log('Itinerario parseado OK. Secciones:', Object.keys(itinerario).join(', '));
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Raw content preview:', rawContent.substring(0, 600));
      return NextResponse.json({ error: 'Error procesando itinerario' }, { status: 500 });
    }

    // ─── EMAIL HTML (resumen simplificado para el correo) ──────────────────────
    const planLabel = isPro ? 'Vivante Pro ⭐' : 'Vivante Básico';
    const fechaTexto = itinerario.resumen?.fecha_optima_texto || '';

    const emailHtml = buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const pdfBase64 = await generateItinerarioPdf(itinerario, formData, planLabel);
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VIVANTE <onboarding@resend.dev>',
          to: [formData.email],
          subject: `✈️ ${itinerario.titulo || 'Tu itinerario VIVANTE está listo'} — ${planLabel}`,
          html: emailHtml,
          ...(pdfBase64 && { attachments: [{ filename: `itinerario-vivante-${isPro ? 'pro' : 'basico'}.pdf`, content: pdfBase64 }] }),
        }),
      });
      if (!emailRes.ok) console.error('Resend error:', await emailRes.text());
    }

    // ── Brevo: email upsell Pro vía template (solo para plan básico) ─────────
    if (!isPro) {
      const brevoKey = process.env.BREVO_API_KEY;
      if (brevoKey) {
        // Construir URL del botón de upgrade con todos los datos del formulario
        const upgradeParams = new URLSearchParams({
          n:    formData.nombre || '',
          e:    formData.email  || '',
          dest: formData.destino || '',
          orig: formData.origen  || '',
          dias: String(formData.dias || ''),
          pax:  String(formData.numViajeros || 1),
          fs:   itinerario?.resumen?.fecha_salida  || '',
          fr:   itinerario?.resumen?.fecha_regreso || '',
          int:  Array.isArray(formData.intereses) ? formData.intereses.join(',') : (formData.intereses || ''),
          pre:  String(formData.presupuesto || ''),
          tv:   formData.tipoViaje   || '',
          al:   formData.alojamiento || '',
          rt:   String(formData.ritmo || ''),
        });
        const upgradeUrl = `https://vivevivante.com/upgrade-pro?${upgradeParams.toString()}`;

        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender:     { name: 'VIVANTE', email: 'vive.vivante.ch@gmail.com' },
            to:         [{ email: formData.email, name: formData.nombre }],
            templateId: 1,
            params:     { FIRSTNAME: formData.nombre, UPGRADE_URL: upgradeUrl },
          }),
        }).catch(e => console.error('Brevo upsell error:', e));
      }
    }

    return NextResponse.json({ itinerario, planId });
  } catch (error) {
    console.error('send-itinerary error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
