import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// --- Helper: HTML del email de confirmaci\u00f3n -----------------------------------
function buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto) {
  const coral = '#FF6332';
  const violeta = '#6F42C1';
  const crema = '#FCF8F4';
  const bg1 = '#FFF0EB';
  const bg0 = '#FFF8F5';
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu itinerario VIVANTE</title></head>
<body style="margin:0;padding:0;background:${crema};font-family:Arial,sans-serif;color:#212529;">
<div style="max-width:640px;margin:0 auto;background:${crema};">
  <div style="background:${coral};padding:28px;text-align:center;">
    <p style="color:#fff;font-size:28px;font-weight:800;margin:0 0 4px;letter-spacing:-1px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:0;letter-spacing:2px;">VIAJA M\u00c1S. PLANIFICA MENOS.</p>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#212529;margin:0 0 8px;">\u00a1Hola, ${formData.nombre}! \u2708\ufe0f</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 6px;">Tu plan <strong style="color:${coral};">${planLabel}</strong> est\u00e1 listo.</p>
    ${fechaTexto ? `<p style="color:${violeta};font-style:italic;font-size:14px;margin:0 0 20px;">\ud83d\udcc5 ${fechaTexto}</p>` : ''}
    <div style="background:${bg1};border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="color:${coral};font-size:17px;margin:0 0 12px;">\ud83d\udcca Resumen</h2>
      <p style="margin:4px 0;"><strong>Destino:</strong> ${itinerario.resumen?.destino || formData.destino}</p>
      <p style="margin:4px 0;"><strong>Duraci\u00f3n:</strong> ${formData.dias} d\u00edas &middot; ${formData.numViajeros} viajero${formData.numViajeros > 1 ? 's' : ''}</p>
      <p style="margin:4px 0;"><strong>Fecha de ida:</strong> ${itinerario.resumen?.fecha_salida || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Fecha de vuelta:</strong> ${itinerario.resumen?.fecha_regreso || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Presupuesto estimado:</strong> ${itinerario.presupuesto_desglose?.total || ''}</p>
    </div>
    <div style="background:${coral};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#fff;font-size:14px;margin:0 0 8px;">Tu itinerario completo est\u00e1 adjunto como PDF en este correo.</p>
      <p style="color:#fff;font-size:13px;font-style:italic;margin:0;">\u00bfProblemas? Esc\u00edbenos a <a href="mailto:vive.vivante.ch@gmail.com" style="color:#FFE0D0;">vive.vivante.ch@gmail.com</a></p>
    </div>
    ${(itinerario.dias || []).slice(0, 3).map(dia => `
    <div style="border-left:4px solid ${coral};padding:12px 16px;margin-bottom:16px;background:${bg0};border-radius:0 8px 8px 0;">
      <p style="font-weight:700;color:${coral};margin:0 0 6px;">D\u00eda ${dia.numero}: ${dia.titulo}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">\ud83c\udf05 ${dia.manana?.actividad || ''}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">\ud83c\udf1e ${dia.tarde?.almuerzo || ''}</p>
      <p style="margin:0;color:${violeta};font-size:12px;font-style:italic;">\ud83d\udcb0 ${dia.gasto_dia || ''}</p>
    </div>`).join('')}
    ${(itinerario.dias || []).length > 3 ? `<p style="text-align:center;color:#888;font-size:13px;">... y ${itinerario.dias.length - 3} d\u00edas m\u00e1s en tu itinerario completo (ver PDF adjunto)</p>` : ''}
  </div>
  <div style="background:${coral};padding:32px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 16px;">
      ${itinerario.subtitulo || `\u00a1Solo falta hacer la maleta, ${formData.nombre}!`}
    </p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
      <a href="https://vivevivante.com" style="color:rgba(255,255,255,0.85);">vivevivante.com</a> &middot;
      <a href="https://instagram.com/vive.vivante" style="color:rgba(255,255,255,0.85);">@vive.vivante</a>
    </p>
  </div>
</div>
</body></html>`;
}


// --- URL builder helpers ------------------------------------------------------
function buildAirlineUrl(aerolinea) {
  const a = (aerolinea || '').toLowerCase();
  if (a.includes('latam')) return 'https://www.latam.com/';
  if (a.includes('jetsmart')) return 'https://www.jetsmart.com/';
  if (a.includes('sky') && !a.includes('scanner')) return 'https://www.skyairline.com/';
  if (a.includes('avianca')) return 'https://www.avianca.com/';
  if (a.includes('copa')) return 'https://www.copaair.com/';
  if (a.includes('aerolineas') || a.includes('aerol\u00edneas') || a.includes('argentinas')) return 'https://www.aerolineas.com.ar/';
  if (a.includes('aeromexico') || a.includes('aerom\u00e9xico')) return 'https://www.aeromexico.com/';
  if (a.includes('iberia express') || (a.includes('iberia') && a.includes('express'))) return 'https://www.iberiaexpress.com/';
  if (a.includes('iberia')) return 'https://www.iberia.com/';
  if (a.includes('air europa') || a.includes('aireuropa')) return 'https://www.aireuropa.com/';
  if (a.includes('turkish') || a.includes('thy')) return 'https://www.turkishairlines.com/';
  if (a.includes('air france') || a.includes('airfrance')) return 'https://www.airfrance.com/';
  if (a.includes('klm')) return 'https://www.klm.com/';
  if (a.includes('lufthansa')) return 'https://www.lufthansa.com/';
  if (a.includes('british')) return 'https://www.britishairways.com/';
  if (a.includes('tap') || a.includes('portugal')) return 'https://www.flytap.com/';
  if (a.includes('american')) return 'https://www.aa.com/';
  if (a.includes('united')) return 'https://www.united.com/';
  if (a.includes('delta')) return 'https://www.delta.com/';
  if (a.includes('qatar')) return 'https://www.qatarairways.com/';
  if (a.includes('emirates')) return 'https://www.emirates.com/';
  if (a.includes('singapore')) return 'https://www.singaporeair.com/';
  if (a.includes('japan airlines') || a.includes('jal')) return 'https://www.jal.co.jp/';
  if (a.includes('gol')) return 'https://www.voegol.com.br/';
  if (a.includes('azul')) return 'https://www.voeazul.com.br/';
  return null;
}

function buildAlojamientoUrl(op, destino, checkin, checkout, adults, alojPref) {
  const plat = (op.plataforma || '').toLowerCase();
  const zona  = (op.zona || op.nombre || '').trim();
  const cat   = (op.categoria || '').toLowerCase();
  const searchZona = zona ? `${zona}, ${destino}` : (destino || '');

  if (plat.includes('hostel')) {
    const fmtHW = (d) => { if (!d) return ''; const [y,m,dd]=d.split('-'); return `${dd}%2F${m}%2F${y}`; };
    // Rating minimo diferenciado por categoria: Economico 75, Confort 80, Premium 85
    const minRating = cat.includes('premium') ? 85 : cat.includes('confort') ? 80 : 75;
    return `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(searchZona)}&dateFrom=${fmtHW(checkin)}&dateTo=${fmtHW(checkout)}&numberOfGuests=${adults||2}&min_rating=${minRating}`;
  }
  if (plat.includes('airbnb')) {
    // Tipo de habitacion por categoria: Economico = habitacion privada, Confort/Premium = apartamento entero
    const roomType = cat.includes('econ') ? 'Private room' : 'Entire home/apt';
    const p = new URLSearchParams({ checkin: checkin||'', checkout: checkout||'', adults: adults||2, query: zona || destino });
    p.append('room_types[]', roomType);
    return `https://www.airbnb.com/s/${encodeURIComponent(destino||'')}/homes?${p}`;
  }
  // Booking.com — filtro de estrellas por categoria
  const stars = cat.includes('premium') ? 'class=4;class=5'
              : cat.includes('confort')  ? 'class=3;class=4'
              :                            'class=2;class=3';
  const nflt  = alojPref === 'bnb' ? 'pt=11' : `ht_id=204;${stars}`;
  const p = new URLSearchParams({ ss: searchZona, checkin: checkin||'', checkout: checkout||'', group_adults: adults||2, no_rooms:1, selected_currency:'USD' });
  return `https://www.booking.com/searchresults.html?${p}&nflt=${encodeURIComponent(nflt)}`;
}

function pdfBtn(label, url, color) {
  if (!url) return { text: '' };
  return {
    table: { widths: ['auto'], body: [[{ text: [{ text: label, link: url, color: '#fff', fontSize: 8, bold: true }], border: [false,false,false,false], margin: [8,4,8,4] }]] },
    layout: { fillColor: () => color, hLineWidth: ()=>0, vLineWidth: ()=>0 },
    margin: [0,2,0,2]
  };
}

// ── PDF Generator (brand-compliant pdfmake) ───────────────────────────────────
async function generateItinerarioPdf(itinerario, formData, planLabel) {
  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');
    const vfsFonts = vfsFontsModule.default || vfsFontsModule;
    pdfMake.vfs = vfsFonts?.pdfMake?.vfs || vfsFonts?.vfs || {};

    // Read logo SVG from filesystem
    let logoSvgCover = null;
    let logoSvgBack = null;
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const logoPath = path.join(process.cwd(), 'public', 'images', 'vivante_logo.svg');
      const rawSvg = fs.readFileSync(logoPath, 'utf-8');
      // Remove Google Fonts import (not available in pdfmake) and clean for SVG renderer
      const cleanSvg = rawSvg.replace(/<style>[^<]*<\/style>/gs, '');
      // Cover (coral bg): all strokes + fills → white
      logoSvgCover = cleanSvg
        .replace(/fill="(?!none)[^"]*"/g, 'fill="#fff"')
        .replace(/fill='(?!none)[^']*'/g, "fill='#fff'")
        .replace(/stroke="[^"]*"/g, 'stroke="#fff"')
        .replace(/stroke='[^']*'/g, "stroke='#fff'");
      const CORAL_CONST = '#FF6332';
      // Back cover (white bg): all strokes + fills → coral
      logoSvgBack = cleanSvg
        .replace(/fill="(?!none)[^"]*"/g, `fill="${CORAL_CONST}"`)
        .replace(/fill='(?!none)[^']*'/g, `fill='${CORAL_CONST}'`)
        .replace(/stroke="[^"]*"/g, `stroke="${CORAL_CONST}"`)
        .replace(/stroke='[^']*'/g, `stroke='${CORAL_CONST}'`);
    } catch(e) { /* fallback to text */ }

    const CORAL   = '#FF6332';
    const FUCSIA  = '#E83E8C';
    const VIOLETA = '#6F42C1';
    const CARBON  = '#212529';
    const BG0     = '#FFF8F5';
    const BG1     = '#FFF0EB';
    const isPro   = planLabel.toLowerCase().includes('pro');
    const res     = itinerario.resumen || {};

    const ce = (str) => {
      if (!str && str !== 0) return '';
      return String(str)
        .replace(/\p{Emoji_Presentation}/gu, '')
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\uFE00-\uFE0F]/g, '')
        .replace(/\u200D/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    const secHdr = (txt, col = CORAL) => ({
      table: { widths: ['*'], body: [[{ text: txt, bold: true, fontSize: 12, color: '#fff', margin: [10, 7, 10, 7], border: [false,false,false,false] }]] },
      layout: 'noBorders', fillColor: col, margin: [0, 14, 0, 6],
    });

    const content = [];

    // ── PORTADA ───────────────────────────────────────────────────────────────
    content.push({ text: '', margin: [0, 50, 0, 0] });
    if (logoSvgCover) {
      content.push({ svg: logoSvgCover, width: 160, alignment: 'center', margin: [0, 0, 0, 10] });
    } else {
      content.push({ text: 'VIVANTE', fontSize: 54, bold: true, color: '#fff', alignment: 'center', margin: [0, 0, 0, 6] });
    }
    content.push({ text: 'VIAJA M\u00c1S \u00b7 PLANIFICA MENOS', fontSize: 9, color: 'rgba(255,255,255,0.75)', alignment: 'center', characterSpacing: 2, margin: [0, 0, 0, 20] });
    content.push({ canvas: [{ type: 'line', x1: 80, y1: 0, x2: 443, y2: 0, lineWidth: 0.5, lineColor: 'rgba(255,255,255,0.35)' }], margin: [0, 0, 0, 20] });
    content.push({
      table: { widths: ['auto'], body: [[{ text: ce(planLabel).toUpperCase(), bold: true, fontSize: 9, color: CORAL, margin: [14, 5, 14, 5], border: [false,false,false,false] }]] },
      layout: 'noBorders', fillColor: '#fff', alignment: 'center', margin: [0, 0, 0, 22],
    });
    content.push({ text: ce(itinerario.titulo) || `Itinerario: ${formData.destino}`, fontSize: 21, bold: true, color: '#fff', alignment: 'center', margin: [0, 0, 0, 8] });
    if (itinerario.subtitulo) content.push({ text: ce(itinerario.subtitulo), fontSize: 11, italics: true, color: 'rgba(255,255,255,0.9)', alignment: 'center', margin: [0, 0, 0, 28] });

    const coverRows = [
      res.destino || formData.destino ? ['Destino', res.destino || formData.destino] : null,
      formData.origen               ? ['Origen', formData.origen]                 : null,
      res.fecha_salida              ? ['Ida', res.fecha_salida]                    : null,
      res.fecha_regreso             ? ['Vuelta', res.fecha_regreso]                : null,
      formData.dias                 ? ['Duracion', `${formData.dias} d\u00edas`] : null,
      formData.numViajeros          ? ['Viajeros', String(formData.numViajeros)]   : null,
      itinerario.presupuesto_desglose?.total ? ['Presupuesto', itinerario.presupuesto_desglose.total] : null,
    ].filter(Boolean);

    if (coverRows.length) {
      content.push({
        table: {
          widths: [100, '*'],
          body: coverRows.map(([k, v]) => [
            { text: k, fontSize: 9, bold: true, color: '#fff', border: [false,false,false,false], margin: [8,5,4,5], fillColor: 'rgba(0,0,0,0.12)' },
            { text: String(v), fontSize: 9, color: '#fff', border: [false,false,false,false], margin: [4,5,8,5], fillColor: 'rgba(0,0,0,0.08)' },
          ])
        },
        layout: { hLineWidth: () => 0.3, hLineColor: () => 'rgba(255,255,255,0.2)', vLineWidth: () => 0 },
        margin: [40, 0, 40, 24],
      });
    }
    content.push({ text: 'vivevivante.com  \u00b7  @vive.vivante', fontSize: 8, color: 'rgba(255,255,255,0.55)', alignment: 'center', margin: [0, 12, 0, 0] });
    content.push({ text: '', pageBreak: 'after' });

    // ── RESUMEN ───────────────────────────────────────────────────────────────
    if (coverRows.length) {
      content.push(secHdr('RESUMEN DEL VIAJE'));
      const resumenRows = [
        ...coverRows,
        res.fecha_optima_texto ? ['Mejor epoca', res.fecha_optima_texto] : null,
        res.distribucion      ? ['Distribucion', res.distribucion]      : null,
        res.ritmo             ? ['Ritmo', res.ritmo]                    : null,
      ].filter(Boolean);
      content.push({
        table: {
          widths: [120, '*'],
          body: resumenRows.map(([k, v], i) => [
            { text: k, fontSize: 9, bold: true, color: CARBON, fillColor: i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
            { text: String(v), fontSize: 9, color: CARBON, fillColor: i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
          ])
        },
        layout: { hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
        margin: [0, 0, 0, 8],
      });
    }

    // ── PRESUPUESTO ───────────────────────────────────────────────────────────
    if (itinerario.presupuesto_desglose) {
      content.push(secHdr('PRESUPUESTO ESTIMADO'));
      const pd = itinerario.presupuesto_desglose;
      const budRows = [
        pd.vuelos      ? ['Vuelos', pd.vuelos]           : null,
        pd.alojamiento ? ['Alojamiento', pd.alojamiento]    : null,
        pd.comidas     ? ['Comidas', pd.comidas]      : null,
        pd.transporte  ? ['Transporte', pd.transporte]      : null,
        pd.actividades ? ['Actividades', pd.actividades] : null,
        pd.extras      ? ['Extras', pd.extras]        : null,
        pd.total       ? ['TOTAL ESTIMADO', pd.total]     : null,
      ].filter(Boolean);
      if (budRows.length) {
        content.push({
          table: {
            widths: ['*', 110],
            body: budRows.map(([k, v], i) => {
              const isTotal = k.startsWith('TOTAL');
              return [
                { text: k, fontSize: 9, bold: isTotal, color: isTotal?'#fff':CARBON, fillColor: isTotal?CORAL:(i%2===0?BG1:'#fff'), border:[false,false,false,false], margin:[8,6,4,6] },
                { text: String(v), fontSize: 9, bold: isTotal, color: isTotal?'#fff':CORAL, fillColor: isTotal?CORAL:(i%2===0?BG1:'#fff'), alignment:'right', border:[false,false,false,false], margin:[4,6,8,6] },
              ];
            })
          },
          layout: { hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
          margin: [0, 0, 0, 8],
        });
      }
    }

    // ── ITINERARIO DIA A DIA ──────────────────────────────────────────────────
    if (itinerario.dias?.length) {
      content.push({ text:'', pageBreak:'before' });
      content.push(secHdr('ITINERARIO DIA A DIA'));
      itinerario.dias.forEach((dia, di) => {
        const dayRows = [];
        if (dia.manana?.actividad) {
          dayRows.push([
            { text:'MANANA', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
            { text: ce(dia.manana.actividad) + (dia.manana.costo ? `  ${dia.manana.costo}` : ''), fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
          ]);
          if (dia.manana.tip) dayRows.push([
            { text:'', border:[false,false,false,false], fillColor:'#fff' },
            { text:`TIP: ${ce(dia.manana.tip)}`, fontSize:7, color:VIOLETA, italics:true, border:[false,false,false,false], fillColor:'#fff', margin:[4,0,4,4] },
          ]);
        }
        if (dia.tarde?.actividad) {
          dayRows.push([
            { text:'TARDE', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:BG0, margin:[4,5,4,4] },
            { text:(dia.tarde.almuerzo?`ALM.: ${ce(dia.tarde.almuerzo)}  `:'') + ce(dia.tarde.actividad), fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:BG0, margin:[4,5,4,4] },
          ]);
        }
        if (dia.noche?.actividad || dia.noche?.cena) {
          const nt = [dia.noche?.cena?`CENA: ${ce(dia.noche.cena)}`:'', ce(dia.noche?.actividad||'')].filter(Boolean).join('  ');
          dayRows.push([
            { text:'NOCHE', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
            { text:nt, fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
          ]);
        }
        if (dia.gasto_dia) {
          dayRows.push([
            { text:'GASTO DEL DIA', bold:true, fontSize:8, color:VIOLETA, border:[false,false,false,false], fillColor:BG1, margin:[4,5,4,5] },
            { text:String(dia.gasto_dia), fontSize:8, bold:true, color:VIOLETA, alignment:'right', border:[false,false,false,false], fillColor:BG1, margin:[4,5,4,5] },
          ]);
        }
        if (dia.ruta_optimizada) {
          dayRows.push([
            { text: 'RUTA', bold: true, fontSize: 7, color: '#666', border:[false,false,false,false], fillColor: BG1, margin:[4,4,4,4] },
            { text: ce(dia.ruta_optimizada), fontSize: 7, color: '#666', border:[false,false,false,false], fillColor: BG1, margin:[4,4,4,4] },
          ]);
        }
        if (dia.manana?.plan_b) {
          dayRows.push([
            { text: 'PLAN B', bold: true, fontSize: 7, color: '#aaa', border:[false,false,false,false], fillColor:'#fff', margin:[4,3,4,3] },
            { text: ce(dia.manana.plan_b), fontSize: 7, color:'#aaa', italics:true, border:[false,false,false,false], fillColor:'#fff', margin:[4,3,4,3] },
          ]);
        }
        const colHdr = di % 2 === 0 ? CORAL : FUCSIA;
        const dayStack = [
          {
            table:{ widths:['*'], body:[[{ text:`D\u00eda ${dia.numero}: ${ce(dia.titulo)||''}`, bold:true, fontSize:11, color:'#fff', border:[false,false,false,false], margin:[10,7,10,7] }]] },
            layout:'noBorders', fillColor:colHdr, margin:[0, di===0?0:10, 0, 0],
          }
        ];
        if (dayRows.length) {
          dayStack.push({
            table:{ widths:[80,'*'], body:dayRows },
            layout:{ hLineWidth:(i)=>i===0||i===dayRows.length?0:0.3, hLineColor:()=>'#eee', vLineWidth:(i)=>i===1?0.3:0, vLineColor:()=>'#eee' },
            margin:[0,0,0,0],
          });
        }
        if (dia.tip_local) {
          dayStack.push({ text:`TIP: ${ce(dia.tip_local)}`, fontSize:8, color:VIOLETA, italics:true, margin:[8,3,8,3] });
        }
        content.push({ stack: dayStack, unbreakable: true });
      });
    }

    // ── VUELOS ────────────────────────────────────────────────────────────────
    if (itinerario.vuelos?.length) {
      content.push({ text:'', pageBreak:'before' });
      content.push(secHdr('VUELOS RECOMENDADOS'));
      const fHdr = ['Aerol\u00ednea','Ruta / Escala','Precio est.','Duraci\u00f3n','Tip','Ver'].map((t) => ({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const fRows = itinerario.vuelos.map((v,i) => [
        { text:ce(v.aerolinea)||'', fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:(v.ruta||'').replace(/ \? /g, ' > ')+(v.escala?`\n${v.escala}`:''), fontSize:8, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.precio_estimado||'\u2014', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.duracion||'\u2014', fontSize:8, color:'#666', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:ce(v.tip)||'\u2014', fontSize:7, color:VIOLETA, italics:true, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        pdfBtn('Ver vuelo >', buildAirlineUrl(v.aerolinea), CORAL),
      ]);
      content.push({
        table:{ widths:[80,100,60,46,'*',60], body:[fHdr,...fRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,6], dontBreakRows: true,
      });
      if (itinerario._vuelos_links?.google_flights) {
        content.push({
          columns:[{ width:'auto', stack:[pdfBtn('Buscar en Google Flights >', itinerario._vuelos_links.google_flights, '#4285F4')] }],
          margin:[0,4,0,8],
        });
      }
    }

    // ── ALOJAMIENTO ───────────────────────────────────────────────────────────
    if (itinerario.alojamiento?.length) {
      content.push(secHdr('ALOJAMIENTO'));
      itinerario.alojamiento.forEach((zona) => {
        if (zona.destino) content.push({ text:`${zona.destino}${zona.noches?` \u2014 ${zona.noches} noches`:''}`, fontSize:9, bold:true, color:VIOLETA, margin:[0,4,0,5] });
        const hHdr = ['Categor\u00eda','Hotel / Puntuaci\u00f3n','Precio/noche','Por qu\u00e9 elegirlo','Reservar'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:VIOLETA, border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const hRows = (zona.opciones||[]).map((op,i)=>[
          { text:op.categoria||'\u2014', fontSize:8, bold:true, color:op.categoria==='Premium'?FUCSIA:CORAL, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(op.nombre||'')+(op.puntuacion?`\n${op.puntuacion}`:'')+(op.cancelacion?.toLowerCase().includes('gratuita')?'\nCancelacion gratuita':''), fontSize:8, color:CARBON, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:op.precio_noche||'\u2014', fontSize:8, bold:true, color:VIOLETA, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(op.por_que)||'\u2014', fontSize:7, color:'#555', italics:true, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          pdfBtn('Buscar disponibilidad >', buildAlojamientoUrl(op, zona.destino, res.fecha_salida, res.fecha_regreso, formData?.numViajeros, formData?.alojamiento), VIOLETA),
        ]);
        content.push({
          table:{ widths:[55,100,65,'*',55], body:[hHdr,...hRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8], dontBreakRows: true,
        });
      });
    }


    // ── RESTAURANTES ──────────────────────────────────────────────────────────
    if (itinerario.restaurantes) {
      content.push(secHdr('RESTAURANTES RECOMENDADOS'));
      const restData = Array.isArray(itinerario.restaurantes)
        ? { [(res.destino||formData.destino||'Destino').split(',')[0]]: itinerario.restaurantes }
        : itinerario.restaurantes;
      Object.entries(restData).forEach(([ciudad, lista]) => {
        if (Object.keys(restData).length > 1) content.push({ text:`${ciudad}`, fontSize:9, bold:true, color:CORAL, margin:[0,5,0,4] });
        const rHdr = ['Restaurante','Ubicacion','Tipo','Precio','Reservar'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const rRows = (lista||[]).map((r,i)=>[
          { text:ce(r.nombre)+(r.por_que?`\n${ce(r.por_que)}`:''), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text: ce(r.ubicacion||'\u2014'), fontSize:7, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.tipo||'\u2014', fontSize:8, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.precio_promedio||'\u2014', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          r.link_reserva
            ? pdfBtn(r.requiere_reserva ? 'Reservar >' : 'Ver >', r.link_reserva, r.requiere_reserva ? FUCSIA : CORAL)
            : r.instagram
            ? pdfBtn(r.instagram, 'https://instagram.com/' + (r.instagram||'').replace('@',''), '#E1306C')
            : { text: r.requiere_reserva ? 'Si, reservar' : '\u2014', fontSize:7, color: r.requiere_reserva ? '#27ae60' : '#aaa', border:[false,false,false,false], margin:[4,5,4,5] },
        ]);
        content.push({
          table:{ widths:['*',65,62,55,52], body:[rHdr,...rRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8], dontBreakRows: true,
        });
      });
    }


    // ── EXPERIENCIAS ──────────────────────────────────────────────────────────
    if (itinerario.experiencias?.length) {
      content.push(secHdr('EXPERIENCIAS Y TOURS', FUCSIA));
      // 5 cols (sin Anticipacion) para dar espacio suficiente a botones de reserva
      const eHdr = ['Experiencia','Por que vale','Duracion','Precio','Reservar'].map(t=>({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:FUCSIA, border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const eRows = itinerario.experiencias.map((e,i)=>{
        const destRaw = (res.destino || (formData && formData.destino) || '').split(/[,(]/)[0].trim();
        const qPlus = ((e.nombre||'') + ' ' + destRaw).trim().replace(/\s+/g, '+');
        const gygUrl = `https://www.getyourguide.com/s/?q=${qPlus}&partner_id=UCJJVUD`;
        const civiSlug = destRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
        const civiUrl = `https://www.civitatis.com/es/${civiSlug}/?q=${encodeURIComponent(e.nombre||'')}`;
        const plats = e.plataformas_disponibles;
        const showGyg = !plats || plats.includes('GetYourGuide');
        const showCivi = !plats || plats.includes('Civitatis') || plats.includes('Viator');
        const bg = i%2===0?'#FFF0F7':'#fff';
        let reservarCell;
        if (showGyg && showCivi) {
          reservarCell = { stack: [pdfBtn('GetYourGuide >', gygUrl, '#FF6600'), pdfBtn('Civitatis >', civiUrl, '#00A651')], border:[false,false,false,false], fillColor:bg, margin:[2,3,2,3] };
        } else if (showGyg) {
          reservarCell = { ...pdfBtn('GetYourGuide >', gygUrl, '#FF6600'), border:[false,false,false,false], fillColor:bg };
        } else if (showCivi) {
          reservarCell = { ...pdfBtn('Civitatis >', civiUrl, '#00A651'), border:[false,false,false,false], fillColor:bg };
        } else {
          reservarCell = { text:'Reservar local', fontSize:7, color:'#999', border:[false,false,false,false], margin:[4,5,4,5] };
        }
        return [
          { text:ce(e.nombre||'-'), fontSize:8, bold:true, color:CARBON, fillColor:bg, border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(e.por_que_vale||'-'), fontSize:7, color:'#555', italics:true, fillColor:bg, border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(e.duracion||'-'), fontSize:8, color:'#666', fillColor:bg, border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(e.precio||'-'), fontSize:8, bold:true, color:FUCSIA, fillColor:bg, border:[false,false,false,false], margin:[4,5,4,5] },
          reservarCell,
        ];
      });
      content.push({
        table:{ widths:['*','*',44,50,80], body:[eHdr,...eRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,8], dontBreakRows: true,
      });
    }

    // ── TIPS CULTURALES (Pro — mostrar primero como en la web) ────────────────
    if (isPro && itinerario.tips_culturales?.length) {
      content.push(secHdr('TIPS CULTURALES, CONECTIVIDAD Y DINERO', VIOLETA));
      itinerario.tips_culturales.forEach((tip, i) => {
        content.push({
          table: { widths: [18,'*'], body: [[
            { text:`${i+1}.`, bold:true, fontSize:8, color:VIOLETA, border:[false,false,false,false], margin:[4,4,2,4] },
            { text: ce(typeof tip === 'string' ? tip : (tip.texto||JSON.stringify(tip))), fontSize:8, color:CARBON, border:[false,false,false,false], margin:[2,4,4,4] },
          ]] },
          layout:'noBorders', fillColor: i%2===0?'#F5F0FF':'#fff', margin:[0,0,0,0],
        });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── TIPS CLAVE ────────────────────────────────────────────────────────────
    if (itinerario.tips?.length) {
      content.push(secHdr('TIPS CLAVE'));
      itinerario.tips.forEach((tip, i) => {
        const tipText = typeof tip === 'string' ? tip : (tip.texto || tip.tip || JSON.stringify(tip));
        content.push({
          table:{ widths:[18,'*'], body:[[
            { text:`${i+1}.`, bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], margin:[4,4,2,4] },
            { text:ce(tipText), fontSize:8, color:CARBON, border:[false,false,false,false], margin:[2,4,4,4] },
          ]] },
          layout:'noBorders', fillColor: i%2===0?BG0:'#fff', margin:[0,0,0,0],
        });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── DINERO Y PAGOS ────────────────────────────────────────────────────────
    if (itinerario.dinero) {
      content.push(secHdr('DINERO Y PAGOS'));
      const d = itinerario.dinero;
      const dineroRows = [
        d.moneda_local       ? ['Moneda local', ce(d.moneda_local)] : null,
        d.tipo_cambio        ? ['Tipo de cambio', ce(d.tipo_cambio)] : null,
        d.tarjeta_o_efectivo ? ['Tarjeta o efectivo', ce(d.tarjeta_o_efectivo)] : null,
        d.donde_cambiar      ? ['Donde cambiar', ce(d.donde_cambiar)] : null,
        d.cajeros            ? ['Cajeros', ce(d.cajeros)] : null,
        d.propinas           ? ['Propinas', ce(d.propinas)] : null,
      ].filter(Boolean);
      content.push({
        table: { widths: [110,'*'], body: dineroRows.map(([k,v],i) => [
          { text:k, fontSize:9, bold:true, color:CARBON, fillColor: i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
          { text:v, fontSize:9, color:CARBON, fillColor: i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
        ]) },
        layout: { hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
        margin:[0,0,0,8],
      });
      if (d.tip_extra) content.push({ text: `TIP: ${ce(d.tip_extra)}`, fontSize:8, color:VIOLETA, italics:true, margin:[0,0,0,8] });
    }

    // ── SEGURO DE VIAJE ───────────────────────────────────────────────────────
    if (itinerario.seguro?.length) {
      content.push(secHdr('SEGURO DE VIAJE'));
      const base = itinerario.seguro || [];
      const hasIati = base.some(s => s.nombre?.toLowerCase().includes('iati'));
      const seguros = hasIati ? base : [...base, { nombre:'IATI Seguros', cobertura:'Cancelacion, asistencia medica, equipaje y accidentes', precio_estimado:'Desde $50 USD', link:'https://www.iatiseguros.com/' }];
      const sHdr = ['Seguro','Cobertura','Precio aprox.','Ver'].map(t=>({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const sRows = seguros.map((s,i) => {
        const href = s.nombre?.toLowerCase().includes('iati') ? 'https://www.iatiseguros.com/' : (s.link||null);
        return [
          { text: ce(s.nombre||'\u2014'), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text: ce(s.cobertura||'\u2014'), fontSize:7, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text: ce(s.precio_estimado||'\u2014'), fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          href ? pdfBtn('Cotizar >', href, CORAL) : { text:'\u2014', fontSize:8, color:'#aaa', border:[false,false,false,false], margin:[4,5,4,5] },
        ];
      });
      content.push({
        table:{ widths:['*','*',70,60], body:[sHdr,...sRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,8], dontBreakRows: true,
      });
    }

    // ── CHECKLIST PRE-VIAJE ───────────────────────────────────────────────────
    if (itinerario.checklist?.length) {
      content.push(secHdr('CHECKLIST PRE-VIAJE'));
      const checkPairs = [];
      itinerario.checklist.forEach((item, i) => {
        if (i % 2 === 0) checkPairs.push([item]);
        else checkPairs[checkPairs.length - 1].push(item);
      });
      checkPairs.forEach((pair) => {
        const cells = pair.map(item => ({
          stack: [{
            columns: [
              { width: 10, canvas: [{ type: 'rect', x: 0, y: 2, w: 8, h: 8, lineWidth: 1, lineColor: CORAL }] },
              { width: '*', text: ce(item), fontSize: 8, color: CARBON, margin: [4, 0, 0, 0] },
            ]
          }],
          border:[false,false,false,false], margin:[4,4,4,4],
        }));
        if (cells.length === 1) cells.push({ text: '', border:[false,false,false,false] });
        content.push({ table:{ widths:['*','*'], body:[cells] }, layout:'noBorders', margin:[0,0,0,2] });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── CONTACTOS DE EMERGENCIA ───────────────────────────────────────────────
    if (itinerario.emergencias) {
      content.push(secHdr('CONTACTOS DE EMERGENCIA', '#c0392b'));
      const em = itinerario.emergencias;
      [
        ['Embajada chilena', em.embajada],
        ['Emergencias', em.emergencias_local],
        ['Policia turistica', em.policia_turistica],
      ].filter(r => r[1]).forEach(([l, v]) => {
        content.push({ text:[{ text:`${l}: `, bold:true, fontSize:9, color:CARBON },{ text:ce(v), fontSize:9, color:CARBON }], margin:[0,3,0,3] });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── LO IMPERDIBLE ─────────────────────────────────────────────────────────
    if (itinerario.lo_imperdible?.length) {
      content.push(secHdr('LO IMPERDIBLE', FUCSIA));
      itinerario.lo_imperdible.forEach((item, i) => {
        content.push({ text:`${i+1}. ${ce(item.nombre)}`, fontSize:10, bold:true, color:CARBON, margin:[0,6,0,2] });
        content.push({ text:ce(item.descripcion)||'', fontSize:8, color:'#555', margin:[0,0,0,6] });
        if (i < itinerario.lo_imperdible.length - 1) content.push({ canvas:[{ type:'line', x1:0, y1:0, x2:523, y2:0, lineWidth:0.4, lineColor:'#FFD0E8' }], margin:[0,0,0,6] });
      });
    }

    // Mas cosas para hacer (Pro extras)
    if (isPro && itinerario.extras?.length) {
      content.push(secHdr('MAS COSAS PARA HACER', CORAL));
      itinerario.extras.forEach((ex) => {
        content.push({ text: ce(ex.categoria||''), fontSize: 9, bold: true, color: CORAL, margin:[0,4,0,2] });
        (ex.actividades||[]).forEach((a) => {
          content.push({ text: `\u2022 ${ce(a)}`, fontSize: 8, color: CARBON, margin:[8,1,0,1] });
        });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── PRO: BARES Y VIDA NOCTURNA ────────────────────────────────────────────
    if (isPro) {
      const baresData = itinerario.bares_vida_nocturna;
      const hasBares = baresData && (Array.isArray(baresData) ? baresData.length > 0 : Object.keys(baresData).length > 0);
      if (hasBares) {
        const baresByCiudad = (baresData && typeof baresData === 'object' && !Array.isArray(baresData))
          ? baresData
          : { [(res.destino||formData.destino||'Destino').split(',')[0]]: (Array.isArray(baresData) ? baresData : []) };
        Object.entries(baresByCiudad).forEach(([ciudad, lista]) => {
          content.push(secHdr(`BARES Y VIDA NOCTURNA \u2014 ${ciudad}`));
          (lista||[]).forEach(b => {
            content.push({ text:`\u2022 ${ce(b.nombre)||''}${b.tipo_ambiente?` \u2014 ${ce(b.tipo_ambiente)}`:''}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
            if (b.precio_trago || b.mejor_dia) content.push({ text:`  ${b.precio_trago?ce(b.precio_trago):''}${b.precio_trago&&b.mejor_dia?' \u00b7 ':''}${b.mejor_dia?ce(b.mejor_dia):''}`, fontSize:8, color:'#666', margin:[16,0,8,2] });
            if (b.tip) content.push({ text:`  TIP: ${ce(b.tip)}`, fontSize:8, color:VIOLETA, italics:true, margin:[16,0,8,4] });
          });
        });
      }
    }

    // ── PRO: TRANSPORTE LOCAL ─────────────────────────────────────────────────
    if (isPro && itinerario.transporte_local) {
      content.push(secHdr('TRANSPORTE LOCAL'));
      const tl = itinerario.transporte_local;
      const tlRows = [
        tl.como_moverse          ? ['Como moverse', ce(tl.como_moverse)] : null,
        tl.apps_recomendadas?.length ? ['Apps recomendadas', (tl.apps_recomendadas||[]).join(', ')] : null,
        tl.tarjeta_transporte    ? ['Tarjeta de transporte', ce(tl.tarjeta_transporte)] : null,
        tl.conviene_auto         ? ['Alquilar auto', ce(tl.conviene_auto)] : null,
      ].filter(Boolean);
      if (tlRows.length) {
        content.push({
          table:{ widths:[110,'*'], body:tlRows.map(([k,v],i)=>[
            { text:k, fontSize:9, bold:true, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
            { text:v, fontSize:9, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
          ])},
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
          margin:[0,0,0,8],
        });
      }
      const opciones = Array.isArray(tl.opciones_aeropuerto_centro) && tl.opciones_aeropuerto_centro.length > 0
        ? tl.opciones_aeropuerto_centro : null;
      const fallback = tl.costo_aeropuerto_centro;
      if (opciones || fallback) {
        content.push({ text: 'Aeropuerto  Centro:', fontSize:9, bold:true, color:CORAL, margin:[0,4,0,5] });
        if (opciones) {
          const aoHdr = ['Medio','Costo estimado','Duracion','Tip'].map(t=>({
            text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,5,4,5]
          }));
          const aoRows = opciones.map((op,i)=>[
            { text:ce(op.medio||'\u2014'), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,4,4,4] },
            { text:ce(op.costo||'\u2014'), fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,4,4,4] },
            { text:ce(op.duracion||'\u2014'), fontSize:8, color:'#666', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,4,4,4] },
            { text:ce(op.tip||'\u2014'), fontSize:7, color:VIOLETA, italics:true, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,4,4,4] },
          ]);
          content.push({
            table:{ widths:['*',80,60,'*'], body:[aoHdr,...aoRows] },
            layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
            margin:[0,0,0,8], dontBreakRows: true,
          });
        } else {
          content.push({ text: ce(fallback), fontSize:9, color:CARBON, margin:[0,0,0,8] });
        }
      }
      if (itinerario.festivos_horarios && Object.keys(itinerario.festivos_horarios).length) {
        content.push(secHdr('FESTIVOS Y HORARIOS', VIOLETA));
        Object.entries(itinerario.festivos_horarios).filter(([,v])=>v).forEach(([k,v],i)=>{
          content.push({
            table:{ widths:[110,'*'], body:[[
              { text:ce(k.replace(/_/g,' ')), fontSize:9, bold:true, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
              { text:ce(v), fontSize:9, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
            ]]},
            layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
            margin:[0,0,0,2],
          });
        });
        content.push({ text:'', margin:[0,0,0,8] });
      }
      if (itinerario.salud_seguridad) {
        content.push(secHdr('SALUD Y SEGURIDAD', '#c0392b'));
        const ss = itinerario.salud_seguridad;
        [
          ['Vacunas', ss.vacunas],
          ['Agua potable', ss.agua_potable],
          ['Nivel de seguridad', ss.nivel_seguridad],
          ['Zonas a evitar', ss.zonas_evitar],
          ['Estafas comunes', ss.estafas_comunes],
        ].filter(r=>r[1]).forEach(([l,v],i)=>{
          content.push({
            table:{ widths:[110,'*'], body:[[
              { text:ce(l), fontSize:9, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
              { text:ce(v), fontSize:9, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
            ]]},
            layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
            margin:[0,0,0,2],
          });
        });
        content.push({ text:'', margin:[0,0,0,8] });
      }
      if (itinerario.idioma_cultura) {
        content.push(secHdr('IDIOMA Y CULTURA', VIOLETA));
        const ic = itinerario.idioma_cultura;
        if (ic.costumbres) content.push({ text:[{ text:'Costumbres: ', bold:true, fontSize:9, color:CARBON },{ text:ce(ic.costumbres), fontSize:9, color:CARBON }], margin:[0,3,0,3] });
        if (ic.vestimenta) content.push({ text:[{ text:'Vestimenta: ', bold:true, fontSize:9, color:CARBON },{ text:ce(ic.vestimenta), fontSize:9, color:CARBON }], margin:[0,3,0,6] });
        if (ic.frases_utiles?.length) {
          content.push({ text:'Frases utiles:', fontSize:9, bold:true, color:CARBON, margin:[0,4,0,4] });
          ic.frases_utiles.forEach((f,i)=>{
            const fText = [
              f.frase_local ? ce(f.frase_local) : '',
              f.pronunciacion ? `(${ce(f.pronunciacion)})` : '',
              f.significado ? `\u2192 ${ce(f.significado)}` : '',
            ].filter(Boolean).join('  ');
            content.push({ text:fText, fontSize:8, color:VIOLETA, fillColor:i%2===0?'#F5F0FF':'#fff', margin:[4,3,4,3] });
          });
        }
        content.push({ text:'', margin:[0,0,0,8] });
      }
    }

    // ── PRO: CONECTIVIDAD ─────────────────────────────────────────────────────
    if (isPro && itinerario.conectividad) {
      content.push(secHdr('CONECTIVIDAD'));
      const co = itinerario.conectividad;
      const coRows = [
        co.esim_recomendada ? ['eSIM recomendada', ce(co.esim_recomendada)] : null,
        co.sim_local        ? ['SIM local', ce(co.sim_local)] : null,
        co.roaming          ? ['Roaming', ce(co.roaming)] : null,
        co.wifi_destino     ? ['WiFi en destino', ce(co.wifi_destino)] : null,
        co.apps_descargar?.length ? ['Apps a descargar', (co.apps_descargar||[]).join(', ')] : null,
      ].filter(Boolean);
      if (coRows.length) {
        content.push({
          table:{ widths:[110,'*'], body:coRows.map(([k,v],i)=>[
            { text:k, fontSize:9, bold:true, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
            { text:v, fontSize:9, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
          ])},
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
          margin:[0,0,0,6],
        });
      }
      if (co.esim_recomendada) {
        content.push({
          columns:[{ width:'auto', stack:[pdfBtn('Comprar eSIM en Airalo >', 'https://airalo.tpx.lt/UPNJmvRR', '#1a1a2e')] }],
          margin:[0,4,0,8],
        });
      }
    }

    // ── PRO: QUE EMPACAR ──────────────────────────────────────────────────────
    if (isPro && itinerario.que_empacar) {
      content.push(secHdr('QUE EMPACAR'));
      const qe = itinerario.que_empacar;
      if (qe.clima_esperado) content.push({ text:`Clima esperado: ${ce(qe.clima_esperado)}`, fontSize:9, color:CARBON, margin:[0,0,0,6] });
      if (qe.ropa?.length) {
        content.push({ text:'Ropa a empacar:', fontSize:9, bold:true, color:CARBON, margin:[0,4,0,4] });
        qe.ropa.forEach(item => content.push({ text:`\u2022 ${ce(item)}`, fontSize:9, color:CARBON, margin:[8,1,0,1] }));
      } else {
        if (qe.esencial?.length) content.push({ text:`Esencial: ${qe.esencial.join(', ')}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
        if (qe.recomendado?.length) content.push({ text:`Recomendado: ${qe.recomendado.join(', ')}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
      }
      if (qe.adaptador_enchufe) content.push({ text:`\u2022 Adaptador de enchufe: ${ce(qe.adaptador_enchufe)}`, fontSize:9, color:CARBON, margin:[8,2,0,2] });
      if (qe.botiquin?.length) {
        content.push({ text:'Botiquin:', fontSize:9, bold:true, color:CARBON, margin:[0,6,0,4] });
        qe.botiquin.forEach(item => content.push({ text:`\u2022 ${ce(item)}`, fontSize:9, color:CARBON, margin:[8,1,0,1] }));
      }
      if (qe.power_bank) content.push({ text:`\u2022 Power bank: ${ce(qe.power_bank)}`, fontSize:9, color:CARBON, margin:[8,2,0,2] });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── BACK COVER ────────────────────────────────────────────────────────────
    content.push({ text:'', pageBreak:'before' });
    content.push({ text:'', margin:[0,100,0,0] });
    if (logoSvgBack) {
      content.push({ svg: logoSvgBack, width: 120, alignment: 'center', margin: [0, 0, 0, 10] });
    } else {
      content.push({ text:'VIVANTE', fontSize:42, bold:true, color:CORAL, alignment:'center', margin:[0,0,0,8] });
    }
    content.push({ text:'VIAJA M\u00c1S \u00b7 PLANIFICA MENOS', fontSize:9, color:'#888', alignment:'center', characterSpacing:2, margin:[0,0,0,16] });
    content.push({ canvas:[{ type:'line', x1:80, y1:0, x2:443, y2:0, lineWidth:1, lineColor:CORAL }], margin:[0,0,0,16] });
    content.push({ text:`\u00a1Que tengas el viaje de tu vida${formData.nombre?', '+formData.nombre:''}!`, fontSize:13, italics:true, color:'#555', alignment:'center', margin:[0,0,0,20] });
    content.push({ text:'vivevivante.com  \u00b7  @vive.vivante', fontSize:10, color:'#aaa', alignment:'center', margin:[0,0,0,0] });

    // ── DOCUMENT DEFINITION ───────────────────────────────────────────────────
    const docDefinition = {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 9, color: CARBON, lineHeight: 1.45 },
      pageMargins: [36, 58, 36, 42],
      info: {
        title: itinerario.titulo || 'Itinerario VIVANTE',
        author: 'VIVANTE \u2014 vivevivante.com',
        subject: `Itinerario ${formData.destino}`,
      },
      header: (currentPage, pageCount) => {
        if (currentPage === 1 || currentPage === pageCount) return null;
        return {
          stack: [
            {
              columns: [
                { text: 'VIVANTE', bold: true, fontSize: 11, color: CORAL, margin: [36, 13, 0, 0] },
                { text: (itinerario.titulo || formData.destino || '').split(',')[0].trim().substring(0, 35),
                  fontSize: 8, color: '#999', margin: [8, 16, 0, 0] },
                { text: ce(planLabel), bold: true, fontSize: 8, color: CORAL, alignment: 'right', margin: [0, 13, 36, 0] },
              ]
            },
            { canvas: [{ type: 'line', x1: 36, y1: 0, x2: 559, y2: 0, lineWidth: 0.6, lineColor: CORAL }] }
          ]
        };
      },
      footer: (currentPage, pageCount) => {
        if (currentPage === 1) return null;
        return {
          text: `${currentPage} / ${pageCount}  \u00b7  vivevivante.com`,
          fontSize: 7, color: '#ccc', alignment: 'center', margin: [0, 0, 0, 10]
        };
      },
      background: (currentPage) => {
        if (currentPage === 1) {
          return { canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: CORAL }] };
        }
        return null;
      },
    };

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('PDF timeout')), 30000);
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
    console.error('[generate-pdf] PDF generation error:', e.message);
    return null;
  }
}


// --- A: Tabla de contexto de viaje por origen?destino ------------------------
// Devuelve texto con info de visa/pasaporte y adaptador para inyectar en el checklist
function getCountryTravelContext(origenStr, destinoStr) {
  const o = (origenStr || '').toLowerCase();
  const d = (destinoStr || '').toLowerCase();

  const isChile     = o.includes('chile') || o.includes('santiago') || o.includes('scl') || o.includes('valpara�so') || o.includes('valparaiso') || o.includes('concepci�n') || o.includes('concepcion');
  const isArgentina = o.includes('argentin') || o.includes('buenos aires') || o.includes('c�rdoba') || o.includes('cordoba') || o.includes('rosario') || o.includes('mendoza') || o.includes('bariloche') || o.includes('salta') || o.includes('tucum�n') || o.includes('tucuman');
  const isBrasil    = o.includes('brasil') || o.includes('brazil') || o.includes('s�o paulo') || o.includes('sao paulo') || o.includes('rio de janeiro') || o.includes('bras�lia') || o.includes('brasilia') || o.includes('porto alegre') || o.includes('florian�polis') || o.includes('florianopolis') || o.includes('belo horizonte') || o.includes('salvador') || o.includes('fortaleza') || o.includes('recife');
  const isColombia  = o.includes('colombia') || o.includes('bogot�') || o.includes('bogota') || o.includes('medell�n') || o.includes('medellin') || o.includes('cali') || o.includes('cartagena de indias') || o.includes('barranquilla') || o.includes('bucaramanga');
  const isMexico    = (o.includes('m�xico') || o.includes('mexico')) && !o.includes('nuevo mexico') || o.includes('ciudad de m�xico') || o.includes('cdmx') || o.includes('guadalajara') || o.includes('monterrey') || o.includes('canc�n') || o.includes('cancun') || o.includes('puebla') || o.includes('tijuana');
  const isPeru      = o.includes('per�') || o.includes('peru') || o.includes('lima') || o.includes('arequipa') || o.includes('cusco') || o.includes('trujillo') || o.includes('piura') || o.includes('iquitos');
  const isUruguay   = o.includes('uruguay') || o.includes('montevideo') || o.includes('punta del este') || o.includes('salto') || o.includes('colonia del sacramento');
  const isEcuador   = o.includes('ecuador') || o.includes('quito') || o.includes('guayaquil') || o.includes('cuenca') || o.includes('manta') || o.includes('loja');

  // -- Adaptador de enchufe seg�n destino ----------------------------------
  let adapterInfo = '';
  if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('usa') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('boston') || d.includes('san francisco') || d.includes('washington') || d.includes('orlando') || d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal') || d.includes('m�xico') || d.includes('mexico') || d.includes('colombia') || d.includes('bogot�') || d.includes('bogota') || d.includes('medell�n') || d.includes('medellin') || d.includes('cartagena') || d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('ecuador') || d.includes('quito') || d.includes('venezuela') || d.includes('cuba') || d.includes('habana'))
    adapterInfo = 'Tipo A/B (2 patas planas) � est�ndar de EE.UU., Canad�, M�xico y varios pa�ses latinoamericanos';
  else if (d.includes('europa') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berl�n') || d.includes('grecia') || d.includes('atenas') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('b�lgica') || d.includes('belgica') || d.includes('bruselas') || d.includes('suecia') || d.includes('estocolmo') || d.includes('noruega') || d.includes('oslo') || d.includes('dinamarca') || d.includes('copenhague') || d.includes('suiza') || d.includes('zurich') || d.includes('austria') || d.includes('viena') || d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul') || d.includes('rusia') || d.includes('mosc�') || d.includes('croacia') || d.includes('zagreb') || d.includes('hungr�a') || d.includes('hungria') || d.includes('budapest') || d.includes('polonia') || d.includes('varsovia') || d.includes('rep�blica checa') || d.includes('republica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('sevilla') || d.includes('florencia') || d.includes('venecia') || d.includes('milan') || d.includes('mil�n') || d.includes('n�poles') || d.includes('napoles') || d.includes('amsterdam') || d.includes('frankfurt'))
    adapterInfo = 'Adaptador Tipo C/E/F (2 patas redondas) � necesario en casi toda Europa continental';
  else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london') || d.includes('irlanda') || d.includes('dublin') || d.includes('hong kong') || d.includes('singapur') || d.includes('singapore') || d.includes('malasia') || d.includes('malaysia') || d.includes('kuala lumpur'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) � Reino Unido, Hong Kong, Singapur y Malasia';
  else if (d.includes('australia') || d.includes('s�dney') || d.includes('sydney') || d.includes('melbourne') || d.includes('brisbane') || d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
    adapterInfo = 'Tipo I (2 patas en V) � Australia y Nueva Zelanda. Tambi�n usado en Chile y Argentina';
  else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo') || d.includes('salvador') || d.includes('florian�polis') || d.includes('florianopolis') || d.includes('iguaz�') || d.includes('iguazu') || d.includes('foz do igua�u'))
    adapterInfo = 'Tipo N (2 patas redondas) � est�ndar propio de Brasil, diferente del resto de Sudam�rica';
  else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('tokio') || d.includes('osaka') || d.includes('kyoto') || d.includes('hiroshima') || d.includes('nara') || d.includes('sapporo'))
    adapterInfo = 'Adaptador Tipo A (2 patas planas, 110V) � Jap�n usa 110V. Verifica que tus dispositivos soporten 110-240V';
  else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai') || d.includes('chengdu') || d.includes('canton') || d.includes('guangzhou'))
    adapterInfo = 'Adaptador universal recomendado � China acepta varios tipos de enchufe (A, C, I)';
  else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa') || d.includes('bangalore') || d.includes('jaipur'))
    adapterInfo = 'Adaptador universal recomendado � India usa tipos C, D y M seg�n la zona';
  else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai') || d.includes('bali') || d.includes('indonesia') || d.includes('jakarta') || d.includes('vietnam') || d.includes('hanoi') || d.includes('ho chi minh') || d.includes('camboya') || d.includes('siem reap'))
    adapterInfo = 'Adaptador universal recomendado � el Sudeste Asi�tico tiene m�ltiples est�ndares de enchufe';
  else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche') || d.includes('c�rdoba') || d.includes('cordoba') || d.includes('salta') || d.includes('uruguay') || d.includes('montevideo') || d.includes('paraguay') || d.includes('asunci�n') || d.includes('asuncion'))
    adapterInfo = 'Tipo L (2 patas en V) � est�ndar de Chile, Argentina, Uruguay y Paraguay';
  else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi') || d.includes('qatar') || d.includes('doha'))
    adapterInfo = 'Adaptador Tipo G o C � Emiratos y Qatar. Mejor llevar adaptador universal';
  else if (d.includes('sud�frica') || d.includes('sudafrica') || d.includes('cape town') || d.includes('ciudad del cabo') || d.includes('johannesburg') || d.includes('johannesburgo'))
    adapterInfo = 'Adaptador Tipo M (3 patas gruesas) � Sud�frica tiene su propio est�ndar';
  else if (d.includes('marruecos') || d.includes('marrakech') || d.includes('fez') || d.includes('casablanca') || d.includes('t�nger'))
    adapterInfo = 'Adaptador Tipo C/E (2 patas redondas) � igual que Europa continental';
  else if (d.includes('kenia') || d.includes('kenya') || d.includes('nairobi') || d.includes('mombasa'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) � Kenia usa el est�ndar brit�nico';
  else if (d.includes('maldivas') || d.includes('maldives') || d.includes('islas maldivas'))
    adapterInfo = 'Adaptador Tipo G (3 patas rectangulares) � Maldivas usa est�ndar brit�nico';
  else
    adapterInfo = 'Adaptador universal recomendado � verifica el tipo de enchufe espec�fico del pa�s de destino';

  // -- Visa / Pasaporte para viajeros chilenos ------------------------------
  let visaInfo = '';
  if (isChile) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('boston') || d.includes('san francisco') || d.includes('washington') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + ESTA: Los chilenos viajan SIN VISA a EE.UU. pero necesitan ESTA (Electronic System for Travel Authorization, ~US$21). Tram�tala en esta-online.us con al menos 72h de anticipaci�n. Pasaporte vigente obligatorio.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal') || d.includes('ottawa') || d.includes('calgary'))
      visaInfo = 'PASAPORTE + eTA: Los chilenos necesitan eTA para Canad� (Electronic Travel Authorization, ~CAD$7), tramitable online en canada.ca. No es visa, se aprueba en minutos. Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berl�n') || d.includes('grecia') || d.includes('atenas') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('b�lgica') || d.includes('belgica') || d.includes('bruselas') || d.includes('suecia') || d.includes('estocolmo') || d.includes('noruega') || d.includes('oslo') || d.includes('dinamarca') || d.includes('copenhague') || d.includes('suiza') || d.includes('zurich') || d.includes('austria') || d.includes('viena') || d.includes('croacia') || d.includes('zagreb') || d.includes('hungr�a') || d.includes('budapest') || d.includes('polonia') || d.includes('varsovia') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('sevilla') || d.includes('florencia') || d.includes('venecia') || d.includes('milan') || d.includes('frankfurt'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a toda la Zona Schengen hasta 90 d�as. Solo pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso. No es necesario el DNI.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london') || d.includes('irlanda') || d.includes('dublin'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio. El UK NO forma parte de Schengen � si combinas con Europa, son permisos de entrada separados.';
    else if (d.includes('australia') || d.includes('s�dney') || d.includes('sydney') || d.includes('melbourne') || d.includes('brisbane'))
      visaInfo = 'PASAPORTE + eVisitor: Los chilenos necesitan eVisitor (subclass 651) para Australia. Es GRATUITO y se tramita online en immi.homeaffairs.gov.au en minutos. Pasaporte vigente obligatorio.';
    else if (d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
      visaInfo = 'PASAPORTE + NZeTA: Los chilenos necesitan NZeTA (New Zealand Electronic Travel Authority, ~NZD$23) tramitable online o en la app oficial. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('tokio') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Jap�n hasta 90 d�as. Solo pasaporte vigente. Sin tr�mite previo. Una ventaja enorme frente a otros latinoamericanos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio. Pr�rroga posible a 60 d�as en oficina de inmigraci�n local.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai') || d.includes('chengdu'))
      visaInfo = 'PASAPORTE + VISA: Los chilenos necesitan visa para China continental (tramitar en la Embajada China en Santiago). Para Hong Kong no se requiere visa (14 d�as). Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('hong kong'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos no necesitan visa para Hong Kong � entrada libre por 14 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa') || d.includes('jaipur'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para India (~US$25), tramitable online en indianvisaonline.gov.in. Se obtiene en 72-96h. Pasaporte con al menos 6 meses de vigencia desde el ingreso.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE / CARNET: Los chilenos viajan SIN VISA a Brasil. Con carnet de identidad chileno vigente alcanza para 90 d�as. No es necesario el pasaporte.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche') || d.includes('salta') || d.includes('c�rdoba') || d.includes('cordoba'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Argentina basta con el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia hasta 90 d�as.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu') || d.includes('arequipa'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Per� basta el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia hasta 183 d�as.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('bogota') || d.includes('cartagena') || d.includes('medell�n') || d.includes('medellin') || d.includes('cali'))
      visaInfo = 'PASAPORTE / CARNET (SIN VISA): Los chilenos viajan SIN VISA a Colombia hasta 90 d�as. Pasaporte o carnet de identidad vigente. Completar formulario Check-Mig online previo al viaje (gratuito).';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Uruguay basta el carnet de identidad chileno vigente. No se requiere pasaporte. Estancia libre hasta 90 d�as.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('cochabamba') || d.includes('santa cruz de la sierra'))
      visaInfo = 'CARNET DE IDENTIDAD: Para Bolivia basta el carnet de identidad chileno vigente. No se requiere pasaporte ni visa.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los chilenos obtienen visa gratuita al llegar a Dubai por convenio. Pasaporte con al menos 6 meses de validez. Verificar vigencia del convenio antes del viaje.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul') || d.includes('capadocia') || d.includes('cappadocia') || d.includes('antalya'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Turqu�a (~US$50), tramitable en evisa.gov.tr en minutos. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('vietnam') || d.includes('hanoi') || d.includes('ho chi minh') || d.includes('hoi an') || d.includes('da nang'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Vietnam (~US$25), tramitable en xuatnhapcanh.gov.vn. Aprobaci�n en 3 d�as h�biles. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta') || d.includes('lombok') || d.includes('yogyakarta'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los chilenos obtienen Visa on Arrival en Indonesia (~US$35) por 30 d�as, prorrogable 30 d�as m�s. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('maldivas') || d.includes('maldives') || d.includes('islas maldivas'))
      visaInfo = 'PASAPORTE (VISA GRATUITA): Los chilenos obtienen Visa on Arrival GRATUITA en Maldivas por 30 d�as. Solo pasaporte vigente y reserva de alojamiento.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('la habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los chilenos necesitan Tarjeta del Turista (~US$25) para Cuba, comprable en el aeropuerto de salida o en la aerol�nea. Pasaporte vigente obligatorio.';
    else if (d.includes('marruecos') || d.includes('marrakech') || d.includes('fez') || d.includes('casablanca') || d.includes('t�nger'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Marruecos hasta 90 d�as. Pasaporte vigente obligatorio. Control migratorio estricto � lleva reservas de hotel impresas.';
    else if (d.includes('kenia') || d.includes('kenya') || d.includes('nairobi') || d.includes('safari') || d.includes('masai mara'))
      visaInfo = 'PASAPORTE + e-VISA: Los chilenos necesitan e-Visa para Kenia (~US$51), tramitable en evisa.go.ke. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('sud�frica') || d.includes('sudafrica') || d.includes('cape town') || d.includes('ciudad del cabo') || d.includes('johannesburg'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Sud�frica hasta 30 d�as. Pasaporte con al menos 6 meses de validez y 2 p�ginas en blanco.';
    else if (d.includes('qatar') || d.includes('doha'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Qatar hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun') || d.includes('ciudad de m�xico') || d.includes('cdmx') || d.includes('playa del carmen') || d.includes('tulum'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a M�xico hasta 180 d�as. Pasaporte vigente obligatorio. Se exige llenar Forma Migratoria M�ltiple (FMM) en el avi�n o en el aeropuerto.';
    else if (d.includes('costa rica') || d.includes('san jos�') || d.includes('san jose'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Costa Rica hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('panam�') || d.includes('panama') || d.includes('ciudad de panam�'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Panam� hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Singapur hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('se�l') || d.includes('busan') || d.includes('jeju'))
      visaInfo = 'PASAPORTE (SIN VISA): Los chilenos viajan SIN VISA a Corea del Sur hasta 90 d�as. Pasaporte vigente obligatorio.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en minrel.gob.cl (Ministerio de Relaciones Exteriores de Chile). Est�ndar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // -- Visa / Pasaporte para viajeros ARGENTINOS ------------------------------
  } else if (isArgentina) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('houston') || d.includes('orlando') || d.includes('washington') || d.includes('boston') || d.includes('san francisco'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los argentinos NECESITAN visa para EE.UU. (no es visa-free). Tramitar en la Embajada de EE.UU. en Buenos Aires (usembassy.gov). El proceso puede tardar semanas o meses � �gestionarla con anticipaci�n!';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los argentinos generalmente necesitan visa de turista para Canad�. Tramitar en el Consulado de Canad� en Argentina (canada.ca/es). Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('berl�n') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('florencia') || d.includes('venecia'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a la Zona Schengen hasta 90 d�as. Solo pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio. UK es independiente de Schengen.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('s�dney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los argentinos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('nueva zelanda') || d.includes('new zealand') || d.includes('auckland'))
      visaInfo = 'PASAPORTE + NZeTA: Los argentinos necesitan NZeTA (~NZD$23), tramitable online en immigation.govt.nz. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Jap�n hasta 90 d�as. Solo pasaporte vigente.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los argentinos necesitan visa para China continental. Tramitar en la Embajada China en Buenos Aires. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los argentinos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobaci�n en 72-96h. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Los argentinos viajan a Brasil sin visa. Con DNI argentino vigente alcanza para 90 d�as � no es necesario el pasaporte.';
    else if (d.includes('chile') || d.includes('santiago') || d.includes('valpara�so') || d.includes('patagonia chilena'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Chile basta el DNI argentino vigente. Sin visa ni tr�mite previo.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Los argentinos viajan a Per� sin visa. Con DNI argentino vigente alcanza hasta 183 d�as.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('cartagena') || d.includes('medell�n'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan a Colombia sin visa hasta 90 d�as. Pasaporte o DNI argentino vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Uruguay basta el DNI argentino vigente. Libre hasta 90 d�as.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('cochabamba'))
      visaInfo = 'DNI O PASAPORTE (SIN VISA): Para Bolivia basta el DNI argentino vigente. Sin visa.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan a M�xico sin visa hasta 180 d�as. Pasaporte vigente. Completar FMM en el avi�n o aeropuerto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los argentinos obtienen visa gratuita al llegar a Dubai. Pasaporte con al menos 6 meses de validez. Verificar vigencia del convenio.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los argentinos necesitan e-Visa para Turqu�a (~US$50), en evisa.gov.tr. Proceso de minutos online.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Singapur hasta 30 d�as. Pasaporte vigente.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('se�l'))
      visaInfo = 'PASAPORTE (SIN VISA): Los argentinos viajan SIN VISA a Corea del Sur hasta 90 d�as. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los argentinos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o con la aerol�nea.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en cancilleria.gob.ar (Canciller�a argentina). Est�ndar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // -- Visa / Pasaporte para viajeros BRASILE�OS ------------------------------
  } else if (isBrasil) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + VISA: Los brasile�os hist�ricamente han necesitado visa B1/B2 para EE.UU. Los requisitos est�n cambiando (2023-2024). Verifica el estado actual en br.usembassy.gov antes de viajar.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los brasile�os generalmente necesitan visa de turista para Canad�. Verifica si calificas para eTA en canada.ca. Tramitar con anticipaci�n.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungary') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona') || d.includes('florencia') || d.includes('venecia'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO para a Zona Schengen por at� 90 dias. Apenas passaporte v�lido com pelo menos 6 meses de validade a partir da data de retorno.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO para o Reino Unido por at� 6 meses. Passaporte v�lido obrigat�rio. O UK n�o faz parte do Schengen � s�o permiss�es separadas.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASSAPORTE + ETA: Os brasileiros precisam de Electronic Travel Authority (ETA subclass 601, gratuita) para a Austr�lia, dispon�vel em immi.homeaffairs.gov.au. Passaporte v�lido obrigat�rio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO ao Jap�o por at� 90 dias. Apenas passaporte v�lido � sem burocracia pr�via.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam SEM VISTO � Tail�ndia por at� 30 dias. Passaporte v�lido obrigat�rio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASSAPORTE + VISTO: Os brasileiros precisam de visto para a China continental. Solicitar na Embaixada/Consulado da China no Brasil. Passaporte com ao menos 6 meses de validade.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASSAPORTE + e-VISA: Os brasileiros precisam de e-Visa para a �ndia (~US$25), em indianvisaonline.gov.in. Aprova��o em 72-96h. Passaporte com ao menos 6 meses de validade.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para a Argentina basta a Carteira de Identidade (RG) brasileira v�lida. N�o � necess�rio passaporte. Estadia livre por 90 dias.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Chile basta a Carteira de Identidade (RG) brasileira v�lida. Sem visto, sem burocracia.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Peru basta a Carteira de Identidade (RG) brasileira v�lida. Estadia at� 183 dias.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('cartagena') || d.includes('medell�n'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam � Col�mbia sem visto por at� 90 dias. Passaporte v�lido obrigat�rio.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para o Uruguai basta a Carteira de Identidade (RG) brasileira v�lida.';
    else if (d.includes('bolivia') || d.includes('la paz'))
      visaInfo = 'PASSAPORTE OU RG (SEM VISTO): Para a Bol�via basta a Carteira de Identidade (RG) brasileira v�lida.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun'))
      visaInfo = 'PASSAPORTE (SEM VISTO): Os brasileiros viajam ao M�xico sem visto. Passaporte v�lido. Preencher FMM no avi�o ou aeroporto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASSAPORTE (VISTO NA CHEGADA): Os brasileiros obt�m visto gratuito ao chegar em Dubai por acordo bilateral. Passaporte com ao menos 6 meses de validade. Confirmar o acordo antes de viajar.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASSAPORTE + e-VISTO: Os brasileiros precisam de e-Visa para a Turquia (~US$50), em evisa.gov.tr. Processo online em minutos.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASSAPORTE + CART�O DE TURISTA: Os brasileiros precisam do Cart�o de Turista para Cuba (~US$25), comprado no aeroporto ou com a companhia a�rea. Passaporte v�lido.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta'))
      visaInfo = 'PASSAPORTE (VISTO NA CHEGADA): Os brasileiros obt�m Visto na Chegada na Indon�sia (~US$35) por 30 dias, prorrog�vel por mais 30. Passaporte com ao menos 6 meses de validade.';
    else
      visaInfo = 'PASSAPORTE: Verifique os requisitos de visto no portal do Itamaraty (itamaraty.gov.br). Padr�o: passaporte v�lido com ao menos 6 meses de validade a partir da data de retorno.';

  // -- Visa / Pasaporte para viajeros COLOMBIANOS -----------------------------
  } else if (isColombia) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los colombianos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Bogot� (co.usembassy.gov). Iniciar el proceso con meses de anticipaci�n.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa de turista para Canad�. Tramitar en el Consulado de Canad� en Colombia (canada.ca). Pasaporte vigente obligatorio.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Desde junio 2023, los colombianos viajan SIN VISA a la Zona Schengen hasta 90 d�as. Solo pasaporte vigente con al menos 6 meses de validez. �Gran avance para los viajeros colombianos!';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos NECESITAN visa para el Reino Unido. Tramitar online en gov.uk. El UK no aplica el acuerdo Schengen. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa de turista para Australia (Visitor Visa subclass 600). Tramitar online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Jap�n hasta 90 d�as. Solo pasaporte vigente � sin burocracia previa.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los colombianos necesitan visa para China. Tramitar en la Embajada China en Bogot�. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los colombianos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobaci�n en 72-96h.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Argentina sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Chile sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASAPORTE O C�DULA (SIN VISA): Los colombianos viajan a Per� sin visa. Pasaporte o c�dula de ciudadan�a colombiana vigente hasta 183 d�as.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Brasil sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('uruguay') || d.includes('montevideo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a Uruguay sin visa hasta 90 d�as. Pasaporte vigente.';
    else if (d.includes('bolivia') || d.includes('la paz'))
      visaInfo = 'PASAPORTE O C�DULA (SIN VISA): Para Bolivia basta la c�dula de ciudadan�a colombiana vigente. Sin visa.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan a M�xico sin visa. Pasaporte vigente. Completar FMM en el avi�n o aeropuerto.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los colombianos obtienen visa gratuita al llegar a Dubai. Pasaporte con al menos 6 meses de validez. Verificar convenio vigente.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los colombianos necesitan e-Visa para Turqu�a (~US$50), en evisa.gov.tr.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los colombianos viajan SIN VISA a Singapur hasta 30 d�as. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los colombianos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerol�nea.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en cancilleria.gov.co (Canciller�a de Colombia). Est�ndar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  // -- Visa / Pasaporte para viajeros MEXICANOS -------------------------------
  } else if (isMexico) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los mexicanos generalmente NECESITAN visa para EE.UU. Si ya la tienes vigente, �perfecto! Si no, tramitar en la Embajada de EE.UU. en M�xico (mx.usembassy.gov). El proceso puede tardar meses.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los mexicanos necesitan visa de turista para Canad� (o eTA si viajaron en avi�n con visa canadiense previa). Tramitar con anticipaci�n en canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a la Zona Schengen hasta 90 d�as. Solo pasaporte vigente con al menos 6 meses de validez.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los mexicanos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Jap�n hasta 90 d�as. Solo pasaporte vigente � sin tr�mites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los mexicanos necesitan visa para China. Tramitar en la Embajada China en M�xico. Pasaporte con al menos 6 meses de vigencia.';
    else if (d.includes('india') || d.includes('delhi') || d.includes('mumbai') || d.includes('goa'))
      visaInfo = 'PASAPORTE + e-VISA: Los mexicanos necesitan e-Visa para India (~US$25), en indianvisaonline.gov.in. Aprobaci�n en 72-96h.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Argentina sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Chile sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco') || d.includes('machu picchu'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Per� sin visa hasta 183 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('cartagena') || d.includes('medell�n'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Colombia sin visa hasta 90 d�as. Pasaporte vigente.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Brasil sin visa hasta 90 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('uruguay') || d.includes('montevideo'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan a Uruguay sin visa. Pasaporte vigente.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los mexicanos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerol�nea. Pasaporte vigente.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los mexicanos obtienen visa gratuita al llegar a Dubai por acuerdo. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los mexicanos necesitan e-Visa para Turqu�a (~US$50), en evisa.gov.tr.';
    else if (d.includes('singapur') || d.includes('singapore'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Singapur hasta 30 d�as. Pasaporte vigente.';
    else if (d.includes('corea del sur') || d.includes('seoul') || d.includes('se�l'))
      visaInfo = 'PASAPORTE (SIN VISA): Los mexicanos viajan SIN VISA a Corea del Sur hasta 90 d�as. Pasaporte vigente.';
    else if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los mexicanos obtienen Visa on Arrival en Indonesia (~US$35) por 30 d�as, prorrogable 30 d�as m�s. Pasaporte con 6 meses de validez.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa en sre.gob.mx (Secretar�a de Relaciones Exteriores de M�xico). Est�ndar: pasaporte vigente con al menos 6 meses de validez desde la fecha de regreso.';

  } else if (isPeru) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los peruanos NECESITAN visa para EE.UU. Tramitar con anticipaci�n en la Embajada de EE.UU. en Lima (pe.usembassy.gov). El proceso puede tardar semanas o meses.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los peruanos necesitan visa de turista para Canad�. Tramitar con anticipaci�n en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a la Zona Schengen hasta 90 d�as gracias al acuerdo UE-Per� vigente desde 2023. Solo pasaporte con al menos 6 meses de validez.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA UK: Los peruanos necesitan visa para el Reino Unido. Tramitar en gov.uk/uk-visa. Pasaporte vigente con al menos 6 meses de validez.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los peruanos necesitan Visitor Visa (Subclase 600) para Australia. Tramitar online en immi.homeaffairs.gov.au.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a Jap�n hasta 90 d�as por acuerdo bilateral. Solo pasaporte vigente � sin tr�mites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los peruanos necesitan e-Visa para Turqu�a (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (VISA ON ARRIVAL): Los peruanos pueden obtener visa gratuita al llegar a Emiratos �rabes. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos pueden entrar a Chile con su DNI peruano vigente. Sin visa � estad�a hasta 90 d�as.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos ingresan a Argentina con DNI peruano vigente. Sin visa � estad�a hasta 90 d�as.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo') || d.includes('florian�polis') || d.includes('florianopolis'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a Brasil sin visa hasta 90 d�as. Pasaporte peruano vigente (en Brasil no se acepta DNI extranjero).';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('bogota') || d.includes('cartagena') || d.includes('medell�n') || d.includes('medellin'))
      visaInfo = 'PASAPORTE O C�DULA PERUANA: Los peruanos viajan a Colombia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con c�dula/DNI peruano vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz') || d.includes('cochabamba'))
      visaInfo = 'PASAPORTE O DNI PERUANO: Los peruanos viajan a Bolivia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con DNI peruano vigente.';
    else if (d.includes('ecuador') || d.includes('quito') || d.includes('guayaquil'))
      visaInfo = 'PASAPORTE O C�DULA PERUANA: Los peruanos viajan a Ecuador sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con c�dula/DNI peruano vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a Uruguay sin visa hasta 90 d�as. Pasaporte peruano vigente.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun') || d.includes('ciudad de m�xico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE (SIN VISA): Los peruanos viajan a M�xico sin visa hasta 180 d�as. Pasaporte peruano vigente obligatorio.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los peruanos necesitan Tarjeta del Turista para Cuba (~US$25), comprable en el aeropuerto o aerol�nea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en rree.gob.pe (Ministerio de Relaciones Exteriores del Per�) antes de viajar. Los requisitos pueden cambiar � consulta siempre la fuente oficial m�s cercana a tu fecha de viaje.';

  } else if (isUruguay) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los uruguayos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Montevideo (uy.usembassy.gov). El proceso puede tardar semanas.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA o eTA: Los uruguayos necesitan visa de turista para Canad� (o eTA si viajaron antes en avi�n con visa canadiense). Tramitar en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a la Zona Schengen hasta 90 d�as. Pasaporte con al menos 6 meses de validez desde la fecha de regreso.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA al Reino Unido hasta 6 meses. Pasaporte vigente obligatorio.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + eVisitor: Los uruguayos necesitan eVisitor (651) para Australia, GRATUITO, tramitable online en immi.homeaffairs.gov.au. Pasaporte vigente obligatorio.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Jap�n hasta 90 d�as. Solo pasaporte vigente � sin tr�mites previos.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Tailandia hasta 30 d�as. Pasaporte vigente obligatorio.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los uruguayos necesitan e-Visa para Turqu�a (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan SIN VISA a Emiratos �rabes Unidos hasta 90 d�as. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('china') || d.includes('beijing') || d.includes('shanghai'))
      visaInfo = 'PASAPORTE + VISA: Los uruguayos necesitan visa para China. Tramitar en la Embajada de China en Montevideo con anticipaci�n.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'DNI URUGUAYO O PASAPORTE: Los uruguayos entran a Argentina con su DNI uruguayo vigente (MERCOSUR). Sin visa � estad�a hasta 90 d�as.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo') || d.includes('florian�polis') || d.includes('florianopolis'))
      visaInfo = 'DNI URUGUAYO O PASAPORTE: Los uruguayos entran a Brasil con su DNI uruguayo vigente (MERCOSUR). Sin visa � estad�a hasta 90 d�as.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE O DNI URUGUAYO: Los uruguayos entran a Chile con DNI uruguayo vigente. Sin visa � estad�a hasta 90 d�as.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('bogota') || d.includes('cartagena') || d.includes('medell�n') || d.includes('medellin'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Colombia sin visa hasta 90 d�as. Pasaporte uruguayo vigente.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Per� sin visa hasta 90 d�as. Pasaporte uruguayo vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Bolivia sin visa. Pasaporte uruguayo vigente.';
    else if (d.includes('ecuador') || d.includes('quito') || d.includes('guayaquil'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a Ecuador sin visa hasta 90 d�as. Pasaporte uruguayo vigente.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun') || d.includes('ciudad de m�xico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE (SIN VISA): Los uruguayos viajan a M�xico sin visa hasta 180 d�as. Pasaporte uruguayo vigente obligatorio.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los uruguayos necesitan Tarjeta del Turista para Cuba, comprable en el aeropuerto o aerol�nea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en mrree.gub.uy (Ministerio de Relaciones Exteriores del Uruguay) antes de viajar. Los requisitos pueden cambiar � consulta siempre la fuente oficial m�s cercana a tu fecha de viaje.';

  } else if (isEcuador) {
    if (d.includes('eeuu') || d.includes('estados unidos') || d.includes('nueva york') || d.includes('new york') || d.includes('miami') || d.includes('los angeles') || d.includes('chicago') || d.includes('orlando') || d.includes('washington') || d.includes('houston'))
      visaInfo = 'PASAPORTE + VISA B1/B2: Los ecuatorianos NECESITAN visa para EE.UU. Tramitar en la Embajada de EE.UU. en Quito (ec.usembassy.gov). El proceso puede tardar semanas o meses.';
    else if (d.includes('canad�') || d.includes('canada') || d.includes('toronto') || d.includes('vancouver') || d.includes('montreal'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa de turista para Canad�. Tramitar con anticipaci�n en ircc.canada.ca.';
    else if (d.includes('europa') || d.includes('schengen') || d.includes('espa�a') || d.includes('france') || d.includes('paris') || d.includes('italia') || d.includes('roma') || d.includes('alemania') || d.includes('berlin') || d.includes('grecia') || d.includes('portugal') || d.includes('lisboa') || d.includes('holanda') || d.includes('amsterdam') || d.includes('suiza') || d.includes('austria') || d.includes('viena') || d.includes('hungr�a') || d.includes('budapest') || d.includes('rep�blica checa') || d.includes('praga') || d.includes('madrid') || d.includes('barcelona'))
      visaInfo = 'PASAPORTE + VISA SCHENGEN: Los ecuatorianos NECESITAN visa para la Zona Schengen (Ecuador no tiene acuerdo de liberalizaci�n de visas con la UE, a diferencia de Colombia y Per�). Tramitar en la embajada del pa�s de mayor estad�a.';
    else if (d.includes('reino unido') || d.includes('uk') || d.includes('inglaterra') || d.includes('londres') || d.includes('london'))
      visaInfo = 'PASAPORTE + VISA UK: Los ecuatorianos necesitan visa para el Reino Unido. Tramitar en gov.uk/uk-visa con anticipaci�n.';
    else if (d.includes('australia') || d.includes('sydney') || d.includes('melbourne'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan Visitor Visa (Subclase 600) para Australia. Tramitar online en immi.homeaffairs.gov.au.';
    else if (d.includes('japon') || d.includes('jap�n') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para Jap�n. Tramitar en la Embajada de Jap�n en Quito con anticipaci�n.';
    else if (d.includes('tailandia') || d.includes('thailand') || d.includes('bangkok') || d.includes('phuket'))
      visaInfo = 'PASAPORTE + VISA ON ARRIVAL: Los ecuatorianos pueden obtener Visa on Arrival en Tailandia (30 d�as). Pasaporte vigente y fondos suficientes.';
    else if (d.includes('turqu�a') || d.includes('turquia') || d.includes('estambul') || d.includes('istanbul'))
      visaInfo = 'PASAPORTE + e-VISA: Los ecuatorianos necesitan e-Visa para Turqu�a (~US$50), tramitable en evisa.gov.tr.';
    else if (d.includes('emiratos') || d.includes('dubai') || d.includes('abu dhabi'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para Emiratos �rabes Unidos. Tramitar con la aerol�nea o embajada de EAU en Quito. Pasaporte con al menos 6 meses de validez.';
    else if (d.includes('chile') || d.includes('santiago'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Chile sin visa hasta 90 d�as. Pasaporte ecuatoriano vigente obligatorio.';
    else if (d.includes('argentina') || d.includes('buenos aires') || d.includes('mendoza') || d.includes('bariloche'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Argentina sin visa hasta 90 d�as. Pasaporte ecuatoriano vigente.';
    else if (d.includes('brasil') || d.includes('brazil') || d.includes('r�o de janeiro') || d.includes('rio de janeiro') || d.includes('s�o paulo') || d.includes('sao paulo') || d.includes('florian�polis') || d.includes('florianopolis'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Brasil sin visa hasta 90 d�as. Pasaporte ecuatoriano vigente.';
    else if (d.includes('colombia') || d.includes('bogot�') || d.includes('bogota') || d.includes('cartagena') || d.includes('medell�n') || d.includes('medellin'))
      visaInfo = 'PASAPORTE O C�DULA ECUATORIANA: Los ecuatorianos viajan a Colombia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con c�dula ecuatoriana vigente.';
    else if (d.includes('per�') || d.includes('peru') || d.includes('lima') || d.includes('cusco'))
      visaInfo = 'PASAPORTE O C�DULA ECUATORIANA: Los ecuatorianos viajan a Per� sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con c�dula ecuatoriana vigente.';
    else if (d.includes('bolivia') || d.includes('la paz') || d.includes('santa cruz') || d.includes('cochabamba'))
      visaInfo = 'PASAPORTE O C�DULA ECUATORIANA: Los ecuatorianos viajan a Bolivia sin visa. Como miembros de la Comunidad Andina (CAN) pueden ingresar con c�dula ecuatoriana vigente.';
    else if (d.includes('uruguay') || d.includes('montevideo') || d.includes('punta del este'))
      visaInfo = 'PASAPORTE (SIN VISA): Los ecuatorianos viajan a Uruguay sin visa hasta 90 d�as. Pasaporte ecuatoriano vigente.';
    else if (d.includes('m�xico') || d.includes('mexico') || d.includes('canc�n') || d.includes('cancun') || d.includes('ciudad de m�xico') || d.includes('cdmx'))
      visaInfo = 'PASAPORTE + VISA: Los ecuatorianos necesitan visa para M�xico (requerida desde 2023 por acuerdo migratorio). Tramitar en la Embajada de M�xico en Quito con anticipaci�n.';
    else if (d.includes('cuba') || d.includes('habana') || d.includes('varadero'))
      visaInfo = 'PASAPORTE + TARJETA DEL TURISTA: Los ecuatorianos necesitan Tarjeta del Turista para Cuba, comprable en el aeropuerto o aerol�nea. Pasaporte vigente.';
    else
      visaInfo = 'PASAPORTE: Verifica los requisitos de visa actualizados en cancilleria.gob.ec (Ministerio de Relaciones Exteriores del Ecuador) antes de viajar. Los requisitos pueden cambiar � consulta siempre la fuente oficial m�s cercana a tu fecha de viaje.';
  }

  const lines = [];
  if (visaInfo) lines.push(visaInfo);
  if (adapterInfo) lines.push(`ADAPTADOR DE ENCHUFE: ${adapterInfo}`);
  return lines.join('\n');
}

// ── POST /api/generate-pdf ────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, planId } = body;
    let basicItinerary = body.basicItinerary ?? null; // let para poder invalidarlo si el destino no coincide

    if (!formData?.email || !formData?.nombre) {
      return NextResponse.json({ error: 'Faltan datos del formulario' }, { status: 400 });
    }
    if (!formData?.destino?.trim()) {
      return NextResponse.json({ error: 'Falta el destino del viaje' }, { status: 400 });
    }

    const isPro = planId === 'pro';
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Configuraci�n incompleta' }, { status: 500 });
    }

    const today = new Date().toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const currentYear = new Date().getFullYear();

    // -- Validaci�n de presupuesto vs destino --------------------------------
    const presupuesto = formData.presupuesto || 0;
    const destino     = (formData.destino || '').toLowerCase();
    const origen      = (formData.origen  || 'Santiago').toLowerCase();
    const dias        = formData.dias || 7;

    // Umbrales m�nimos estimados para viaje completo desde Chile (vuelo + alojamiento + comidas)
    const umbralMin = (() => {
      if (destino.includes('chile') || !destino) return 300;
      if (/argentina|uruguay|bolivia|per�|peru/.test(destino)) return 800;
      if (/brasil|colombia|ecuador|venezuela|paraguay/.test(destino)) return 1200;
      if (/m�xico|mexico|cuba|caribe|dominicana|costa rica|panam�|panama/.test(destino)) return 1500;
      if (/eeuu|ee\.uu|estados unidos|new york|miami|florida|california|chicago/.test(destino)) return 2000;
      if (/canad�|canada/.test(destino)) return 2200;
      if (/europa|espa�a|portugal|francia|italia|alemania|reino unido|grecia|turqu�a|turquia/.test(destino)) return 2500;
      if (/jap�n|japon|china|corea|tailandia|vietnam|india|indonesia|singapur|asia/.test(destino)) return 3000;
      if (/australia|nueva zelanda|ocean�a|oceania/.test(destino)) return 4000;
      return 1500; // internacional gen�rico
    })();

    const budgetWarning = presupuesto < umbralMin
      ? `ALERTA: Presupuesto $${presupuesto} USD es bajo para ${formData.destino || 'este destino'} (mín estimado $${umbralMin}). Adáptalo con hostels/Airbnb económico, comida callejera, actividades gratuitas. presupuesto_desglose.total no puede superar $${Math.round(presupuesto * 1.1)} USD.`
      : '';
    // -- Intereses con orden de prioridad -------------------------------------
    const interesesArray = Array.isArray(formData.intereses) ? formData.intereses : [];
    const interesNombres = {
      playa: 'Playa y mar', cultura: 'Cultura e historia', aventura: 'Aventura y deportes extremos',
      gastronomia: 'Gastronom�a', relax: 'Relax y bienestar', naturaleza: 'Naturaleza y paisajes',
      nocturna: 'Vida nocturna', deporte: 'Deportes', shopping: 'Shopping',
    };
    const interesesConPeso = interesesArray.length > 0
      ? interesesArray.map((id, idx) => {
          const pesos = ['PRINCIPAL (60% actividades)', 'SECUNDARIO (25%)', 'COMPLEMENTARIO (10%)', 'OCASIONAL (5%)'];
          return `${interesNombres[id] || id} [${pesos[idx] || 'ocasional'}]`;
        }).join(', ')
      : 'cultura, gastronom�a';

    // -- Ocasi�n especial ------------------------------------------------------
    // ocasionCtx eliminado — cubierto por tipoViajeRule
    const ocasionCtx = '';

    // -- Restricci�n alimentaria -----------------------------------------------
    // restriccionDescMap sigue siendo necesario para reglasPersonalizacion
    const restriccionDescMap = {
      'vegetariano':  'VEGETARIANO: todos los restaurantes con opciones vegetarianas claras.',
      'vegano':       'VEGANO: todos los restaurantes con opciones veganas verificadas.',
      'sin-gluten':   'SIN GLUTEN: todos los restaurantes con opciones sin gluten.',
      'halal':        'HALAL: prioriza restaurantes halal o sin alcohol/cerdo.',
      'pescetariano': 'PESCETARIANO: come pescado/mariscos, no carne roja ni pollo.',
    };
    // restriccionCtx eliminado de clienteCtx — cubierto por reglasPersonalizacion
    const restriccionCtx = '';

    // -- Horario inferido desde otros campos (no hay pregunta directa) --------
    const horarioInferido = (() => {
      const ints = Array.isArray(formData.intereses) ? formData.intereses : [];
      if (ints[0] === 'nocturna') return 'nocturno';
      if (formData.tipoViaje === 'familia' && (formData.numNinos || 0) > 0) return 'madrugador';
      if ((formData.tipoViaje || '').toLowerCase().includes('empresa') || (formData.tipoViaje || '').toLowerCase().includes('corporat')) return 'madrugador';
      return 'normal';
    })();
    const horarioCtx = horarioInferido === 'madrugador'
      ? `\n- HORARIO: Arranca actividades a las 7-8am. Incluye desayunos tempranos. Ventaja: atracciones antes de multitudes.`
      : horarioInferido === 'nocturno'
      ? `\n- HORARIO: Interés principal en vida nocturna — no programes nada antes de las 11am. Mañana libre o descanso. Brunch en lugar de desayuno. Actividades se extienden hasta tarde.`
      : `\n- HORARIO: Arranque a las 9-10am. Almuerzo 13-14h. Cena 20-21h. Incluye tiempos de descanso entre bloques de actividad.`;

    // -- Aerol�nea preferida / programa de millas ------------------------------
    const aerolineaDescMap = {
      latam:    'LATAM (LATAM Pass)',
      avianca:  'Avianca (LifeMiles)',
      copa:     'Copa Airlines (ConnectMiles)',
      american: 'American Airlines (AAdvantage)',
      iberia:   'Iberia / Air Europa (Iberia Plus)',
    };
    // aerolineaCtx eliminado de clienteCtx — cubierto por reglasPersonalizacion
    const aerolineaCtx = '';
    // -- Prioridad de gasto ----------------------------------------------------
    const prioridadDescMap = {
      'vuelo-directo': 'PRIORIDAD VUELO DIRECTO � el viajero prefiere pagar m�s por vuelo directo. Pon SIEMPRE el vuelo directo como primera opci�n si existe, aunque sea m�s caro. Asigna mayor proporci�n del presupuesto_desglose a vuelos.',
      'mejor-hotel':   'PRIORIDAD ALOJAMIENTO � prefiere el mejor hotel posible aunque el vuelo tenga escala. Asigna 40-45% del presupuesto_desglose a alojamiento. Presenta la opci�n Premium con m�s detalle y como primera recomendaci�n.',
      'actividades':   'PRIORIDAD EXPERIENCIAS � quiere invertir en actividades y tours �nicos, alojamiento funcional es suficiente. Asigna 25-30% del presupuesto_desglose a actividades. Incluye m�s opciones de experiencias premium.',
      'gastronomia':   'PRIORIDAD GASTRONOM�A � quiere comer excepcionalmente bien, alojamiento funcional est� bien. Asigna 25-30% a comidas. Cada almuerzo y cena debe ser una recomendaci�n cuidadosamente elegida. Incluye experiencias gastron�micas (mercados gourmet, cenas con chef, tours de comida).',
    };
    const prioridadCtx = formData.prioridadGasto && formData.prioridadGasto !== 'equilibrado' && prioridadDescMap[formData.prioridadGasto]
      ? `\n- DISTRIBUCI�N DE PRESUPUESTO: ${prioridadDescMap[formData.prioridadGasto]}`
      : '';

    // -- Niveles de familiaridad con el destino (4 niveles) -------------------
    const visitasVal = formData.primeraVisita;
    // Compatibilidad legacy (boolean anterior) + nuevos strings
    const visitasNorm = visitasVal === true ? 'primera-vez'
                      : visitasVal === false ? '1-2-veces'
                      : (visitasVal || null);

    const esRegular    = visitasNorm === 'regularmente';
    const esVeterano   = visitasNorm === '3-5-veces';
    const esReincidente = visitasNorm === '1-2-veces';
    const esPrimeraVez = !esRegular && !esVeterano && !esReincidente;

    const esViajeroPro   = formData.experienciaViajero === 'frecuente';
    const esViajeroMedio = formData.experienciaViajero === 'algunas-veces';
    const esViajeroNovato = formData.experienciaViajero === 'primera-vez';

    // primeraVisitaCtx eliminado — experienciaViajeroCtx lo cubre de forma más compacta
    const primeraVisitaCtx = '';


    // -- Experiencia del viajero cruzada con conocimiento del destino ----------
    // Esta es la capa de personalización más profunda: combina CUÁNTO viaja la persona
    // con CUÁNTO conoce este destino específico → define todo el tono + selección de lugares
    const experienciaViajeroCtx = (() => {
      if (esViajeroPro && esRegular) return `- ELITE LOCAL: Viaja frecuente Y conoce bien ESTE destino. PRIORIDAD MAXIMA. Cero atracciones turisticas. Solo actividades/restaurantes de residentes, eventos sin TripAdvisor. Tono: par a par.`;
      if (esViajeroPro && esVeterano) return `- ELITE EXPLORADOR: Viaja frecuente, 3-5x en este destino. Prohibido top-10 turistico. Barrios locales reales, restaurantes locales, experiencias de nicho. Tono: colega experto.`;
      if (esViajeroPro && esReincidente) return `- VIAJERO ACTIVO REINCIDENTE: Frecuente pero 1-2x aqui. 30% clasicos nueva perspectiva + 70% descubrimientos autenticos. Sin tours de autobus. Tono: companero sin sobreexplicar.`;
      if (esViajeroPro && esPrimeraVez) return `- EXPLORADOR EXPERIMENTADO, PRIMERA VEZ AQUI: Sabe viajar pero no conoce este destino. No expliques basicos. Mezcla imperdibles con 2-3 descubrimientos que un turista casual no encontraria.`;
      if (esViajeroMedio && esRegular) return `- CONOCEDOR DEL DESTINO: Frecuencia media, conoce bien este lugar. 40% descubrimientos + 60% favoritos desde otro angulo. No sobre-expliques lo obvio.`;
      if (esViajeroMedio && (esVeterano || esReincidente)) return `- VIAJERO CON CRITERIO: Experiencia media, ya conoce el destino. Evita lo mas trillado. Mezcla descubrimientos con clasicos bien elegidos.`;
      if (esViajeroNovato && esPrimeraVez) return `- DEBUT ABSOLUTO: Primera vez viajando Y primera vez aqui. Orientacion maxima: aeropuerto, transporte, costumbres. Tours guiados. Restaurantes con carta visual. Tono: amigo empatico paso a paso.`;
      if (esViajeroNovato) return `- VIAJERO NUEVO: Experiencia limitada. Orientacion practica, tours guiados, tips de movilidad y seguridad. Tono: guia paciente.`;
      return '';
    })();

    // -- Cruces de señales: combinaciones que generan reglas específicas --------
    // Cuando dos preferencias se combinan crean un perfil único que ninguna regla
    // individual captura. Estas reglas son las más personalizadoras del sistema.
    // -- Cruces de senales -------------------------------------------------
    const crucesSenales = (() => {
      const reglas = [];
      if ((formData.tipoViaje || '').toLowerCase() === 'solo' && interesesArray[0] === 'nocturna') {
        reglas.push(`- SOLO+NOCTURNA: Venues donde ir solo es natural (barra larga, musica en vivo, tours nocturnos grupales). NUNCA discotecas. En tips: zonas seguras para salir solo de noche.`);
      }
      if (interesesArray.includes('aventura') && formData.movilidadReducida) {
        reglas.push(`- AVENTURA ACCESIBLE: Adapta outdoor (tirolina adaptada, kayak tranquilo, e-bike en llano, fauna en vehiculo). NUNCA trekking con desnivel. Menciona accesibilidad en cada actividad.`);
      }
      if (formData.restriccionDietaria && formData.restriccionDietaria !== 'sin-restriccion' && formData.prioridadGasto === 'gastronomia') {
        const r = formData.restriccionDietaria;
        reglas.push(`- GASTRONOMIA PREMIUM+RESTRICCION (\): Restaurantes donde la restriccion es el ADN del chef. Al menos 1 experiencia gastronomica premium dentro de la restriccion.`);
      }
      if (((formData.ocasionEspecial || '').toLowerCase() === 'luna-de-miel' || (formData.ocasionEspecial || '').toLowerCase() === 'aniversario') && formData.prioridadGasto === 'gastronomia') {
        reglas.push(`- ROMANCE+GASTRONOMIA: Cada cena es un evento romantico (vista, menu degustacion para dos). Al menos 1 experiencia gastronomica unica por viaje.`);
      }
      if (esViajeroPro && (interesesArray.includes('naturaleza') || interesesArray.includes('aventura') || interesesArray.includes('deporte'))) {
        reglas.push(`- NATURALEZA/DEPORTE LOCAL EXPERTO: Actividades que usan los locales, no circuitos turisticos. Al menos 1 actividad sin presencia en TripAdvisor ni Civitatis.`);
      }
      if (formData.restriccionDietaria && formData.restriccionDietaria !== 'sin-restriccion' && (interesesArray.includes('naturaleza') || interesesArray.includes('aventura'))) {
        reglas.push(`- ALIMENTACION EN RUTA+RESTRICCION (\): Para dias de naturaleza/aventura completos, indicar donde conseguir provisiones dentro de la restriccion.`);
      }
      if ((formData.tipoViaje || '').toLowerCase() === 'familia' && (formData.numNinos || 0) >= 3) {
        reglas.push(`- FAMILIA NUMEROSA (\ ninos): Max 2 destinos/dia. Descanso entre actividades. Restaurantes amplios con menu infantil. Alojamiento con cocina preferible.`);
      }
      return reglas.join('\n');
    })();

    // -- Movilidad reducida ----------------------------------------------------
    const movilidadCtx = formData.movilidadReducida
      ? '\n- MOVILIDAD REDUCIDA: TODAS las actividades deben ser accesibles (sin escaleras largas ni terrenos irregulares). Prioriza transporte y alojamiento accesibles. Menciona accesibilidad en cada actividad.'
      : '';


    // -- Eficiencia de distancia seg�n d�as de viaje ---------------------------
    const _origenNorm = (formData.origen || 'Santiago, Chile').toLowerCase();
    const _esSudAmerica = ['chile','argentina','per�','peru','colombia','brasil','brazil','bolivia','ecuador','uruguay','venezuela','paraguay'].some(p => _origenNorm.includes(p));
    const _maxVuelo = dias <= 4 ? 6 : dias <= 7 ? 10 : dias <= 11 ? 14 : 99;
    const distanciaCtx = (_esSudAmerica && _maxVuelo < 99)
      ? `\n- DISTANCIA VUELO (${dias}d desde ${formData.origen || 'Chile'}): máx razonable ${_maxVuelo}h/tramo.${
          dias <= 4 ? ' PROHIBIDO Europa/Asia/Oceanía (4d o menos).' :
          dias <= 7 ? ' Vuelo >10h deja pocos días reales; incluye aviso en resumen.distribucion.' :
          ' Incluye aviso en resumen.distribucion si vuelo supera 14h.'}`
      : '';

    // -- Ritmo efectivo: ajustado por ocasión especial y composición del grupo --
    // IMPORTANTE: debe definirse ANTES de clienteCtx que lo usa
    const ritmoEfectivo = (() => {
      const oc = formData.ocasionEspecial || '';
      let base = formData.ritmo || 3;
      // Luna de miel / aniversario suavizan ritmo alto
      if ((oc === 'luna-de-miel' || oc === 'aniversario') && base > 3) base = 3;
      // Familias con 3+ niños: bajar 1 nivel automáticamente (logística + descansos)
      if (formData.tipoViaje === 'familia' && (formData.numNinos || 0) >= 3 && base > 1) base = base - 1;
      return base;
    })();

    // -- Presupuesto por día (también necesario antes de clienteCtx) -----------
    const presupuestoDia = Math.round(presupuesto / dias);
    const presupuestoDiaRule = `\n- PRESUPUESTO DIARIO: $${presupuestoDia}/persona/día. ${
      presupuestoDia < 80 ? 'Hostal/Airbnb económico, comidas callejeras, tours gratuitos.' :
      presupuestoDia < 150 ? 'Hotel 3★ o Airbnb confort, mezcla callejero + mid-range.' :
      presupuestoDia < 250 ? 'Hotel 4★, restaurantes de calidad, 1 experiencia premium.' :
      'Hotel 4-5★ o boutique, experiencias premium como primera opción.'} Aplica en alojamiento, restaurantes y actividades.`;

    // -- clienteCtx completo ---------------------------------------------------
    const clienteCtx = `
DATOS DEL CLIENTE:
- Nombre: ${formData.nombre}
- Destino: ${formData.destino || 'Destino flexible'}
- Origen: ${formData.origen || 'Santiago, Chile'}
- Presupuesto: $${presupuesto >= 15000 ? '15.000+' : presupuesto} USD por persona (TOTAL para TODO el viaje: vuelos + alojamiento + comidas + actividades)
- Duraci�n: ${dias} d�as
- Tipo de viajero: ${formData.tipoViaje || 'pareja'}${formData.ocasionEspecial && formData.ocasionEspecial !== 'sin-ocasion' ? ` � ${formData.ocasionEspecial.replace(/-/g, ' ')}` : ''}
- N�mero de viajeros: ${formData.numViajeros || 2}${formData.tipoViaje === 'familia' && (formData.numNinos || 0) > 0 ? ` (${formData.numNinos} ni�o${formData.numNinos > 1 ? 's' : ''} + ${(formData.numViajeros || 2) - (formData.numNinos || 0)} adulto${(formData.numViajeros || 2) - (formData.numNinos || 0) !== 1 ? 's' : ''})` : ''}
- Intereses EN ORDEN DE PRIORIDAD: ${interesesConPeso}
- Ritmo: ${ritmoEfectivo <= 2 ? 'Relajado (max 2 actividades/día)' : ritmoEfectivo <= 3 ? 'Moderado (2-3 actividades)' : 'Intenso (3-4 actividades)'}${ritmoEfectivo !== (formData.ritmo || 3) ? ` (ajustado de ${formData.ritmo}/5 ${formData.tipoViaje === 'familia' && (formData.numNinos || 0) >= 3 ? 'por familia con ' + formData.numNinos + ' niños' : 'por ocasión especial'})` : ''}
- Alojamiento preferido: ${formData.alojamiento || 'hotel'}${ocasionCtx}${restriccionCtx}${horarioCtx}${aerolineaCtx}${prioridadCtx}${primeraVisitaCtx}${experienciaViajeroCtx}${movilidadCtx}${distanciaCtx}
${budgetWarning}
Hoy es ${today}. Los precios, vuelos y datos de alojamiento deben ser realistas para esta fecha.
${formData.mesViaje
  ? `FECHAS: el viajero quiere viajar en ${formData.mesViaje.replace('-', ' ')}. Prop�n fecha_salida y fecha_regreso REALES en ese mes en formato YYYY-MM-DD. fecha_regreso = fecha_salida + ${dias} d�as. Si ese mes es temporada alta en el destino, mencionarlo en resumen.distribucion con el impacto real en precios.`
  : `Para fecha_salida y fecha_regreso: prop�n fechas REALES en formato YYYY-MM-DD, m�nimo 6-8 semanas desde hoy (${today}), en temporada ideal para el destino. fecha_regreso = fecha_salida + ${dias} d�as.`
}
Para origen_iata y destino_iata: c�digo IATA de 3 letras del aeropuerto principal.`;

    // -- Detecci�n de viaje dom�stico -----------------------------------------
    const origenStr  = (formData.origen  || 'Santiago, Chile').toLowerCase();
    const destinoStr = (formData.destino || '').toLowerCase();
    const paisesComunes = ['chile','argentina','per�','peru','bolivia','colombia','ecuador',
                           'brasil','brazil','uruguay','paraguay','venezuela','m�xico','mexico',
                           'costa rica','panam�','panama','cuba'];
    const isDomestic = paisesComunes.find(p => origenStr.includes(p) && destinoStr.includes(p)) || null;

    // -- B: Contexto de viaje personalizado (visa + adaptador) para el checklist -
    const travelContext = !isDomestic ? getCountryTravelContext(origenStr, destinoStr) : '';
    const checklistRule = travelContext
      ? `- CHECKLIST PERSONALIZADO: Para los �tems del checklist, usa OBLIGATORIAMENTE esta informaci�n verificada sobre los requisitos del viaje desde ${formData.origen || 'Chile'} hacia ${formData.destino}:\n${travelContext}\nEstos �tems DEBEN aparecer literalmente en el checklist (no los parafrasees ni inventes informaci�n diferente). Completa el resto con �tems pr�cticos de preparativos: contratar seguro de viaje, llevar efectivo en la moneda local, confirmar reservas de vuelo y alojamiento, descargar apps �tiles (Google Maps offline, Uber, traductor), ropa adecuada al clima del destino. Total: 8-10 �tems concisos y accionables.`
      : '';

    // -- Regla OPTIMIZACI�N GEOGR�FICA ----------------------------------------
    const geoRule = `- RUTA GEOGRÁFICA: Multi-destino: ordena ciudades sin retrocesos innecesarios. Día a día: agrupa actividades por zona, sin extremos opuestos en el mismo día; incluye "ruta_optimizada" con el orden sugerido. Vuelos: conexiones lógicas.`;

    // -- Regla D�AS: siempre generar los N d�as completos ---------------------
    const diasRule = `- DÍAS: "dias" debe tener EXACTAMENTE ${dias} objetos. Con presupuesto bajo usa actividades gratuitas/económicas pero NUNCA generes menos días.`;

    // -- Regla viaje dom�stico ------------------------------------------------
    const domesticRule = isDomestic
      ? `- DOMÉSTICO: (1) checklist: solo cédula/DNI, sin pasaporte ni visa. (2) dinero.tipo_cambio="No aplica – misma moneda"; donde_cambiar="No aplica". (3) seguro: solo asistencia nacional. (4) adaptador_enchufe="No necesario". (5) emergencias.embajada="No aplica". (6) tips_culturales: sin menciones de cambio de moneda ni adaptadores.`
      : '';

    // Plataformas seg�n preferencia del cliente
    // hotel ? Eco=Airbnb, Mid=Booking.com, Prem=Booking.com
    // airbnb ? todo Airbnb | hostal ? todo Hostelworld | bnb ? todo Booking.com
    const alojPref   = formData.alojamiento || 'hotel';
    const interesStr = interesesConPeso; // ya calculado con pesos/prioridad
    const tipoViaje  = (formData.tipoViaje || 'pareja').toLowerCase();
    const ocasion = (formData.ocasionEspecial || '').toLowerCase();
    const tipoViajeRule = tipoViaje === 'familia'
      ? `- TIPO FAMILIA: ${(formData.numNinos || 0) > 0 ? (formData.numNinos) + ' niño' + ((formData.numNinos) > 1 ? 's' : '') : 'todas las edades'}.${formData.movilidadReducida ? ' Accesibilidad en todo.' : ''} Actividades aptas para niños, restaurantes con menú infantil, alojamiento familiar, sin riesgo. Tono: cálido.`
      : tipoViaje === 'pareja'
        ? ocasion === 'luna-de-miel'
          ? `- TIPO LUNA DE MIEL: Todo íntimo y memorable. Actividades privadas para dos, cenas con vista romántica, suite o superior (avisen al hotel), 1 sorpresa/día. Tono: poético.`
          : ocasion === 'aniversario'
          ? `- TIPO ANIVERSARIO: 1 cena o experiencia muy memorable, alojamiento doble especial. Tono: celebratorio.`
          : `- TIPO PAREJA: Experiencias íntimas, restaurantes románticos, alojamiento doble especial. Tono: evocador.`
        : tipoViaje === 'solo'
          ? `- TIPO SOLO: Tours grupales para socializar, énfasis en seguridad y apps de transporte. Tono: empoderador.`
          : tipoViaje === 'amigos'
            ? ocasion === 'despedida'
              ? `- TIPO DESPEDIDA: Actividades grupales con adrenalina, 2+ noches de vida nocturna, algo especial para el/la protagonista, Airbnb casa completa. Tono: enérgico.`
              : ocasion === 'cumpleanos'
              ? `- TIPO CUMPLEAÑOS: 1 actividad o cena especial para el festejo. Restaurantes festivos. Tono: jovial.`
              : `- TIPO AMIGOS: Actividades grupales (aventura, nocturna), mesas grandes, Airbnb casa completa. Tono: enérgico.`
            : tipoViaje.includes('empresa') || tipoViaje.includes('corporat') || tipoViaje.includes('negocio')
              ? `- TIPO EMPRESARIAL: Hotel de negocios con WiFi, restaurantes formales, team building. Tono: profesional.`
              : `- TIPO: ${tipoViaje}. Adapta el itinerario.`;

    // -- Reglas de personalizaci�n adicionales (nuevos campos del form) --------
    const reglasPersonalizacion = [
      `- INTERESES: ${interesesConPeso}. Principal=60% actividades, 2do=25%, 3ro=10%, 4to=ocasional. Mapeo: gastronomia→mercados/cocina/degustaciones; aventura→senderismo/kayak/extremos; playa→playas/snorkeling/surf; cultura→museos/historia/arte; naturaleza→parques/cascadas; nocturna→bares/rooftops/clubes.`,
      restriccionCtx ? `- ALIMENTACIÓN: ${restriccionDescMap[formData.restriccionDietaria]}` : '',
      horarioCtx,
      aerolineaCtx ? `- AEROLÍNEA: ${aerolineaDescMap[formData.aerolineaPreferida]} — primera si opera la ruta a máx 20% sobre la más barata.` : '',
      prioridadCtx ? `- PRIORIDAD GASTO: ${prioridadDescMap[formData.prioridadGasto]}` : '',
      primeraVisitaCtx ? primeraVisitaCtx.replace('\n- ', '- ') : '',
      formData.nombre ? `- NOMBRE: Usa "${formData.nombre}" 1 vez/día en una actividad en momento emotivo. Natural, no repetitivo.` : '',
      presupuestoDiaRule,
      formData.mesViaje
        ? `- CLIMA (${formData.mesViaje.replace('-', ' ')}): Adapta actividades al clima real ese mes en ${formData.destino || 'el destino'}: calor→exterior mañana/mediodía cubierto; lluvia→alternativas cubiertas diarias; temp.alta→avisar sobre reservas anticipadas; incluir actividades estacionales.`
        : '',
      interesesArray.length > 0
        ? `- CIUDADES MULTI-DESTINO: Prioriza ciudades que maximicen "${interesesArray[0]}": playa→costeras; cultura→patrimonio; gastronomía→identidad culinaria; aventura→naturaleza. Sin distribución equitativa si una encaja mejor.`
        : '',
      formData.restriccionDietaria && formData.restriccionDietaria !== 'sin-restriccion'
        ? `- DIETA ESTRICTA (${formData.restriccionDietaria.toUpperCase()}): Afecta barrios y restaurantes. Veganos→plant-based; halal→comunidad musulmana; sin-gluten→cómo pedirlo en tips_culturales. Todos los restaurantes con opciones.`
        : '',
      experienciaViajeroCtx ? experienciaViajeroCtx.replace(/^\n/, '') : '',
      crucesSenales || '',
      `- TÍTULO: creativo, incluye destino y esencia; si hay ocasión especial incorpórala. SUBTÍTULO: usa "${formData.nombre}", tono de amigo de confianza. Sin frases genéricas.`,
    ].filter(Boolean).join('\n');

    // -- Regla ALOJAMIENTO seg�n preferencia ---------------------------------
    const alojRule = alojPref === 'hostal'
      ? `- ALOJAMIENTO: Hostales. Usa 'zona' (barrio, ej: 'El Raval') y 'nombre' (descriptor, ej: 'Hostal social 8.5+ en El Raval'). PROHIBIDO hoteles de cadena. Plataforma: Hostelworld. 3 opciones: Economico, Confort, Premium.`
      : alojPref === 'airbnb'
        ? `- ALOJAMIENTO: Airbnb. Usa 'zona' (barrio) y 'nombre' (descriptor tipo+zona, ej: 'Apartamento entero en Palermo Soho'). Economico=habitacion privada; Confort/Premium=apartamento/casa entera. 3 opciones.`
        : alojPref === 'bnb'
          ? `- ALOJAMIENTO: Bed & Breakfast. Usa 'zona' (barrio) y 'nombre' (descriptor, ej: 'B&B con desayuno en casco historico'). Booking filtro: Bed and breakfast. 3 opciones. Plataforma: Booking.com.`
          : `- ALOJAMIENTO: Usa 'zona' (barrio/area) y 'nombre' (descriptor categoria+tipo, ej: 'Hotel boutique 4 estrellas en el Eixample'). 3 opciones: Economico, Confort, Premium.`;
    const platEco  = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Booking.com';    // hotel ? Econ�mico en Booking.com (antes Airbnb ? bug corregido)
    const platMid  = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Booking.com';    // hotel ? Confort en Booking.com
    const platPrem = alojPref === 'hostal'  ? 'Hostelworld'
                   : alojPref === 'airbnb'  ? 'Airbnb'
                   : alojPref === 'bnb'     ? 'Booking.com'
                   : 'Booking.com';    // hotel ? Premium en Booking.com
    // Links de busqueda segun plataforma -- Booking con estrellas por categoria, Hostelworld con rating minimo, Airbnb con tipo habitacion
    const bookingEco  = alojPref === 'bnb'
      ? 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=pt%3D11'
      : 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=ht_id%3D204%3Bclass%3D2%3Bclass%3D3';
    const bookingMid  = alojPref === 'bnb'
      ? 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=pt%3D11'
      : 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=ht_id%3D204%3Bclass%3D3%3Bclass%3D4';
    const bookingPrem = alojPref === 'bnb'
      ? 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=pt%3D11'
      : 'https://www.booking.com/searchresults.html?ss=ZONA,+CIUDAD&group_adults=VIAJEROS&nflt=ht_id%3D204%3Bclass%3D4%3Bclass%3D5';
    const linkEco  = platEco  === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes?room_types%5B%5D=Private+room&query=ZONA'
                   : platEco  === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=ZONA,+CIUDAD&min_rating=75'
                   : bookingEco;
    const linkMid  = platMid  === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes?room_types%5B%5D=Entire+home%2Fapt&query=ZONA'
                   : platMid  === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=ZONA,+CIUDAD&min_rating=80'
                   : bookingMid;
    const linkPrem = platPrem === 'Airbnb'       ? 'https://www.airbnb.com/s/CIUDAD/homes?room_types%5B%5D=Entire+home%2Fapt&query=ZONA'
                   : platPrem === 'Hostelworld'   ? 'https://www.hostelworld.com/search?search_keywords=ZONA,+CIUDAD&min_rating=85'
                   : bookingPrem;

    const alojamientoSchema = `
"alojamiento": [
  {
    "destino": "string (ciudad)",
    "noches": numero,
    "opciones": [
      { "plataforma": "${platEco}",  "zona": "string (barrio)", "nombre": "string (descriptor tipo+zona)", "categoria": "Economico", "precio_noche": "string USD", "puntuacion": "string", "cancelacion": "Gratuita", "highlights": ["string"], "por_que": "string VIVANTE", "link": "${linkEco}" },
      { "plataforma": "${platMid}",  "zona": "string (barrio)", "nombre": "string (descriptor tipo+zona)", "categoria": "Confort",   "precio_noche": "string USD", "puntuacion": "string", "cancelacion": "Gratuita", "highlights": ["string"], "por_que": "string VIVANTE", "link": "${linkMid}" },
      { "plataforma": "${platPrem}", "zona": "string (barrio)", "nombre": "string (descriptor tipo+zona)", "categoria": "Premium",   "precio_noche": "string USD", "puntuacion": "string", "cancelacion": "string",   "highlights": ["string"], "por_que": "string VIVANTE", "link": "${linkPrem}" }
    ]
  }
]`;
    const restaurantesSchema = `
"restaurantes": {
  "NOMBRE_REAL_CIUDAD_1": [
    {
      "nombre": "string (nombre real del restaurante)",
      "ubicacion": "string (barrio/zona espec�fica)",
      "tipo": "string (ej: Japon�s tradicional, Tapas modernas)",
      "precio_promedio": "string (ej: $15-25 USD por persona)",
      "requiere_reserva": boolean,
      "por_que": "string en voz VIVANTE de por qu� vale la pena",
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
IMPORTANTE: Reemplaza NOMBRE_REAL_CIUDAD_1 y NOMBRE_REAL_CIUDAD_2 con los nombres reales de las ciudades visitadas. Si el viaje es a UNA SOLA ciudad y dura m�s de ${dias > 7 ? `${dias} d�as (m�s de 7)` : '7 d�as'} incluye ${dias > 7 ? '5' : '3'} restaurantes para esa ciudad${dias > 7 ? ' � no 3, sino 5' : ''}. Para m�ltiples ciudades, incluye 3 restaurantes por ciudad. Var�a barrios, tipos de cocina y rangos de precio.`;

    const experienciasSchema = `
"experiencias": [
  {
    "nombre": "string (nombre de la actividad/tour)",
    "por_que_vale": "string en voz VIVANTE",
    "duracion": "string (ej: 3 horas)",
    "precio": "string (ej: $25-40 USD por persona)",
    "anticipacion": "string (ej: Reservar con 1 semana de anticipaci�n)",
    "plataformas_disponibles": ["GetYourGuide", "Civitatis"],
    "link_gyg": null
  }
]
IMPORTANTE sobre plataformas_disponibles: La GRAN MAYOR�A de tours y actividades tur�sticas est�n en GetYourGuide y/o Civitatis. REGLA: por defecto usa ["GetYourGuide", "Civitatis"]. Si solo est� en una ? pon solo esa. Usa [] �NICAMENTE para actividades gratuitas/locales que NO se comercializan online (ej: entrar a una iglesia gratis, caminar por un barrio, mercado sin entrada). NUNCA uses "Viator". En caso de duda, incluye GetYourGuide. Si ni GetYourGuide ni Civitatis tienen la actividad, usa [].`;

    const basicCtx = basicItinerary ? `
CONTEXTO: El cliente ya tiene su plan B�sico. Tu tarea es generar �NICAMENTE las secciones EXCLUSIVAS del plan Pro.
Datos del itinerario b�sico existente (para contexto de coherencia):
- Destino: ${basicItinerary.resumen?.destino || formData.destino}
- Fecha salida: ${basicItinerary.resumen?.fecha_salida || ''} / Regreso: ${basicItinerary.resumen?.fecha_regreso || ''}
- Distribuci�n de d�as: ${basicItinerary.resumen?.distribucion || ''}
- Vuelos ya sugeridos: ${(basicItinerary.vuelos || []).map(v => v.aerolinea + ' (' + v.ruta + ')').join('; ')}

INSTRUCCI�N CR�TICA: El JSON que debes generar contiene �NICAMENTE las siguientes secciones Pro (NO repitas vuelos, alojamiento, dias, restaurantes, experiencias ni ninguna secci�n b�sica � esas ya las tiene el cliente y se fusionar�n autom�ticamente):
` : '';


    // -- RUTA ESPECIAL: Basic?Pro upgrade con itinerario b�sico disponible ------
    // Si es Pro Y tenemos el itinerario b�sico, solo pedimos las secciones Pro exclusivas
    // y las fusionamos con el b�sico en el servidor ? 100% continuidad garantizada
    // ?? Validaci�n de destino: el basicItinerary DEBE corresponder al mismo destino actual
    if (basicItinerary) {
      const basicDest   = (basicItinerary.resumen?.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
      const currentDest = (formData.destino || '').toLowerCase().split(/[,(-]/)[0].trim();
      const coinciden   = basicDest && currentDest && (basicDest.includes(currentDest) || currentDest.includes(basicDest));
      if (!coinciden) {
        console.log(`?? Server: basicItinerary ignorado (destino "${basicDest}" ? "${currentDest}"). Generando Pro completo.`);
        basicItinerary = null; // forzar generaci�n completa
      }
    }
    if (isPro && basicItinerary) {
      const promptProSolo = `${basicCtx}
GENERA JSON puro (sin markdown, sin \`\`\`) con SOLO estas secciones Pro exclusivas, coherentes con el destino ${basicItinerary.resumen?.destino || formData.destino} y las fechas ${basicItinerary.resumen?.fecha_salida || ''} ? ${basicItinerary.resumen?.fecha_regreso || ''}:
${clienteCtx}
${tipoViajeRule}

{
  "titulo": "string creativo para la versi�n Pro",
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
    { "categoria": "string segunda categor�a", "actividades": ["string", "string", "string"] },
    { "categoria": "Para d�as de lluvia o descanso", "actividades": ["string", "string", "string"] }
  ],
  "dias_pro": [
    { "numero": 1, "plan_b": "string si llueve o cierra", "ruta_optimizada": "string" }
  ]
}
IMPORTANTE sobre dias_pro: para CADA d�a del viaje (${formData.dias} d�as), incluye su n�mero, un plan_b y una ruta_optimizada. NO repitas las actividades del d�a � solo plan_b y ruta_optimizada.`;

      const groqResProSolo = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptProSolo }],
          temperature: 0.7,
          max_tokens: 2500,
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
          // Fusionar: b�sico + secciones Pro exclusivas
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

          console.log('Basic?Pro merge exitoso. Secciones Pro a�adidas:', Object.keys(proSections).join(', '));

          // Guardar itinerario b�sico para posible uso futuro (ya existe, no sobreescribir)
          // Enviar email de confirmaci�n Pro
          const planLabel = 'Vivante Pro \u2728';
          const fechaTexto = mergedItinerary.resumen?.fecha_optima_texto || '';
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            const emailHtmlPro = buildConfirmationEmail(formData, mergedItinerary, planLabel, fechaTexto);
            const pdfBase64Pro  = await generateItinerarioPdf(mergedItinerary, formData, planLabel);
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'VIVANTE <noreply@vivevivante.com>',
                reply_to: 'vive.vivante.ch@gmail.com',
                to: [formData.email],
                subject: `\u2708\ufe0f Tu itinerario VIVANTE Pro est\u00e1 listo \u2014 ${mergedItinerary.titulo || 'Tu aventura'}`,
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
      console.log('Basic?Pro merge fall�, generando Pro completo...');
    }

    // ── SPLIT EN 2 LLAMADAS GROQ ──────────────────────────────────────────────
    // Call 1 (llama-3.1-8b-instant, 20k TPM): secciones de contenido (días + metadata)
    // Call 2 (llama-3.3-70b-versatile, 6k TPM): secciones de logística (vuelos + alojamiento)

    const proSectionsCall1 = isPro ? `,
  "bares_vida_nocturna": {
    "NOMBRE_REAL_CIUDAD": [
      { "nombre": "string", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" },
      { "nombre": "string 2", "tipo_ambiente": "string", "precio_trago": "string", "mejor_dia": "string", "tip": "string" }
    ]
  },
  "idioma_cultura": {
    "idioma": "string",
    "frases_utiles": [{ "frase_local": "string", "pronunciacion": "string", "significado": "string" }],
    "costumbres": "string", "vestimenta": "string", "mala_educacion": "string"
  },
  "que_empacar": {
    "clima_esperado": "string", "ropa": ["string"],
    "adaptador_enchufe": "string", "botiquin": ["string"], "power_bank": "string"
  },
  "extras": [
    { "categoria": "string basado en intereses", "actividades": ["string", "string", "string"] },
    { "categoria": "Para dias de lluvia o descanso", "actividades": ["string", "string", "string"] }
  ],
  "dias_pro": [
    { "numero": 1, "plan_b": "string si llueve o cierra", "ruta_optimizada": "string" }
  ]` : '';

    const proSectionsCall2 = isPro ? `,
  "transporte_local": {
    "como_moverse": "string", "apps_recomendadas": ["string"],
    "tarjeta_transporte": "string",
    "opciones_aeropuerto_centro": [{ "medio": "string", "costo": "string", "duracion": "string", "tip": "string o null" }],
    "conviene_auto": "string"
  },
  "conectividad": {
    "roaming": "string", "esim_recomendada": "string",
    "sim_local": "string", "wifi_destino": "string", "apps_descargar": ["string"]
  },
  "festivos_horarios": {
    "feriados_en_fechas": "string", "horario_comercial": "string",
    "horarios_comida": "string", "museos": "string"
  },
  "salud_seguridad": {
    "vacunas": "string", "agua_potable": "string", "nivel_seguridad": "string",
    "zonas_evitar": "string", "estafas_comunes": "string"
  }` : '';

    const promptCall1 = `Eres el planificador de VIVANTE. Genera el itinerario diario con tono cercano, directo, como un amigo experto. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS:
${diasRule}
- PRECIOS "por persona": en TODOS los campos de precio agrega "/ persona". Aplica sin excepcion.
- RITMO: Ritmo efectivo ${ritmoEfectivo}/5. RESPETA: ritmo 1-2 = max 2 actividades/dia; ritmo 3 = 2-3 actividades; ritmo 4-5 = 3-4 actividades.
${reglasPersonalizacion}
${tipoViajeRule}${geoRule}${domesticRule ? '\n' + domesticRule : ''}${checklistRule ? '\n' + checklistRule : ''}

GENERA JSON puro (sin markdown, sin \`\`\`) con EXACTAMENTE estas secciones:
{
  "titulo": "string creativo",
  "subtitulo": "string tagline motivador",
  "resumen": {
    "destino": "string",
    "origen": "string",
    "dias": numero,
    "viajeros": numero,
    "tipo": "string",
    "presupuesto_total": "string USD / persona",
    "ritmo": "string",
    "fecha_salida": "YYYY-MM-DD",
    "fecha_regreso": "YYYY-MM-DD",
    "origen_iata": "string (3 letras)",
    "destino_iata": "string (3 letras)",
    "fecha_optima_texto": "string (ej: Salida 15 de mayo, regreso 25 de mayo 2026)",
    "distribucion": "string con distribucion de dias por zona"
  },
  "dias": [
    {
      "numero": numero,
      "titulo": "string creativo",
      "manana": { "horario": "string", "actividad": "string detallado", "costo": "string / persona", "tip": "string insider" },
      "tarde": { "horario": "string", "almuerzo": "string (restaurante + precio / persona)", "actividad": "string", "costo": "string / persona" },
      "noche": { "cena": "string (restaurante + precio / persona)", "actividad": "string" },
      "ruta_optimizada": "string con orden logico de zonas",
      "gasto_dia": "string USD / persona"
    }
  ],
  "tips_culturales": ["string tip cultural", "string tip conectividad", "string tip dinero", "string tip transporte", "string tip costumbres"],
  "dinero": {
    "moneda_local": "string", "tipo_cambio": "string",
    "tarjeta_o_efectivo": "string", "donde_cambiar": "string",
    "propinas": "string", "tip_extra": "string"
  },
  "checklist": ["string", "string", "string", "string", "string", "string", "string", "string"],
  "emergencias": {
    "embajada": "string (direccion y telefono)",
    "emergencias_local": "string (numero local)",
    "policia_turistica": "string o null"
  },
  "lo_imperdible": [
    { "nombre": "string", "descripcion": "string inspirador en voz VIVANTE" }
  ]${proSectionsCall1}
}`;

    const groqRes1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: promptCall1 }],
        temperature: 0.7,
        max_tokens: 4500,
      }),
    });

    if (!groqRes1.ok) {
      const err1 = await groqRes1.text();
      console.error('Groq Call1 error:', groqRes1.status, err1.substring(0, 200));
      return NextResponse.json({ error: 'Error generando itinerario' }, { status: 500 });
    }

    const groqData1 = await groqRes1.json();
    const raw1 = groqData1.choices[0]?.message?.content || '';
    const finish1 = groqData1.choices[0]?.finish_reason;
    console.log('Call1 finish_reason:', finish1, '| length:', raw1.length);

    let part1 = null;
    try {
      const cl1 = raw1.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const s1 = cl1.indexOf('{');
      const str1 = s1 >= 0 ? cl1.substring(s1) : cl1;
      try { part1 = JSON.parse(str1); } catch {}
      if (!part1) {
        let pos1 = str1.lastIndexOf('}');
        while (pos1 > 0 && !part1) {
          try { part1 = JSON.parse(str1.substring(0, pos1 + 1)); }
          catch { pos1 = str1.lastIndexOf('}', pos1 - 1); }
        }
      }
    } catch (e) { console.error('Call1 parse error:', e.message); }

    if (!part1) {
      console.error('Call1 parse failed. Preview:', raw1.substring(0, 300));
      return NextResponse.json({ error: 'Error generando itinerario' }, { status: 500 });
    }
    console.log('Call1 OK. Dias:', (part1.dias || []).length, '| Secciones:', Object.keys(part1).join(', '));

    // ── Call 2: llama-3.3-70b-versatile → vuelos + alojamiento + calidad ──────
    const _fechaSalida2  = part1.resumen?.fecha_salida  || '';
    const _fechaRegreso2 = part1.resumen?.fecha_regreso || '';
    const _destino2      = part1.resumen?.destino       || formData.destino;

    const promptCall2 = `Eres el experto en logistica de viajes de VIVANTE. Genera vuelos, alojamiento, restaurantes, experiencias y presupuesto. Precios realistas para ${currentYear}.
${clienteCtx}
FECHAS CONFIRMADAS: Salida ${_fechaSalida2} — Regreso ${_fechaRegreso2}
DESTINO CONFIRMADO: ${_destino2}

REGLAS:
- VUELOS: Usa conocimiento real de rutas aereas. Minimo 3 aerolineas distintas. SOLO escala="Directo" si existe vuelo directo REAL. En "ruta" especifica ciudades reales (ej: "SCL -> BOG -> NRT").${isDomestic ? ' VIAJE DOMESTICO: vuelos dentro del mismo pais.' : ''}
${alojRule}
- RESTAURANTES: UNA SOLA ciudad y viaje >7 dias = 5 restaurantes. Multi-ciudad o <=7 dias = 3 restaurantes por ciudad.
- PRESUPUESTO: presupuesto_desglose.total NO debe superar $${presupuesto} USD por persona.
- PRECIOS "por persona": agrega "/ persona" en todos los campos de precio.
- AEROLINEAS PERMITIDAS: LATAM, JetSmart, Sky Airline, Avianca, Copa Airlines, Aerolineas Argentinas, Aeromexico, GOL, Azul, American Airlines, United Airlines, Delta, Iberia, Iberia Express, Air Europa, Turkish Airlines, Air France, KLM, Lufthansa, British Airways, TAP Portugal, Norwegian, EasyJet, Ryanair, Qatar Airways, Emirates, Singapore Airlines, Japan Airlines, ANA.

GENERA JSON puro (sin markdown, sin \`\`\`) con EXACTAMENTE estas secciones:
{
  "presupuesto_desglose": {
    "vuelos": "string / persona", "alojamiento": "string / persona",
    "comidas": "string / persona", "actividades": "string / persona",
    "transporte_local": "string / persona", "extras": "string / persona",
    "total": "string / persona"
  },
  "vuelos": [
    { "aerolinea": "string", "ruta": "string", "precio_estimado": "string / persona", "duracion": "string", "escala": "string", "tip": "string" }
  ],
  ${alojamientoSchema},
  ${restaurantesSchema},
  ${experienciasSchema}${proSectionsCall2}
}`;

    const groqRes2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptCall2 }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    let part2 = null;
    if (groqRes2.ok) {
      const groqData2 = await groqRes2.json();
      const raw2 = groqData2.choices[0]?.message?.content || '';
      const finish2 = groqData2.choices[0]?.finish_reason;
      console.log('Call2 finish_reason:', finish2, '| length:', raw2.length);
      try {
        const cl2 = raw2.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const s2 = cl2.indexOf('{');
        const str2 = s2 >= 0 ? cl2.substring(s2) : cl2;
        try { part2 = JSON.parse(str2); } catch {}
        if (!part2) {
          let pos2 = str2.lastIndexOf('}');
          while (pos2 > 0 && !part2) {
            try { part2 = JSON.parse(str2.substring(0, pos2 + 1)); }
            catch { pos2 = str2.lastIndexOf('}', pos2 - 1); }
          }
        }
        if (part2) console.log('Call2 OK. Secciones:', Object.keys(part2).join(', '));
        else console.error('Call2 parse failed. Preview:', raw2.substring(0, 200));
      } catch (e) { console.error('Call2 parse error:', e.message); }
    } else {
      const err2 = await groqRes2.text();
      console.error('Groq Call2 error:', groqRes2.status, err2.substring(0, 200));
    }

    // Fusionar part1 + part2
    let itinerario = part2 ? { ...part1, ...part2 } : part1;

    // Post-procesado: corregir separador de ruta "?" -> "→"
    if (itinerario.vuelos?.length) {
      itinerario.vuelos = itinerario.vuelos.map(v => ({
        ...v,
        ruta: (v.ruta || '').replace(/ \? /g, ' \u2192 '),
      }));
    }

    console.log('Itinerario merge OK. Secciones finales:', Object.keys(itinerario).join(', '));


    // --- EMAIL HTML (resumen simplificado para el correo) ----------------------
    const planLabel = isPro ? 'Vivante Pro \u2728' : 'Vivante B\u00e1sico';
    const fechaTexto = itinerario.resumen?.fecha_optima_texto || '';

    const emailHtml = buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const pdfBase64 = await generateItinerarioPdf(itinerario, formData, planLabel);
      if (!pdfBase64) console.error('[VIVANTE] PDF generation failed — email will be sent WITHOUT attachment. Check pdfmake/vfs_fonts in Vercel logs.');
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VIVANTE <noreply@vivevivante.com>',
          reply_to: 'vive.vivante.ch@gmail.com',
          to: [formData.email],
          subject: `\u2708\ufe0f ${itinerario.titulo || 'Tu itinerario VIVANTE est\u00e1 listo'} \u2014 ${planLabel}`,
          html: emailHtml,
          ...(pdfBase64 && { attachments: [{ filename: `itinerario-vivante-${isPro ? 'pro' : 'basico'}.pdf`, content: pdfBase64 }] }),
        }),
      });
      if (!emailRes.ok) console.error('Resend error:', await emailRes.text());
    }

    // -- Brevo: email upsell Pro v�a template (solo para plan b�sico) ---------
    if (!isPro) {
      const brevoKey = process.env.BREVO_API_KEY;
      if (brevoKey) {
        // Construir URL del bot�n de upgrade con todos los datos del formulario
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
