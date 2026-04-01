import { NextResponse } from 'next/server';

import { buildConfirmationEmail } from '@/lib/email-templates';
import { buildAirlineUrl, buildAlojamientoUrl } from '@/lib/url-builders';
import { ce } from '@/lib/text-utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ── LLM abstraction: Anthropic (local) / Groq (prod) ────────────────────────
async function callLLM(messages, { maxTokens = 8000, temperature = 0.7 } = {}) {
  const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
  if (useAnthropic) {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        ...(systemMsg && { system: systemMsg }),
        messages: userMsgs,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
  // Groq (produccion)
  const groqApiKey = process.env.GROQ_API_KEY;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices[0]?.message?.content || '';
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
    if (!groqApiKey && !process.env.ANTHROPIC_API_KEY) {
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

    const budgetWarning = presupuesto < umbralMin ? `
?? ALERTA DE PRESUPUESTO: El cliente tiene $${presupuesto} USD/persona pero el viaje a ${formData.destino || 'este destino'} t�picamente cuesta $${umbralMin}+ USD/persona.
DEBES:
1. Mencionarlo con empat�a en el campo "resumen.ritmo" o a�adir una nota en "resumen.distribucion": "?? Tu presupuesto es ajustado para este destino � considera fechas flexibles y hostels."
2. Adaptar TODAS las recomendaciones al presupuesto real: hostels/Airbnb econ�mico, comida callejera, actividades gratuitas.
3. En presupuesto_desglose.total NO superar $${presupuesto * 1.1} USD.
4. Si el presupuesto solo alcanza para el pasaje (menos de $${Math.round(umbralMin * 0.4)} USD), indicarlo claramente y sugerir destinos alternativos m�s econ�micos.` : '';

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
    const ocasionDescMap = {
      'luna-de-miel':  'LUNA DE MIEL ?? � es el viaje m�s importante de su vida juntos. Cada detalle importa: actividades privadas e �ntimas, cenas con vista excepcional, suite o habitaci�n superior (avisa al hotel para posibles upgrades y detalles de bienvenida), momentos sorpresa planificados. Tono del texto: po�tico, �ntimo, emocionante.',
      'aniversario':   'ANIVERSARIO ?? � celebraci�n rom�ntica de pareja. Al menos una cena o experiencia especialmente memorable. Mix de actividades �ntimas con algo �nico para festejar la fecha. Tono: c�lido y celebratorio.',
      'cumpleanos':    'CUMPLEA�OS ?? � viaje de celebraci�n. Incluye al menos una experiencia o cena especial para el festejo. Tono festivo y energ�tico.',
      'despedida':     'DESPEDIDA DE SOLTERO/A ?? � grupo en modo celebraci�n. Prioriza actividades grupales con adrenalina y diversi�n, al menos 2 noches de vida nocturna destacadas, restaurantes con mesas grandes y ambiente animado. Tono: en�rgico, divertido, con humor.',
      'graduacion':    'GRADUACI�N ?? � celebraci�n de logro importante. Al menos una experiencia premium memorable. Tono orgulloso y celebratorio.',
    };
    const ocasionCtx = formData.ocasionEspecial && ocasionDescMap[formData.ocasionEspecial]
      ? `\n- OCASI�N ESPECIAL: ${ocasionDescMap[formData.ocasionEspecial]}`
      : '';

    // -- Restricci�n alimentaria -----------------------------------------------
    const restriccionDescMap = {
      'vegetariano': 'VEGETARIANO � TODOS los restaurantes recomendados DEBEN tener opciones vegetarianas claras. Menciona los platos vegetarianos espec�ficos. Evita restaurantes cuya especialidad sea exclusivamente carne o mariscos.',
      'vegano':      'VEGANO � TODOS los restaurantes DEBEN tener opciones veganas verificadas. Prioriza locales con men� plant-based dedicado. Menciona platos veganos espec�ficos disponibles.',
      'sin-gluten':  'SIN GLUTEN � TODOS los restaurantes deben tener opciones sin gluten claramente identificadas. Agrega en tips_culturales c�mo comunicar la restricci�n en el idioma local.',
      'halal':       'HALAL � prioriza restaurantes con certificaci�n halal o sin alcohol/cerdo. Incluye en tips_culturales c�mo identificar opciones halal en el destino.',
      'pescetariano': 'PESCETARIANO � come pescado y mariscos pero NO carne roja ni pollo. TODOS los restaurantes DEBEN tener opciones con pescado/mariscos o vegetarianas. Especifica qu� platos con mariscos o pescado est�n disponibles.',
    };
    const restriccionCtx = formData.restriccionDietaria && formData.restriccionDietaria !== 'sin-restriccion' && restriccionDescMap[formData.restriccionDietaria]
      ? `\n- RESTRICCI�N ALIMENTARIA: ${restriccionDescMap[formData.restriccionDietaria]}`
      : '';

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
      latam:     'LATAM (LATAM Pass)',
      avianca:   'Avianca (LifeMiles)',
      copa:      'Copa Airlines (ConnectMiles)',
      american:  'American Airlines (AAdvantage)',
      iberia:    'Iberia / Air Europa (Iberia Plus)',
    };
    const aerolineaCtx = formData.aerolineaPreferida && aerolineaDescMap[formData.aerolineaPreferida]
      ? `\n- AEROL�NEA PREFERIDA/MILLAS: ${aerolineaDescMap[formData.aerolineaPreferida]} � si opera la ruta y tiene precio competitivo (m�x 20% m�s caro que la opci�n m�s barata), ponla como PRIMERA opci�n en el array de vuelos.`
      : '';

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

    const primeraVisitaCtx = esRegular
      ? `
- PERFIL LOCAL — CONOCE ESTE DESTINO MUY BIEN (visita regular/5+ veces): Esta es la regla más prioritaria del itinerario y PREVALECE sobre cualquier otra.
  ABSOLUTAMENTE PROHIBIDO mencionar cualquier atracción turística, aunque sea "de forma diferente": nada de Colosseum, Eiffel, Sagrada Família, Big Ben ni equivalentes en cualquier destino.
  OBLIGATORIO: (1) Actividades que solo hacen los residentes: mercados de barrio sin turistas, asociaciones culturales locales, eventos de temporada que no aparecen en TripAdvisor, rutas de running o ciclismo locales, parques donde va la gente del barrio. (2) Restaurantes sin presencia masiva en Google Maps, donde el menú está solo en el idioma local y los precios son para locales — no para turistas. (3) Horarios y lugares que solo conocen quienes viven ahí: el bar que abre solo los jueves, el mercado que es el primer domingo del mes, la playa sin nombre que los locales guardan. (4) Barrios o suburbs que los turistas jamás visitan pero que tienen vida real y carácter. Tono: de par a par, como si le hablaras a alguien que conoce bien el destino y quiere redescubrirlo desde dentro.`
      : esVeterano
      ? `
- PERFIL EXPLORADOR EXPERTO — HA IDO VARIAS VECES (3-5 visitas): Esta regla prevalece sobre cualquier otra.
  PROHIBIDOS como actividades principales los top-10 turísticos masivos del destino. Solo como contexto ocasional si es inevitable.
  OBLIGATORIO: (1) Barrios locales auténticos que los turistas no descubren — con nombres reales y específicos. (2) Restaurantes donde comen los locales: sin menú en inglés, sin fotos en el menú. (3) Mercados populares, talleres de artesanos, galerías underground, proyectos culturales independientes. (4) Experiencias de nicho que requieren conocimiento previo: rutas ciclistas locales, clubes de jazz pequeños, mercados de pulgas, bares sin señalética exterior. (5) Horarios anti-turista: entrar a un sitio a las 7am antes de las hordas. Tono: viajero experimentado hablándole a otro igual — sin explicaciones básicas.`
      : esReincidente
      ? `
- PERFIL VIAJERO REINCIDENTE — HA IDO 1-2 VECES: Máximo 20% íconos clásicos vividos de forma no turística (acceso especial, horario temprano, perspectiva local) + 80% experiencias auténticas. Evita tours masivos y restaurantes en zonas 100% turísticas. Incluye al menos 1 barrio fuera del circuito habitual y al menos 2 experiencias que el viajero no habría hecho en su primera visita. Tono: compañero de viaje con experiencia, no guía turístico.`
      : `
- PERFIL EXPLORADOR CURIOSO — PRIMERA VEZ: Incluye los imperdibles clásicos — son clásicos por razones válidas y este viajero no los conoce. Equilibra íconos turísticos con al menos 1-2 experiencias auténticas locales por ciudad. Explica el contexto cultural básico de cada lugar. Tips prácticos imprescindibles: cómo llegar del aeropuerto, propinas locales, costumbres que sorprenden, apps útiles. Tono: guía amigable, orientador y empático con quien viaja por primera vez.`;


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
      ? '\n- MOVILIDAD REDUCIDA: alguien en el grupo tiene movilidad reducida. TODAS las actividades deben ser accesibles (sin escaleras largas, terrenos irregulares ni distancias a pie extensas). Menciona accesibilidad en cada actividad. Prioriza transporte con opciones accesibles y alojamiento con habitaciones adaptadas.'
      : '';


    // -- Eficiencia de distancia seg�n d�as de viaje ---------------------------
    const _origenNorm = (formData.origen || 'Santiago, Chile').toLowerCase();
    const _esSudAmerica = ['chile','argentina','per�','peru','colombia','brasil','brazil','bolivia','ecuador','uruguay','venezuela','paraguay'].some(p => _origenNorm.includes(p));
    const _maxVuelo = dias <= 4 ? 6 : dias <= 7 ? 10 : dias <= 11 ? 14 : 99;
    const distanciaCtx = (_esSudAmerica && _maxVuelo < 99)
      ? `\n- EFICIENCIA DE VUELO: El viaje es de ${dias} días desde ${formData.origen || 'Chile'} (vuelo máximo razonable: ${_maxVuelo}h por tramo).${
          dias <= 4
            ? ' PROHIBIDO recomendar Europa, Asia, Oceanía — con 4 días o menos solo son viables Sudamérica, Caribe cercano y México.'
            : dias <= 7
            ? ` Con 7 días, un vuelo de 12-13h (ej: Chile→Europa) deja solo ~4 días reales en destino. PROHIBIDO Japón (14h+), Sudeste Asiático (16h+) y Oceanía (16h+) si el usuario no los eligió explícitamente. Si el destino elegido supera 10h de vuelo, OBLIGATORIO incluir en resumen.distribucion: "⚠️ Con ${dias} días y ~Xh de vuelo contarás con Y días reales en destino — optimizamos el itinerario para aprovecharlos al máximo."`
            : ' Con 11 días, Oceanía y Asia muy lejana (16h+) son el límite máximo. OBLIGATORIO incluir en resumen.distribucion el tiempo real disponible si el vuelo supera 14h.'
        }`
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
    const presupuestoDiaRule = `\n- PRESUPUESTO DIARIO: $${presupuestoDia} USD/persona/d\u00eda (= $${presupuesto} total / ${dias} d\u00edas). Adapta la calidad de CADA recomendaci\u00f3n a esta realidad:${
      presupuestoDia < 80
        ? ' Menos de $80/d\u00eda \u2192 alojamiento hostal o Airbnb econ\u00f3mico, comidas en mercados y callejero, tours gratuitos o grupales b\u00e1sicos, sin actividades premium.'
        : presupuestoDia < 150
        ? ' $80-150/d\u00eda \u2192 hotel 3\u2605 o Airbnb confort, mezcla callejero + restaurantes mid-range, tours grupales con alguna experiencia especial.'
        : presupuestoDia < 250
        ? ' $150-250/d\u00eda \u2192 hotel 4\u2605, cenas en restaurantes de calidad, tours privados opcionales, al menos 1 experiencia premium por viaje.'
        : ' $250+/d\u00eda \u2192 hotel 4-5\u2605 o boutique, cenas selectas, experiencias premium y privadas como primera opci\u00f3n.'}
    Aplica esta l\u00f3gica en alojamiento, restaurantes y actividades. Un presupuesto de $${presupuestoDia}/d\u00eda NO permite cenar en restaurante de $80/persona cada noche.`;

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
    const geoRule = `- OPTIMIZACI�N GEOGR�FICA DE RUTA: (1) Para viajes MULTI-DESTINO: ordena las ciudades/pa�ses de forma geogr�ficamente l�gica para minimizar distancias y tiempos de traslado. Nunca plantees rutas que obliguen a retroceder innecesariamente (ej: si visitas Madrid, Barcelona y Lisboa, no vayas Madrid?Lisboa?Barcelona). (2) Para el d�a a d�a de CADA CIUDAD: agrupa las actividades por zona geogr�fica. Ma�ana: zona norte o centro. Tarde: zona sur o cercana. Nunca propongas en el mismo d�a visitar atracciones en extremos opuestos de la ciudad sin l�gica de desplazamiento. Siempre incluye en "ruta_optimizada" el orden sugerido para minimizar traslados. (3) Para vuelos: prioriza conexiones l�gicas (no escalas en direcci�n contraria al destino).`;

    // -- Regla D�AS: siempre generar los N d�as completos ---------------------
    const diasRule = `- D�AS COMPLETOS: El array "dias" del JSON DEBE contener EXACTAMENTE ${dias} objetos (uno por cada d�a del viaje). NUNCA generes menos d�as aunque el presupuesto sea ajustado. Si el presupuesto es bajo, adapta con actividades gratuitas (parques, iglesias, miradores, mercados), comida callejera y alojamiento econ�mico � pero SIEMPRE genera los ${dias} d�as completos. Un presupuesto ajustado NO es excusa para recortar el itinerario.`;

    // -- Regla viaje dom�stico ------------------------------------------------
    const domesticRule = isDomestic
      ? `- VIAJE DOM�STICO: Origen (${formData.origen}) y destino (${formData.destino}) est�n en el MISMO PA�S. Reglas ESTRICTAS: (1) "checklist": EST� ABSOLUTAMENTE PROHIBIDO incluir la palabra "pasaporte" en cualquier �tem del checklist. El viajero solo necesita su c�dula de identidad / DNI nacional. NO incluyas visa de turismo, adaptador de enchufe extranjero ni seguro de viaje internacional. Nunca menciones pasaporte en el checklist de un viaje dom�stico. (2) "dinero.tipo_cambio": pon "No aplica � misma moneda"; "dinero.donde_cambiar": pon "No aplica � no se necesita cambiar divisas". (3) "seguro": solo asistencia m�dica nacional, sin menci�n a cobertura internacional. (4) "que_empacar.adaptador_enchufe": pon "No necesario � mismo pa�s, mismo voltaje y tipo de enchufes". (5) "emergencias.embajada": pon "No aplica � viaje dom�stico". (6) tips_culturales: NO menciones tipo de cambio, casas de cambio, conversi�n de divisas, adaptador de corriente ni seguro de viaje internacional.`
      : '';

    // Plataformas seg�n preferencia del cliente
    // hotel ? Eco=Airbnb, Mid=Booking.com, Prem=Booking.com
    // airbnb ? todo Airbnb | hostal ? todo Hostelworld | bnb ? todo Booking.com
    const alojPref   = formData.alojamiento || 'hotel';
    const interesStr = interesesConPeso; // ya calculado con pesos/prioridad
    const tipoViaje  = (formData.tipoViaje || 'pareja').toLowerCase();
    const ocasion = (formData.ocasionEspecial || '').toLowerCase();
    const tipoViajeRule = tipoViaje === 'familia'
      ? (() => {
          const numNinos = formData.numNinos || 0;
          const ninosCtxStr = numNinos > 0
            ? `Hay ${numNinos} ni�o${numNinos > 1 ? 's' : ''} en el grupo � actividades aptas para su edad, restaurantes con men� infantil, ritmo con descansos obligatorios.`
            : 'Grupo familiar adulto � actividades tranquilas aptas para todas las edades.';
          const movilStr = formData.movilidadReducida ? ' Verifica accesibilidad en cada actividad (sin escaleras largas, terrenos llanos).' : '';
          return `- TIPO DE VIAJE: FAMILIA. ${ninosCtxStr}${movilStr} Reglas: (1) Actividades aptas para ni�os (zool�gicos, playas seguras, museos interactivos, parques naturales). (2) Restaurantes con men� infantil y mesas amplias. (3) Alojamiento con habitaciones familiares o conectadas. (4) Evita actividades de riesgo o exclusivas para adultos. Tono: c�lido, considerado con todas las edades.`;
        })()
      : tipoViaje === 'pareja'
        ? ocasion === 'luna-de-miel'
          ? `- TIPO DE VIAJE: LUNA DE MIEL ??. Es el viaje m�s importante de su vida. TODO debe ser �ntimo, privado y memorable: (1) Actividades privadas para dos (tours privados, spa de pareja, clases de cocina juntos). (2) Cenas con vista excepcional y ambiente rom�ntico � no restaurantes bulliciosos. (3) Alojamiento: suite o habitaci�n superior � menciona expl�citamente que avisen al hotel para posibles upgrades y detalles de bienvenida. (4) Planifica al menos un momento sorpresa o especial por d�a. Tono del texto: po�tico, �ntimo, emocionante � cada descripci�n debe sentirse �nica.`
          : ocasion === 'aniversario'
          ? `- TIPO DE VIAJE: ANIVERSARIO ??. Celebraci�n rom�ntica: (1) Al menos una cena o experiencia excepcionalmente memorable. (2) Mix de actividades �ntimas con algo �nico para la fecha. (3) Alojamiento con habitaci�n doble especial o suite. Tono: c�lido, evocador y celebratorio.`
          : `- TIPO DE VIAJE: PAREJA. Adapta TODO para viaje rom�ntico: (1) Experiencias �ntimas (cenas con vista, paseos al atardecer, spas, tours privados). (2) Restaurantes con ambiente rom�ntico (no bulliciosos). (3) Alojamiento con habitaci�n doble especial o suite. (4) Actividades en pareja (clases de cocina para dos, paseos en bote, miradores). Tono: c�lido, evocador y rom�ntico.`
        : tipoViaje === 'solo'
          ? `- TIPO DE VIAJE: VIAJERO SOLO. Adapta TODO para viaje individual: (1) Tours grupales (ideales para conocer gente). (2) Caf�s con ambiente tranquilo. (3) Experiencias sociales y hostales con zonas comunes. (4) �nfasis en seguridad: zonas seguras, apps de transporte, contactos de emergencia. (5) Consejos sobre c�mo moverse solo. Tono: empoderador y pr�ctico.`
          : tipoViaje === 'amigos'
            ? ocasion === 'despedida'
              ? `- TIPO DE VIAJE: DESPEDIDA DE SOLTERO/A ??. Grupo en modo celebraci�n: (1) Actividades grupales con adrenalina y diversi�n (aventura, deportes, experiencias �nicas). (2) Al menos 2 noches de vida nocturna destacadas. (3) Restaurantes con mesas grandes y ambiente festivo. (4) Alguna actividad memorable para el/la protagonista. (5) Alojamiento tipo Airbnb casa completa. Tono: en�rgico, divertido, con humor.`
              : ocasion === 'cumpleanos'
              ? `- TIPO DE VIAJE: CUMPLEA�OS EN GRUPO ??. Al menos una actividad o cena especial para el festejo. Sugerencias para hacer el d�a memorable. Restaurantes con ambiente festivo. Tono: jovial y celebratorio.`
              : `- TIPO DE VIAJE: GRUPO DE AMIGOS. Adapta TODO para grupo: (1) Actividades grupales (aventura, tours, vida nocturna). (2) Restaurantes con mesas grandes y ambiente animado. (3) Alojamiento tipo Airbnb casa completa o habitaciones m�ltiples. (4) Actividades de adrenalina y diversi�n colectiva. Tono: energ�tico, jovial y con humor.`
            : tipoViaje.includes('empresa') || tipoViaje.includes('corporat') || tipoViaje.includes('negocio')
              ? `- TIPO DE VIAJE: GRUPO EMPRESARIAL. (1) Hoteles de negocios con sala de reuniones y WiFi r�pido. (2) Restaurantes apropiados para cenas de trabajo. (3) Opciones de team building. (4) Transporte eficiente y servicio ejecutivo. Tono: profesional pero cercano.`
              : `- TIPO DE VIAJE: ${tipoViaje}. Adapta el itinerario para este perfil de viajero.`;

    // -- Reglas de personalizaci�n adicionales (nuevos campos del form) --------
    const reglasPersonalizacion = [
      // Intereses con pesos
      `- INTERESES CON PRIORIDAD: ${interesesConPeso}. El primer inter�s es el PRINCIPAL � el 60% de las actividades del d�a a d�a deben girar en torno a �l. El segundo es secundario (25%). El tercero es complementario (10%). El cuarto es ocasional cuando encaje. Mapeo obligatorio ? gastronomia: mercados, clases de cocina, tours gastron�micos, degustaciones; aventura: senderismo, deportes extremos, kayak, rafting, zipline; playa: playas, snorkeling, surf, buceo; cultura: museos, sitios hist�ricos, arte local, barrios hist�ricos; naturaleza: parques nacionales, cascadas, reservas naturales; nocturna: bares de moda, rooftops, tours nocturnos, clubes. Las actividades NO pueden contradecir los intereses elegidos.`,
      // Restricci�n dietaria
      restriccionCtx ? `- ALIMENTACI�N: ${restriccionDescMap[formData.restriccionDietaria]}` : '',
      // Horario preferido
      horarioCtx,
      // Aerol�nea preferida
      aerolineaCtx ? `- AEROL�NEA PREFERIDA: ${aerolineaDescMap[formData.aerolineaPreferida]} � si opera la ruta a precio competitivo (m�x 20% m�s cara que la opci�n m�s econ�mica), ponla como PRIMERA opci�n en el array de vuelos.` : '',
      // Prioridad de gasto
      prioridadCtx ? `- PRIORIDAD DE GASTO: ${prioridadDescMap[formData.prioridadGasto]}` : '',
      // Primera visita
      primeraVisitaCtx ? primeraVisitaCtx.replace('\n- ', '- ') : '',
      // Nombre del viajero � usado 1 vez por d�a en un momento clave
      formData.nombre ? `- PERSONALIZACI�N NOMBRE: El viajero se llama ${formData.nombre}. Usa su nombre de forma natural exactamente 1 vez por d�a dentro de la descripci�n de una actividad en el campo "descripcion", en un momento emotivo o clave del itinerario. No lo uses en cada p�rrafo ni de forma repetitiva. Debe sonar humano y c�lido. Ejemplos v�lidos: "Esta tarde, ${formData.nombre}, es el momento perfecto para perderte en el barrio hist�rico..." o "Esta noche es especial, ${formData.nombre} � reserva mesa con vista al mar en..."` : '',
      // Presupuesto por día
      presupuestoDiaRule,
      // Temporada y clima
      formData.mesViaje
        ? `- TEMPORADA Y CLIMA: El viajero va en ${formData.mesViaje.replace('-', ' ')}. OBLIGATORIO adaptar las actividades del día a día al clima real de ese mes en ${formData.destino || 'el destino'}: (1) Calor extremo → actividades de exterior en mañana temprana o al atardecer, mediodía en espacios cubiertos o acuosos. (2) Lluvia frecuente → incluir alternativas cubiertas para cada día, no solo plan_b. (3) Temporada alta → mencionar en cada atracción si necesita reserva anticipada y con cuánta antelación. (4) Festividades o eventos relevantes en esas fechas → priorizarlos como actividades. (5) Actividades estacionales → incluirlas si aplica (playa en verano, esqui en invierno, vendimia en otoño, cerezos en abril en Japón, etc.).`
        : '',
      // Distribución de ciudades según intereses (multi-destino)
      interesesArray.length > 0
        ? `- DISTRIBUCIÓN DE CIUDADES: En viajes multi-destino, selecciona ciudades que MAXIMICEN el interés principal (${interesesArray[0]}). Ejemplos: interés 'playa' → prioriza ciudades costeras sobre capitales interiores; 'cultura' → ciudades con patrimonio y museos; 'gastronomía' → ciudades con identidad culinaria reconocida; 'aventura' → destinos con naturaleza y deportes; 'naturaleza' → parques nacionales y reservas sobre ciudades. No distribuyas días equitativamente si una ciudad encaja mucho mejor con los intereses.`
        : '',
      // Restricción dietaria fuerte en restaurantes Y en selección de zona
      formData.restriccionDietaria && formData.restriccionDietaria !== 'sin-restriccion'
        ? `- RESTRICCIÓN DIETARIA ESTRICTA (${formData.restriccionDietaria.toUpperCase()}): NO es solo un filtro de restaurantes — afecta también la selección de barrios y mercados. Prioriza zonas con oferta diversa. Para veganos: barrios con cultura plant-based; para halal: zonas con comunidad musulmana o restaurantes certificados; para sin-gluten: menciona en tips_culturales cómo comunicarlo en el idioma local. TODOS los restaurantes recomendados deben tener opciones claras para esta restricción — sin excepciones.`
        : '',
      // Experiencia del viajero cruzada con conocimiento del destino
      experienciaViajeroCtx ? experienciaViajeroCtx.replace(/^\n/, '') : '',
      // Cruces de señales: reglas que emergen de combinar múltiples preferencias
      crucesSenales || '',
      // Titulo y subtitulo: personalizados con nombre + destino + ocasión
      `- TÍTULO Y SUBTÍTULO: El "titulo" debe ser creativo, incluir el destino y reflejar la esencia del viaje (ej: "Tokio desde adentro: 8 días sin guías turísticas" o "Roma para dos: historia, vino y amor"). Si hay ocasión especial, incorpórala poéticamente. El "subtitulo" debe usar el nombre del viajero (${formData.nombre}) y sonar como si se lo dijera un amigo de confianza — cálido, directo, emocionante. Ejemplos válidos: "${formData.nombre}, esto es exactamente lo que necesitabas." o "Hecho a medida para ti, ${formData.nombre}: cada día un descubrimiento nuevo." Nunca uses frases genéricas como "¡Bienvenido a tu aventura!".`,
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
    "destino": "string (ciudad/zona)",
    "noches": numero,
    "opciones": [
      {
        "plataforma": "${platEco}",
        "zona": "string (barrio o area especifica donde buscar, ej: 'Eixample', 'Palermo Soho', 'Mitte')",
        "nombre": "string (descriptor zona+tipo, ej: 'Hotel 2-3 estrellas en el Eixample', 'Hostal social en El Raval rating 8+', 'Habitacion privada en Palermo Soho')",
        "categoria": "Economico",
        "precio_noche": "string en USD",
        "puntuacion": "string (ej: 8.7/10)",
        "cancelacion": "Gratuita",
        "highlights": ["string feature 1", "string feature 2"],
        "por_que": "string en voz VIVANTE calida y directa",
        "link": "URL de busqueda: ${linkEco}"
      },
      {
        "plataforma": "${platMid}",
        "zona": "string (barrio o area especifica)",
        "nombre": "string (descriptor zona+tipo, ej: 'Hotel boutique 3-4 estrellas en el centro historico', 'Hostal premium en Gracia rating 8.5+', 'Apartamento entero en Palermo Soho')",
        "categoria": "Confort",
        "precio_noche": "string",
        "puntuacion": "string",
        "cancelacion": "Gratuita",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL de busqueda: ${linkMid}"
      },
      {
        "plataforma": "${platPrem}",
        "zona": "string (barrio o area especifica)",
        "nombre": "string (descriptor zona+tipo, ej: 'Hotel boutique 4-5 estrellas en el Eixample', 'Hostal top-rated en Mitte rating 9+', 'Apartamento entero premium en Recoleta')",
        "categoria": "Premium",
        "precio_noche": "string",
        "puntuacion": "string (ej: 4.9/5)",
        "cancelacion": "string",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL de busqueda: ${linkPrem}"
      }
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

    // --- PROMPT B�SICO ---------------------------------------------------------
    const promptBasico = `Eres el planificador de VIVANTE. Crea un itinerario COMPLETO con el tono VIVANTE: cercano, directo, como un amigo experto. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas a�reas. Incluye m�nimo 3 aerol�neas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta espec�fica. Si NO hay vuelo directo, nunca lo inventes � pon la mejor conexi�n con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL ? BOG ? NRT"). Si existe un vuelo directo en la ruta Y el presupuesto total ($${presupuesto} USD por persona) lo permite, incluye SIEMPRE al menos 1 opci�n de vuelo directo en el array, aunque cueste m�s que las opciones con escala.${isDomestic ? ' Si el viaje es DOM�STICO, los vuelos son dentro del mismo pa�s � precios en moneda local y sin escalas internacionales.' : ''}
${alojRule}
- RESTAURANTES: Si el viaje se concentra en UNA SOLA ciudad y dura m�s de 7 d�as, incluye 5 restaurantes para esa ciudad. Para viajes multi-ciudad o de 7 d�as o menos, incluye exactamente 3 restaurantes por ciudad visitada.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta vuelos, alojamiento y actividades a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa el campo resumen.ritmo para incluir una nota como "?? Presupuesto ajustado � hemos optimizado el itinerario para sacar el m�ximo con tu presupuesto."
- PRECIOS "por persona": Cada vez que menciones un precio (vuelos, hotel, actividades, restaurantes, presupuesto desglosado, gasto_dia, costo) agrega siempre "/ persona" al final del valor. Ejemplo: "$120 / persona". Aplica a TODOS los campos de precio del JSON sin excepcion.
${diasRule}
- RITMO: Ritmo efectivo ${ritmoEfectivo}/5. DEBES respetar ESTRICTAMENTE el n� ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el n�mero de actividades por d�a: ritmo 1-2 = m�ximo 2 actividades por d�a (d�as relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por d�a con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por d�a, d�as aprovechados al m�ximo. El ritmo tambi�n afecta el tono: ritmo bajo = m�s descripci�n contemplativa, ritmo alto = m�s din�mico y energ�tico.
${reglasPersonalizacion}
${tipoViajeRule}
- AEROL�NEAS: SOLO recomienda aerol�neas de esta lista verificada: LATAM, JetSmart, Sky Airline, Avianca, Copa Airlines, Aerol�neas Argentinas, Aerom�xico, GOL, Azul, American Airlines, United Airlines, Delta, Air Canada, WestJet, Iberia, Iberia Express, Air Europa, Turkish Airlines, Air France, KLM, Lufthansa, Swiss, Austrian Airlines, British Airways, TAP Portugal, Norwegian, EasyJet, Ryanair, Finnair, ITA Airways, Qatar Airways, Emirates, Ethiopian Airlines, Japan Airlines, ANA, Singapore Airlines, Cathay Pacific, Korean Air, Asiana, Thai Airways, Malaysia Airlines, Air New Zealand, EVA Air, China Airlines. NO recomiendes aerol�neas que no est�n en esta lista.
${geoRule}${domesticRule ? '\n' + domesticRule : ''}${checklistRule ? '\n' + checklistRule : ''}

GENERA JSON puro (sin markdown, sin \`\`\`):
{
  "titulo": "string creativo",
  "subtitulo": "string tagline motivador",
  "resumen": {
    "destino": "string",
    "origen": "string",
    "dias": n�mero,
    "viajeros": n�mero,
    "tipo": "string",
    "presupuesto_total": "string USD",
    "ritmo": "string",
    "fecha_salida": "YYYY-MM-DD",
    "fecha_regreso": "YYYY-MM-DD",
    "origen_iata": "string (3 letras, ej: SCL)",
    "destino_iata": "string (3 letras, ej: NRT)",
    "fecha_optima_texto": "string (ej: Salida 15 de mayo, regreso 25 de mayo 2026)",
    "distribucion": "string con distribuci�n de d�as por zona"
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
      "ruta": "string (ej: SCL \u2192 NRT directo, o SCL \u2192 LIM \u2192 NRT v\u00eda Lima)",
      "precio_estimado": "string",
      "duracion": "string (ej: 14h directo, 22h con 1 escala)",
      "escala": "string (Directo / 1 escala en CIUDAD / 2 escalas)",
      "tip": "string insider"
    }
  ],
  ${alojamientoSchema},
  "dias": [
    {
      "numero": n�mero,
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
      "ruta_optimizada": "string con orden l�gico de las zonas del d�a para minimizar desplazamientos",
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
    "embajada": "string (direcci�n y tel�fono de la embajada chilena en el destino)",
    "emergencias_local": "string (n�mero de emergencias del pa�s)",
    "policia_turistica": "string o null"
  },
  "lo_imperdible": [
    {
      "nombre": "string",
      "descripcion": "string inspirador en voz VIVANTE"
    }
  ]
}`;

    // --- PROMPT PRO ------------------------------------------------------------
    // -- Basic?Pro continuity: si existe itinerario b�sico, solo generar secciones Pro exclusivas --
    // ESTRATEGIA: en lugar de pedirle al AI que "recuerde" el contenido b�sico,
    // generamos SOLO las secciones Pro y las fusionamos con el b�sico en el servidor.
    // Esto garantiza que vuelos, alojamiento, d�as, restaurantes y experiencias sean 100% id�nticos.
    const basicCtx = basicItinerary ? `
CONTEXTO: El cliente ya tiene su plan B�sico. Tu tarea es generar �NICAMENTE las secciones EXCLUSIVAS del plan Pro.
Datos del itinerario b�sico existente (para contexto de coherencia):
- Destino: ${basicItinerary.resumen?.destino || formData.destino}
- Fecha salida: ${basicItinerary.resumen?.fecha_salida || ''} / Regreso: ${basicItinerary.resumen?.fecha_regreso || ''}
- Distribuci�n de d�as: ${basicItinerary.resumen?.distribucion || ''}
- Vuelos ya sugeridos: ${(basicItinerary.vuelos || []).map(v => v.aerolinea + ' (' + v.ruta + ')').join('; ')}

INSTRUCCI�N CR�TICA: El JSON que debes generar contiene �NICAMENTE las siguientes secciones Pro (NO repitas vuelos, alojamiento, dias, restaurantes, experiencias ni ninguna secci�n b�sica � esas ya las tiene el cliente y se fusionar�n autom�ticamente):
` : '';

    const promptPro = `Eres el planificador PRO de VIVANTE. Itinerario PREMIUM ultra-detallado, con el tono c�lido y experto VIVANTE. Precios realistas para ${currentYear}.
${basicCtx}
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas a�reas. Incluye m�nimo 3 aerol�neas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta espec�fica. Si NO hay vuelo directo, nunca lo inventes � pon la mejor conexi�n con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL ? BOG ? NRT"). Si existe un vuelo directo en la ruta Y el presupuesto total ($${presupuesto} USD por persona) lo permite, incluye SIEMPRE al menos 1 opci�n de vuelo directo en el array, aunque cueste m�s que las opciones con escala.${isDomestic ? ' Si el viaje es DOM�STICO, los vuelos son dentro del mismo pa�s � precios en moneda local y sin escalas internacionales.' : ''}
${alojRule}
- RESTAURANTES: Si el viaje se concentra en UNA SOLA ciudad y dura m�s de 7 d�as, incluye 5 restaurantes para esa ciudad. Para viajes multi-ciudad o de 7 d�as o menos, incluye exactamente 3 restaurantes por ciudad visitada.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta todas las recomendaciones (vuelos, alojamiento, actividades, restaurantes) a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa resumen.ritmo para incluir una nota como "?? Presupuesto ajustado � optimizamos el itinerario para sacar el m�ximo con tu presupuesto."
- PRECIOS "por persona": Cada vez que menciones un precio (vuelos, hotel, actividades, restaurantes, presupuesto desglosado, gasto_dia, costo) agrega siempre "/ persona" al final del valor. Ejemplo: "$120 / persona". Aplica a TODOS los campos de precio del JSON sin excepcion.
${diasRule}
- RITMO: Ritmo efectivo ${ritmoEfectivo}/5. DEBES respetar ESTRICTAMENTE el n� ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el n�mero de actividades por d�a: ritmo 1-2 = m�ximo 2 actividades por d�a (d�as relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por d�a con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por d�a, d�as aprovechados al m�ximo. El ritmo tambi�n afecta el tono: ritmo bajo = m�s descripci�n contemplativa, ritmo alto = m�s din�mico y energ�tico.
${reglasPersonalizacion}
${tipoViajeRule}
- AEROL�NEAS: SOLO recomienda aerol�neas de esta lista verificada: LATAM, JetSmart, Sky Airline, Avianca, Copa Airlines, Aerol�neas Argentinas, Aerom�xico, GOL, Azul, American Airlines, United Airlines, Delta, Air Canada, WestJet, Iberia, Iberia Express, Air Europa, Turkish Airlines, Air France, KLM, Lufthansa, Swiss, Austrian Airlines, British Airways, TAP Portugal, Norwegian, EasyJet, Ryanair, Finnair, ITA Airways, Qatar Airways, Emirates, Ethiopian Airlines, Japan Airlines, ANA, Singapore Airlines, Cathay Pacific, Korean Air, Asiana, Thai Airways, Malaysia Airlines, Air New Zealand, EVA Air, China Airlines. NO recomiendes aerol�neas fuera de esta lista.
${geoRule}
- TRANSPORTE aeropuerto?centro: lista TODAS las opciones disponibles (Uber, Taxi, Metro, Bus express, Tren, etc.) con costo estimado y duraci�n en el array opciones_aeropuerto_centro.
- BARES: en bares_vida_nocturna usa un objeto cuyas claves son los nombres REALES de las ciudades visitadas. Si el viaje es de UNA SOLA ciudad y m�s de 7 d�as, incluye 5 bares/lugares para esa ciudad. Para el resto, incluye EXACTAMENTE 2 bares por ciudad.
- EXTRAS: las categor�as deben relacionarse directamente con los intereses del cliente (${interesStr}). Ejemplo: si tiene 'gastronomia' ? categor�a gastron�mica; si tiene 'aventura' ? actividades de adrenalina. Siempre incluir una categor�a "Para d�as de lluvia o descanso".
- QUE_EMPACAR: adapta el clima_esperado a las fechas reales propuestas (fecha_salida / fecha_regreso). La lista de ropa debe ser pr�ctica y concisa para el tipo de viaje y el clima del destino.${domesticRule ? '\n' + domesticRule : ''}${checklistRule ? '\n' + checklistRule : ''}

GENERA JSON puro (sin markdown, sin \`\`\`):
{
  "titulo": "string creativo",
  "subtitulo": "string tagline inspirador",
  "resumen": {
    "destino": "string",
    "origen": "string",
    "dias": n�mero,
    "viajeros": n�mero,
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
      "ruta": "string (ej: SCL \u2192 NRT directo, o SCL \u2192 LIM \u2192 NRT v\u00eda Lima)",
      "precio_estimado": "string",
      "duracion": "string (ej: 14h directo, 22h con 1 escala)",
      "escala": "string (Directo / 1 escala en CIUDAD / 2 escalas)",
      "tip": "string insider"
    }
  ],
  ${alojamientoSchema},
  "dias": [
    {
      "numero": n�mero,
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
      "ruta_optimizada": "string con orden l�gico del d�a para minimizar traslados",
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
    "conviene_auto": "string (s�/no con raz�n)"
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
    "embajada": "string (direcci�n y tel�fono de la embajada chilena en el destino)",
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
    "clima_esperado": "string (temperaturas m�n y m�x esperadas en las fechas del viaje, si llueve, humedad, etc.)",
    "ropa": ["string (ej: 5 poleras de manga corta)", "string (ej: 1 chaqueta liviana para noches)", "string (ej: 2 pantalones c�modos)", "string (ej: 1 traje de ba�o)", "string (ej: zapatillas c�modas para caminar)", "string (ej: ropa de abrigo para noches)"],
    "adaptador_enchufe": "string (tipo de enchufe del pa�s, voltaje y si el viajero chileno necesita adaptador o no, y d�nde comprarlo)",
    "botiquin": ["string (ej: analg�sicos tipo paracetamol)", "string (ej: antihistam�nico para alergias)", "string (ej: protector solar SPF50+)", "string (ej: repelente de mosquitos si aplica)", "string (ej: vendas, alcohol y desinfectante)"],
    "power_bank": "string (recomendaci�n concreta seg�n duraci�n y destino: capacidad en mAh sugerida, si es necesario, adaptadores de carga)"
  },
  "extras": [
    { "categoria": "string - categor�a basada en los intereses del cliente (${Array.isArray(formData.intereses) ? formData.intereses.join(', ') : 'cultura, aventura'})", "actividades": ["string", "string", "string"] },
    { "categoria": "string - segunda categor�a basada en intereses", "actividades": ["string", "string", "string"] },
    { "categoria": "Para d�as de lluvia o descanso", "actividades": ["string", "string", "string"] }
  ]
}`;

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

    let rawContent = '';
    try {
      rawContent = await callLLM(
        [{ role: 'user', content: isPro ? promptPro : promptBasico }],
        { maxTokens: isPro ? 12000 : 8000 }
      );
    } catch (llmErr) {
      console.error('LLM error:', llmErr.message);
      // Si es rate limit (429), intentar con modelo m�s r�pido como fallback
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
          console.error('Fallback tambi�n fall�:', groqFallback.status, fallbackErr);
        }
      }
      return NextResponse.json({ error: 'Error generando itinerario' }, { status: 500 });
    }

    let itinerario;
    try {
      // Limpiar markdown si el modelo los incluy�
      const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('{');
      const str = start >= 0 ? cleaned.substring(start) : cleaned;

      // 1. Intento directo
      let parsed = null;
      try { parsed = JSON.parse(str); } catch {}

      // 2. Si el JSON fue truncado, buscar desde el �ltimo '}' v�lido hacia atr�s
      if (!parsed) {
        let pos = str.lastIndexOf('}');
        while (pos > 0 && !parsed) {
          try { parsed = JSON.parse(str.substring(0, pos + 1)); }
          catch { pos = str.lastIndexOf('}', pos - 1); }
        }
      }

      if (!parsed) throw new Error('No valid JSON found');
      itinerario = parsed;

      // Post-procesado: corregir separador de ruta "?" -> "→" (bug de encoding en el prompt)
      if (itinerario.vuelos?.length) {
        itinerario.vuelos = itinerario.vuelos.map(v => ({
          ...v,
          ruta: (v.ruta || '').replace(/ \? /g, ' \u2192 '),
        }));
      }

      console.log('Itinerario parseado OK. Secciones:', Object.keys(itinerario).join(', '));
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Raw content preview:', rawContent.substring(0, 600));
      return NextResponse.json({ error: 'Error procesando itinerario' }, { status: 500 });
    }

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
