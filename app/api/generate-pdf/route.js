import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ── URL builder helpers ───────────────────────────────────────────────────────
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
  const nombre = (op.nombre || '').trim();
  if (plat.includes('hostel')) {
    const fmtHW = (d) => { if (!d) return ''; const [y,m,dd]=d.split('-'); return `${dd}%2F${m}%2F${y}`; };
    return `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(nombre+', '+(destino||''))}&dateFrom=${fmtHW(checkin)}&dateTo=${fmtHW(checkout)}&numberOfGuests=${adults||2}`;
  }
  if (plat.includes('airbnb')) {
    const p = new URLSearchParams({ checkin: checkin||'', checkout: checkout||'', adults: adults||2, query: nombre });
    return `https://www.airbnb.com/s/${encodeURIComponent(destino||'')}/homes?${p}`;
  }
  const searchTerm = nombre ? `${nombre}, ${destino}` : destino;
  const p = new URLSearchParams({ ss: searchTerm, checkin: checkin||'', checkout: checkout||'', group_adults: adults||2, no_rooms:1, selected_currency:'USD' });
  if (alojPref === 'bnb') p.append('nflt', 'pt%3D11');
  return `https://www.booking.com/searchresults.html?${p}`;
}

// pdfmake clickable button cell — sin emojis, solo texto seguro
function pdfBtn(label, url, color) {
  if (!url) return { text: '' };
  return {
    table: { widths: ['auto'], body: [[{
      text: label, link: url, color: '#fff', fontSize: 7, bold: true,
      border: [false,false,false,false], margin: [6,3,6,3]
    }]] },
    layout: { fillColor: () => color, hLineWidth: ()=>0, vLineWidth: ()=>0 },
    margin: [0,2,0,2]
  };
}

// Isotipo VIVANTE vectorial embebido — no depende del filesystem
// Usa stroke="STROKE_COLOR" como placeholder reemplazado en runtime
const LOGO_SVG_TPL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" width="340" height="220" fill="none">
  <path d="M 60 160 L 90 90 L 120 160 Z" stroke="STROKE_COLOR" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
  <path d="M 105 160 L 128 115 L 151 160 Z" stroke="STROKE_COLOR" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
  <path d="M 90 90 L 99 110 L 81 110 Z" stroke="STROKE_COLOR" stroke-width="1.2" stroke-linejoin="round" fill="none"/>
  <circle cx="230" cy="95" r="32" stroke="STROKE_COLOR" stroke-width="1.5" fill="none"/>
  <line x1="230" y1="63" x2="230" y2="127" stroke="STROKE_COLOR" stroke-width="1.1"/>
  <line x1="198" y1="95" x2="262" y2="95" stroke="STROKE_COLOR" stroke-width="1.1"/>
  <path d="M 202 80 Q 230 74 258 80" stroke="STROKE_COLOR" stroke-width="0.9" fill="none"/>
  <path d="M 202 110 Q 230 116 258 110" stroke="STROKE_COLOR" stroke-width="0.9" fill="none"/>
  <path d="M 214 64 Q 208 95 214 126" stroke="STROKE_COLOR" stroke-width="0.9" fill="none"/>
  <path d="M 246 64 Q 252 95 246 126" stroke="STROKE_COLOR" stroke-width="0.9" fill="none"/>
  <circle cx="170" cy="118" r="36" stroke="STROKE_COLOR" stroke-width="1.4" fill="none"/>
  <circle cx="170" cy="118" r="9" stroke="STROKE_COLOR" stroke-width="1.2" fill="none"/>
  <path d="M 170 82 L 163 112 L 170 107 L 177 112 Z" stroke="STROKE_COLOR" stroke-width="1.2" stroke-linejoin="round" fill="STROKE_COLOR" fill-opacity="0.9"/>
  <path d="M 170 154 L 163 124 L 170 129 L 177 124 Z" stroke="STROKE_COLOR" stroke-width="1.2" stroke-linejoin="round" fill="STROKE_COLOR" fill-opacity="0.45"/>
  <path d="M 206 118 L 180 111 L 185 118 L 180 125 Z" stroke="STROKE_COLOR" stroke-width="1.2" stroke-linejoin="round" fill="STROKE_COLOR" fill-opacity="0.45"/>
  <path d="M 134 118 L 160 111 L 155 118 L 160 125 Z" stroke="STROKE_COLOR" stroke-width="1.2" stroke-linejoin="round" fill="STROKE_COLOR" fill-opacity="0.45"/>
  <line x1="143" y1="93" x2="149" y2="99" stroke="STROKE_COLOR" stroke-width="1"/>
  <line x1="197" y1="93" x2="191" y2="99" stroke="STROKE_COLOR" stroke-width="1"/>
  <line x1="143" y1="143" x2="149" y2="137" stroke="STROKE_COLOR" stroke-width="1"/>
  <line x1="197" y1="143" x2="191" y2="137" stroke="STROKE_COLOR" stroke-width="1"/>
  <path d="M 58 168 C 85 160 112 173 139 165 C 166 157 193 171 220 164 C 237 159 248 167 256 162" stroke="STROKE_COLOR" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M 238 174 Q 246 169 254 174 Q 262 179 270 174" stroke="STROKE_COLOR" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <path d="M 242 183 Q 250 178 258 183 Q 266 188 274 183" stroke="STROKE_COLOR" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <circle cx="170" cy="118" r="3" fill="STROKE_COLOR"/>
</svg>`;

function makeLogoSvg(color) {
  return LOGO_SVG_TPL.replace(/STROKE_COLOR/g, color);
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
async function generateItinerarioPdf(itinerario, formData, planLabel) {
  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');
    const vfsFonts = vfsFontsModule.default || vfsFontsModule;
    pdfMake.vfs = vfsFonts?.pdfMake?.vfs || vfsFonts?.vfs || {};

    const CORAL   = '#FF6332';
    const FUCSIA  = '#E83E8C';
    const VIOLETA = '#6F42C1';
    const CARBON  = '#212529';
    const BG0     = '#FFF8F5';
    const BG1     = '#FFF0EB';
    const isPro   = planLabel.toLowerCase().includes('pro');
    const res     = itinerario.resumen || {};

    // Quita emojis y caracteres fuera de Roboto — seguro para pdfmake
    const ce = (str) => {
      if (!str && str !== 0) return '';
      return String(str)
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/\p{Emoji_Presentation}/gu, '')
        .replace(/[\uFE00-\uFE0F]/g, '')
        .replace(/\u200D/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    // planLabel limpio (sin emojis) para usar en nodos de texto
    const planLabelClean = ce(planLabel) || planLabel.replace(/[^\x20-\x7E\u00C0-\u024F]/g, '').trim();

    // Encabezado de seccion con color de fondo
    const secHdr = (txt, col = CORAL) => ({
      table: { widths: ['*'], body: [[{
        text: txt, bold: true, fontSize: 11, color: '#fff',
        margin: [10, 7, 10, 7], border: [false,false,false,false]
      }]] },
      layout: 'noBorders', fillColor: col, margin: [0, 14, 0, 6],
    });

    // Item con bullet circular de color
    const bullet = (txt, col = CARBON, dotColor = CORAL) => ({
      columns: [
        { text: '\u25CF', fontSize: 7, color: dotColor, width: 14, margin: [6, 3, 0, 2] },
        { text: ce(String(txt || '')), fontSize: 8, color: col, margin: [0, 2, 0, 2] },
      ],
      columnGap: 0,
    });

    const content = [];

    // ── PORTADA ───────────────────────────────────────────────────────────────
    content.push({ text: '', margin: [0, 30, 0, 0] });
    content.push({ svg: makeLogoSvg('#ffffff'), width: 200, alignment: 'center', margin: [0, 0, 0, 2] });
    content.push({ text: 'VIVANTE', fontSize: 40, bold: true, color: '#fff', alignment: 'center', characterSpacing: 6, margin: [0, 0, 0, 4] });
    content.push({ text: 'VIAJA MAS. PLANIFICA MENOS', fontSize: 8, color: 'rgba(255,255,255,0.7)', alignment: 'center', characterSpacing: 2, margin: [0, 0, 0, 16] });
    content.push({ canvas: [{ type: 'line', x1: 80, y1: 0, x2: 443, y2: 0, lineWidth: 0.5, lineColor: 'rgba(255,255,255,0.35)' }], margin: [0, 0, 0, 16] });
    content.push({
      table: { widths: ['auto'], body: [[{
        text: planLabelClean.toUpperCase(), bold: true, fontSize: 9, color: CORAL,
        margin: [14, 5, 14, 5], border: [false,false,false,false]
      }]] },
      layout: 'noBorders', fillColor: '#fff', alignment: 'center', margin: [0, 0, 0, 18],
    });
    content.push({ text: ce(itinerario.titulo) || `Itinerario: ${formData.destino}`, fontSize: 20, bold: true, color: '#fff', alignment: 'center', margin: [0, 0, 0, 6] });
    if (itinerario.subtitulo) content.push({ text: ce(itinerario.subtitulo), fontSize: 11, italics: true, color: 'rgba(255,255,255,0.9)', alignment: 'center', margin: [0, 0, 0, 18] });

    const coverRows = [
      res.destino || formData.destino ? ['Destino', res.destino || formData.destino] : null,
      formData.origen               ? ['Origen', formData.origen]                 : null,
      res.fecha_salida              ? ['Ida', res.fecha_salida]                    : null,
      res.fecha_regreso             ? ['Vuelta', res.fecha_regreso]                : null,
      formData.dias                 ? ['Duracion', `${formData.dias} dias`]        : null,
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
        margin: [40, 0, 40, 18],
      });
    }
    content.push({ text: 'vivevivante.com  \u00B7  @vive.vivante', fontSize: 8, color: 'rgba(255,255,255,0.5)', alignment: 'center', margin: [0, 10, 0, 0] });
    content.push({ text: '', pageBreak: 'after' });

    // ── RESUMEN ───────────────────────────────────────────────────────────────
    if (coverRows.length) {
      content.push(secHdr('RESUMEN DEL VIAJE'));
      const resumenRows = [
        ...coverRows,
        res.fecha_optima_texto ? ['Mejor epoca', res.fecha_optima_texto] : null,
        res.distribucion      ? ['Distribucion', res.distribucion]       : null,
        res.ritmo             ? ['Ritmo', res.ritmo]                     : null,
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
        pd.alojamiento ? ['Alojamiento', pd.alojamiento] : null,
        pd.comidas     ? ['Comidas', pd.comidas]         : null,
        pd.transporte  ? ['Transporte', pd.transporte]   : null,
        pd.actividades ? ['Actividades', pd.actividades] : null,
        pd.extras      ? ['Extras', pd.extras]           : null,
        pd.total       ? ['TOTAL ESTIMADO', pd.total]    : null,
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
            { text:'RUTA', bold:true, fontSize:7, color:'#666', border:[false,false,false,false], fillColor:BG1, margin:[4,4,4,4] },
            { text:ce(dia.ruta_optimizada), fontSize:7, color:'#666', border:[false,false,false,false], fillColor:BG1, margin:[4,4,4,4] },
          ]);
        }
        if (dia.manana?.plan_b) {
          dayRows.push([
            { text:'PLAN B', bold:true, fontSize:7, color:'#aaa', border:[false,false,false,false], fillColor:'#fff', margin:[4,3,4,3] },
            { text:ce(dia.manana.plan_b), fontSize:7, color:'#aaa', italics:true, border:[false,false,false,false], fillColor:'#fff', margin:[4,3,4,3] },
          ]);
        }
        const colHdr = di % 2 === 0 ? CORAL : FUCSIA;
        const dayStack = [
          {
            table:{ widths:['*'], body:[[{
              text:`Dia ${dia.numero}: ${ce(dia.titulo)||''}`,
              bold:true, fontSize:11, color:'#fff', border:[false,false,false,false], margin:[10,7,10,7]
            }]] },
            layout:'noBorders', fillColor:colHdr, margin:[0, di===0?0:10, 0, 0],
          }
        ];
        if (dayRows.length) {
          dayStack.push({
            table:{ widths:[80,'*'], body:dayRows },
            layout:{
              hLineWidth:(i)=>i===0||i===dayRows.length?0:0.3,
              hLineColor:()=>'#eee',
              vLineWidth:(i)=>i===1?0.3:0,
              vLineColor:()=>'#eee'
            },
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
      const fHdr = ['Aerolinea','Ruta / Escala','Precio est.','Duracion','Tip','Ver'].map(t => ({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL,
        border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const fRows = itinerario.vuelos.map((v,i) => [
        { text:ce(v.aerolinea)||'', fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:(v.ruta||'').replace(/ \? /g, ' > ')+(v.escala?`\n${v.escala}`:''), fontSize:8, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.precio_estimado||'--', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.duracion||'--', fontSize:8, color:'#666', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:ce(v.tip)||'--', fontSize:7, color:VIOLETA, italics:true, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        pdfBtn('Ver vuelo', buildAirlineUrl(v.aerolinea), CORAL),
      ]);
      content.push({
        table:{ headerRows:1, keepWithHeaderRows:1, widths:[80,100,60,46,'*',60], body:[fHdr,...fRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,10],
      });
    }

    // ── ALOJAMIENTO ───────────────────────────────────────────────────────────
    if (itinerario.alojamiento?.length) {
      content.push(secHdr('ALOJAMIENTO'));
      itinerario.alojamiento.forEach((zona) => {
        if (zona.destino) content.push({
          text:`${zona.destino}${zona.noches?` \u2014 ${zona.noches} noches`:''}`,
          fontSize:9, bold:true, color:VIOLETA, margin:[0,4,0,5]
        });
        const hHdr = ['Categoria','Hotel / Puntuacion','Precio/noche','Por que elegirlo','Reservar'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:VIOLETA,
          border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const hRows = (zona.opciones||[]).map((op,i)=>[
          { text:op.categoria||'--', fontSize:8, bold:true, color:op.categoria==='Premium'?FUCSIA:CORAL, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(op.nombre||'')+(op.puntuacion?`\n${op.puntuacion}`:'')+(op.cancelacion?.toLowerCase().includes('gratuita')?'\nCancelacion gratuita':''), fontSize:8, color:CARBON, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:op.precio_noche||'--', fontSize:8, bold:true, color:VIOLETA, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(op.por_que)||'--', fontSize:7, color:'#555', italics:true, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          pdfBtn('Ver', buildAlojamientoUrl(op, zona.destino, res.fecha_salida, res.fecha_regreso, formData?.numViajeros, formData?.alojamiento), VIOLETA),
        ]);
        content.push({
          table:{ headerRows:1, keepWithHeaderRows:1, widths:[55,100,65,'*',55], body:[hHdr,...hRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8], unbreakable: true,
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
        if (Object.keys(restData).length > 1) content.push({
          text:`${ciudad}`, fontSize:9, bold:true, color:CORAL, margin:[0,5,0,4]
        });
        const rHdr = ['Restaurante','Ubicacion','Tipo','Precio','Reservar'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL,
          border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const rRows = (lista||[]).map((r,i)=>[
          { text:ce(r.nombre)+(r.por_que?`\n${ce(r.por_que)}`:''), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(r.ubicacion||'--'), fontSize:7, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.tipo||'--', fontSize:8, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.precio_promedio||'--', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          r.link_reserva
            ? pdfBtn(r.requiere_reserva ? 'Reservar' : 'Ver', r.link_reserva, r.requiere_reserva ? FUCSIA : CORAL)
            : r.instagram
            ? pdfBtn(r.instagram, 'https://instagram.com/' + (r.instagram||'').replace('@',''), '#E1306C')
            : { text: r.requiere_reserva ? 'Si, reservar' : '--', fontSize:7, color: r.requiere_reserva ? '#27ae60' : '#aaa', border:[false,false,false,false], margin:[4,5,4,5] },
        ]);
        content.push({
          table:{ headerRows:1, keepWithHeaderRows:1, widths:['*',65,62,55,52], body:[rHdr,...rRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8],
        });
      });
    }

    // ── EXPERIENCIAS ──────────────────────────────────────────────────────────
    if (itinerario.experiencias?.length) {
      content.push(secHdr('EXPERIENCIAS Y TOURS', FUCSIA));
      const eHdr = ['Experiencia','Duracion','Precio','Anticipacion','Reservar'].map(t=>({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:FUCSIA,
        border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const eRows = itinerario.experiencias.map((e,i)=>[
        { text:ce(e.nombre||'--')+(e.por_que_vale?'\n'+ce(e.por_que_vale):''), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:ce(e.duracion||'--'), fontSize:8, color:'#666', fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:ce(e.precio||'--'), fontSize:8, bold:true, color:FUCSIA, fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:ce(e.anticipacion||'--'), fontSize:7, color:'#666', fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        (() => {
          const destRaw = (res.destino || (formData && formData.destino) || '').split(/[,(]/)[0].trim();
          const qPlus = ((e.nombre||'') + ' ' + destRaw).trim().replace(/\s+/g, '+');
          const gygUrl = `https://www.getyourguide.com/s/?q=${qPlus}&partner_id=UCJJVUD`;
          const civiSlug = destRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
          const civiUrl = `https://www.civitatis.com/es/${civiSlug}/?q=${encodeURIComponent(e.nombre||'')}`;
          const plats = e.plataformas_disponibles;
          const showGyg = !plats || plats.includes('GetYourGuide');
          const showCivi = !plats || plats.includes('Civitatis') || plats.includes('Viator');
          if (showGyg && showCivi) return {
            stack: [pdfBtn('GetYourGuide', gygUrl, '#FF6600'), pdfBtn('Civitatis', civiUrl, '#00A651')],
            border:[false,false,false,false], fillColor:i%2===0?'#FFF0F7':'#fff', margin:[4,3,4,3]
          };
          if (showGyg) return pdfBtn('GetYourGuide', gygUrl, '#FF6600');
          if (showCivi) return pdfBtn('Civitatis', civiUrl, '#00A651');
          return { text:'Reservar local', fontSize:7, color:'#999', border:[false,false,false,false], margin:[4,5,4,5] };
        })(),
      ]);
      content.push({
        table:{ headerRows:1, keepWithHeaderRows:1, widths:['*',55,60,55,'*'], body:[eHdr,...eRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,8],
      });
    }

    // ── TIPS ──────────────────────────────────────────────────────────────────
    if (itinerario.tips?.length) {
      content.push(secHdr('TIPS CLAVE'));
      itinerario.tips.forEach((tip) => {
        const tipText = typeof tip === 'string' ? tip : (tip.texto || tip.tip || JSON.stringify(tip));
        content.push(bullet(tipText, CARBON, CORAL));
      });
      content.push({ text:'', margin:[0,0,0,6] });
    }

    // Tips culturales
    if (itinerario.tips_culturales?.length) {
      content.push(secHdr('TIPS CULTURALES', VIOLETA));
      itinerario.tips_culturales.forEach((tip) => {
        const tipText = typeof tip === 'string' ? tip : (tip.texto || JSON.stringify(tip));
        content.push(bullet(tipText, CARBON, VIOLETA));
      });
      content.push({ text:'', margin:[0,0,0,6] });
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
      if (dineroRows.length) {
        content.push({
          table: { widths: [110,'*'], body: dineroRows.map(([k,v],i) => [
            { text:k, fontSize:9, bold:true, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[8,6,4,6] },
            { text:v, fontSize:9, color:CARBON, fillColor:i%2===0?BG1:'#fff', border:[false,false,false,false], margin:[4,6,8,6] },
          ]) },
          layout: { hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0 },
          margin:[0,0,0,8],
        });
      }
      if (d.tip_extra) content.push({ text:`TIP: ${ce(d.tip_extra)}`, fontSize:8, color:VIOLETA, italics:true, margin:[0,0,0,8] });
    }

    // ── SEGURO DE VIAJE ───────────────────────────────────────────────────────
    if (itinerario.seguro?.length) {
      content.push(secHdr('SEGURO DE VIAJE'));
      const base = itinerario.seguro || [];
      const hasIati = base.some(s => s.nombre?.toLowerCase().includes('iati'));
      const seguros = hasIati ? base : [...base, {
        nombre:'IATI Seguros',
        cobertura:'Cancelacion, asistencia medica, equipaje y accidentes',
        precio_estimado:'Desde $50 USD',
        link:'https://www.iatiseguros.com/'
      }];
      const sHdr = ['Seguro','Cobertura','Precio aprox.','Ver'].map(t=>({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL,
        border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const sRows = seguros.map((s,i) => {
        const href = s.nombre?.toLowerCase().includes('iati') ? 'https://www.iatiseguros.com/' : (s.link||null);
        return [
          { text:ce(s.nombre||'--'), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(s.cobertura||'--'), fontSize:7, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(s.precio_estimado||'--'), fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          href ? pdfBtn('Ver', href, CORAL) : { text:'--', fontSize:8, color:'#aaa', border:[false,false,false,false], margin:[4,5,4,5] },
        ];
      });
      content.push({
        table:{ headerRows:1, keepWithHeaderRows:1, widths:['*','*',70,50], body:[sHdr,...sRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,8],
      });
    }

    // ── LO IMPERDIBLE ─────────────────────────────────────────────────────────
    if (itinerario.lo_imperdible?.length) {
      content.push(secHdr('LO IMPERDIBLE', FUCSIA));
      itinerario.lo_imperdible.forEach((item, i) => {
        content.push({ text:`${i+1}. ${ce(item.nombre)}`, fontSize:10, bold:true, color:CARBON, margin:[0,6,0,2] });
        content.push({ text:ce(item.descripcion)||'', fontSize:8, color:'#555', margin:[0,0,0,6] });
        if (i < itinerario.lo_imperdible.length - 1) {
          content.push({ canvas:[{ type:'line', x1:0, y1:0, x2:523, y2:0, lineWidth:0.4, lineColor:'#FFD0E8' }], margin:[0,0,0,6] });
        }
      });
    }

    // ── CHECKLIST PRE-VIAJE ───────────────────────────────────────────────────
    if (itinerario.checklist) {
      content.push(secHdr('CHECKLIST PRE-VIAJE'));
      const cl = itinerario.checklist;
      const clSections = Array.isArray(cl)
        ? { 'Preparativos': cl }
        : (typeof cl === 'object' ? cl : { 'Preparativos': [String(cl)] });
      Object.entries(clSections).forEach(([secTitle, items]) => {
        if (typeof items === 'string') {
          content.push({ text: ce(items), fontSize: 8, color: CARBON, margin: [8,3,8,3] });
        } else if (Array.isArray(items)) {
          if (Object.keys(clSections).length > 1) {
            content.push({ text: ce(secTitle), fontSize: 9, bold: true, color: VIOLETA, margin: [0, 5, 0, 3] });
          }
          items.forEach(item => {
            const label = typeof item === 'string' ? item : (item.item || item.nombre || JSON.stringify(item));
            content.push(bullet(label, CARBON, CORAL));
          });
          content.push({ text:'', margin:[0,0,0,3] });
        }
      });
      content.push({ text:'', margin:[0,0,0,6] });
    }

    // ── CONTACTOS DE EMERGENCIA ───────────────────────────────────────────────
    if (itinerario.emergencias) {
      content.push(secHdr('CONTACTOS DE EMERGENCIA'));
      const em = itinerario.emergencias;
      const emList = Array.isArray(em)
        ? em
        : (em.contactos || Object.entries(em)
            .filter(([k]) => !['nota','nota_general'].includes(k))
            .map(([k,v]) => ({ nombre: k, numero: typeof v === 'string' ? v : JSON.stringify(v) })));
      if (emList.length) {
        const emHdr = ['Servicio','Numero','Nota'].map(t => ({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL,
          border:[false,false,false,false], margin:[4,5,4,5]
        }));
        const emRows = emList.map((e, i) => [
          { text:ce(e.nombre||e.servicio||'--'), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(e.numero||e.telefono||'--'), fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:ce(e.nota||e.descripcion||''), fontSize:7, color:'#666', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        ]);
        content.push({
          table:{ headerRows:1, keepWithHeaderRows:1, widths:['*',100,'*'], body:[emHdr,...emRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8],
        });
      }
      const notaGral = typeof em === 'object' && !Array.isArray(em) ? (em.nota_general || em.nota) : null;
      if (notaGral) content.push({ text:ce(notaGral), fontSize:8, color:VIOLETA, italics:true, margin:[0,0,0,8] });
    }

    // ── MAS COSAS POR HACER ───────────────────────────────────────────────────
    if (itinerario.extras) {
      const ex = itinerario.extras;
      const exList = Array.isArray(ex)
        ? ex
        : (ex.actividades || ex.cosas_por_hacer || null);
      if (exList?.length) {
        content.push(secHdr('MAS COSAS POR HACER', FUCSIA));
        exList.forEach(item => {
          const label = typeof item === 'string' ? item : (item.nombre || item.actividad || JSON.stringify(item));
          const desc  = typeof item === 'object' ? (item.descripcion || item.nota || '') : '';
          content.push(bullet(label + (desc ? ` \u2014 ${desc}` : ''), CARBON, FUCSIA));
        });
        content.push({ text:'', margin:[0,0,0,6] });
      }
    }

    // ── PRO: secciones extra ──────────────────────────────────────────────────
    if (isPro) {

      // Bares y vida nocturna
      const bares = Array.isArray(itinerario.bares_vida_nocturna) ? itinerario.bares_vida_nocturna : [];
      if (bares.length) {
        content.push(secHdr('BARES Y VIDA NOCTURNA', FUCSIA));
        bares.forEach(b => {
          content.push({
            columns: [
              { text:'\u25CF', fontSize:7, color:FUCSIA, width:14, margin:[6,3,0,2] },
              { stack:[
                  { text:`${ce(b.nombre)||''}${b.tipo_ambiente?` \u2014 ${ce(b.tipo_ambiente)}`:''}`, fontSize:9, bold:true, color:CARBON, margin:[0,2,0,0] },
                  ...(b.tip ? [{ text:`TIP: ${ce(b.tip)}`, fontSize:8, color:VIOLETA, italics:true, margin:[0,1,0,2] }] : []),
                ],
                margin:[0,2,8,2]
              },
            ], columnGap: 0,
          });
        });
        content.push({ text:'', margin:[0,0,0,6] });
      }

      // Transporte local
      if (itinerario.transporte_local) {
        content.push(secHdr('TRANSPORTE LOCAL'));
        const tl = itinerario.transporte_local;
        if (tl.como_moverse)       content.push(bullet(`Como moverse: ${ce(tl.como_moverse)}`, CARBON, CORAL));
        if (tl.apps_recomendadas?.length) content.push(bullet(`Apps: ${tl.apps_recomendadas.join(', ')}`, CARBON, CORAL));
        if (tl.tarjeta_transporte) content.push(bullet(`Tarjeta: ${ce(tl.tarjeta_transporte)}`, CARBON, CORAL));
        if (tl.conviene_auto)      content.push(bullet(`Auto: ${ce(tl.conviene_auto)}`, CARBON, CORAL));
        content.push({ text:'', margin:[0,0,0,6] });
      }

      // Conectividad
      if (itinerario.conectividad) {
        content.push(secHdr('CONECTIVIDAD'));
        const co = itinerario.conectividad;
        if (co.esim_recomendada) content.push(bullet(`eSIM: ${ce(co.esim_recomendada)}${co.esim_precio?` \u2014 ${ce(co.esim_precio)}`:''}`, CARBON, CORAL));
        if (co.operador_local)   content.push(bullet(`Operador local: ${ce(co.operador_local)}`, CARBON, CORAL));
        if (co.cobertura)        content.push(bullet(`Cobertura: ${ce(co.cobertura)}`, CARBON, CORAL));
        content.push({ text:'', margin:[0,0,0,4] });
      }

      // Festivos y horarios
      if (itinerario.festivos_horarios) {
        const fh = itinerario.festivos_horarios;
        content.push(secHdr('FESTIVOS Y HORARIOS'));
        if (typeof fh === 'string') {
          content.push({ text:ce(fh), fontSize:8, color:CARBON, margin:[8,3,8,6] });
        } else {
          if (fh.festivos?.length) {
            content.push({ text:'Dias festivos relevantes:', fontSize:9, bold:true, color:CARBON, margin:[0,4,0,3] });
            (Array.isArray(fh.festivos) ? fh.festivos : [fh.festivos]).forEach(f =>
              content.push(bullet(typeof f === 'string' ? f : `${f.fecha||''} \u2014 ${f.nombre||''}`, CARBON, CORAL))
            );
          }
          if (fh.horarios_comercios)    content.push(bullet(`Comercios: ${ce(fh.horarios_comercios)}`, CARBON, CORAL));
          if (fh.horarios_restaurantes) content.push(bullet(`Restaurantes: ${ce(fh.horarios_restaurantes)}`, CARBON, CORAL));
          if (fh.horarios_museos)       content.push(bullet(`Museos: ${ce(fh.horarios_museos)}`, CARBON, CORAL));
          if (fh.nota) content.push({ text:ce(fh.nota), fontSize:8, color:VIOLETA, italics:true, margin:[8,3,8,3] });
        }
        content.push({ text:'', margin:[0,0,0,6] });
      }

      // Salud y seguridad
      if (itinerario.salud_seguridad) {
        const ss = itinerario.salud_seguridad;
        content.push(secHdr('SALUD Y SEGURIDAD'));
        if (typeof ss === 'string') {
          content.push({ text:ce(ss), fontSize:8, color:CARBON, margin:[8,3,8,6] });
        } else {
          if (ss.nivel_seguridad)    content.push(bullet(`Nivel de seguridad: ${ce(ss.nivel_seguridad)}`, CARBON, CORAL));
          if (ss.zonas_evitar)       content.push(bullet(`Zonas a evitar: ${ce(ss.zonas_evitar)}`, CARBON, FUCSIA));
          if (ss.emergencias_medicas) content.push(bullet(`Emergencias medicas: ${ce(ss.emergencias_medicas)}`, CARBON, CORAL));
          if (ss.vacunas)            content.push(bullet(`Vacunas recomendadas: ${ce(ss.vacunas)}`, CARBON, CORAL));
          if (ss.agua_potable !== undefined) content.push(bullet(`Agua potable: ${ce(String(ss.agua_potable))}`, CARBON, CORAL));
          if (ss.botiquin_recomendado) {
            const items = Array.isArray(ss.botiquin_recomendado)
              ? ss.botiquin_recomendado
              : [ss.botiquin_recomendado];
            if (items.length) {
              content.push({ text:'Botiquin recomendado:', fontSize:9, bold:true, color:CARBON, margin:[0,5,0,3] });
              items.forEach(item => content.push(bullet(ce(item), CARBON, CORAL)));
            }
          }
          if (ss.nota) content.push({ text:ce(ss.nota), fontSize:8, color:VIOLETA, italics:true, margin:[8,3,8,3] });
        }
        content.push({ text:'', margin:[0,0,0,6] });
      }

      // Idioma y cultura
      if (itinerario.idioma_cultura) {
        const ic = itinerario.idioma_cultura;
        content.push(secHdr('IDIOMA Y CULTURA'));
        if (typeof ic === 'string') {
          content.push({ text:ce(ic), fontSize:8, color:CARBON, margin:[8,3,8,6] });
        } else {
          if (ic.idioma_oficial) content.push(bullet(`Idioma: ${ce(ic.idioma_oficial)}`, CARBON, CORAL));
          if (ic.frases_utiles) {
            const frases = Array.isArray(ic.frases_utiles) ? ic.frases_utiles : [ic.frases_utiles];
            if (frases.length) {
              content.push({ text:'Frases utiles:', fontSize:9, bold:true, color:CARBON, margin:[0,5,0,3] });
              frases.forEach(f => {
                const txt = typeof f === 'string' ? f : `${f.frase||''} \u2014 ${f.traduccion||''}`;
                content.push(bullet(ce(txt), CARBON, VIOLETA));
              });
            }
          }
          if (ic.costumbres) {
            const costumbres = Array.isArray(ic.costumbres) ? ic.costumbres : [ic.costumbres];
            if (costumbres.length) {
              content.push({ text:'Costumbres y etiqueta:', fontSize:9, bold:true, color:CARBON, margin:[0,5,0,3] });
              costumbres.forEach(c => content.push(bullet(ce(c), CARBON, VIOLETA)));
            }
          }
          if (ic.vestimenta) content.push(bullet(`Vestimenta: ${ce(ic.vestimenta)}`, CARBON, VIOLETA));
          if (ic.nota) content.push({ text:ce(ic.nota), fontSize:8, color:VIOLETA, italics:true, margin:[8,3,8,3] });
        }
        content.push({ text:'', margin:[0,0,0,6] });
      }

      // Que empacar
      if (itinerario.que_empacar) {
        content.push(secHdr('QUE EMPACAR'));
        const qe = itinerario.que_empacar;
        if (qe.clima_esperado) {
          content.push({ text:`Clima esperado: ${ce(qe.clima_esperado)}`, fontSize:9, bold:true, color:CARBON, margin:[0,3,0,6] });
        }
        if (qe.esencial?.length) {
          content.push({ text:'Esencial:', fontSize:9, bold:true, color:CARBON, margin:[0,4,0,3] });
          qe.esencial.forEach(item => content.push(bullet(ce(item), CARBON, CORAL)));
          content.push({ text:'', margin:[0,0,0,3] });
        }
        if (qe.recomendado?.length) {
          content.push({ text:'Recomendado:', fontSize:9, bold:true, color:CARBON, margin:[0,4,0,3] });
          qe.recomendado.forEach(item => content.push(bullet(ce(item), CARBON, VIOLETA)));
          content.push({ text:'', margin:[0,0,0,3] });
        }
        if (qe.adaptador_enchufe) content.push(bullet(`Adaptador de enchufe: ${ce(qe.adaptador_enchufe)}`, CARBON, FUCSIA));
        content.push({ text:'', margin:[0,0,0,6] });
      }

    } // fin isPro

    // ── BACK COVER ────────────────────────────────────────────────────────────
    content.push({ text:'', pageBreak:'before' });
    content.push({ text:'', margin:[0,80,0,0] });
    content.push({ svg: makeLogoSvg(CORAL), width: 100, alignment: 'center', margin: [0, 0, 0, 6] });
    content.push({ text:'VIVANTE', fontSize:26, bold:true, color:CORAL, alignment:'center', characterSpacing:5, margin:[0,0,0,4] });
    content.push({ text:'VIAJA MAS. PLANIFICA MENOS', fontSize:8, color:'#aaa', alignment:'center', characterSpacing:2, margin:[0,0,0,14] });
    content.push({ canvas:[{ type:'line', x1:80, y1:0, x2:443, y2:0, lineWidth:1, lineColor:CORAL }], margin:[0,0,0,14] });
    content.push({
      text:`Que tengas el viaje de tu vida${formData.nombre ? ', ' + formData.nombre : ''}!`,
      fontSize:12, italics:true, color:'#555', alignment:'center', margin:[0,0,0,18]
    });
    content.push({ text:'vivevivante.com  \u00B7  @vive.vivante', fontSize:10, color:'#aaa', alignment:'center' });

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
                { text: planLabelClean, bold: true, fontSize: 8, color: CORAL, alignment: 'right', margin: [0, 13, 36, 0] },
              ]
            },
            { canvas: [{ type: 'line', x1: 36, y1: 0, x2: 559, y2: 0, lineWidth: 0.6, lineColor: CORAL }] }
          ]
        };
      },
      footer: (currentPage, pageCount) => {
        if (currentPage === 1) return null;
        return {
          text: `${currentPage} / ${pageCount}  \u00B7  vivevivante.com`,
          fontSize: 7, color: '#ccc', alignment: 'center', margin: [0, 0, 0, 10]
        };
      },
      background: (currentPage) => {
        if (currentPage === 1) {
          return { canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: '#FF6332' }] };
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

// ── POST /api/generate-pdf ────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { formData, itinerario, planId } = await req.json();
    if (!formData || !itinerario) {
      return NextResponse.json({ error: 'Faltan datos (formData o itinerario)' }, { status: 400 });
    }

    const isPro     = planId === 'pro';
    // Sin emojis: pdfmake no puede renderizarlos y aparecen como recuadros vacios
    const planLabel = isPro ? 'Vivante Pro' : 'Vivante Basico';

    const pdfBase64 = await generateItinerarioPdf(itinerario, formData, planLabel);
    if (!pdfBase64) {
      return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 });
    }

    const destName = ((itinerario?.resumen?.destino || formData?.destino || 'viaje')
      .split(',')[0]).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return NextResponse.json({
      pdf: pdfBase64,
      filename: `itinerario-vivante-${destName}.pdf`,
    });
  } catch (err) {
    console.error('[generate-pdf] Error:', err.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
