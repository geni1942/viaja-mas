import { NextResponse } from 'next/server';
import { buildAirlineUrl, buildAlojamientoUrl } from '@/lib/url-builders';
import { ce } from '@/lib/text-utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// pdfmake clickable button cell — visible size
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
          pdfBtn('Ver >', buildAlojamientoUrl(op, zona.destino, res.fecha_salida, res.fecha_regreso, formData?.numViajeros, formData?.alojamiento), VIOLETA),
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

// ── POST /api/generate-pdf ────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { formData, itinerario, planId } = await req.json();
    if (!formData || !itinerario) {
      return NextResponse.json({ error: 'Faltan datos (formData o itinerario)' }, { status: 400 });
    }

    const isPro     = planId === 'pro';
    const planLabel = isPro ? 'Vivante Pro \u2728' : 'Vivante B\u00e1sico';

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
