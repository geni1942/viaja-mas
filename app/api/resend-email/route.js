import { NextResponse } from 'next/server';
import { buildConfirmationEmail } from '@/lib/email-templates';
import { ce } from '@/lib/text-utils';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// ── PDF Generator (brand-compliant pdfmake) ───────────────────────────────────
async function generateItinerarioPdf(itinerario, formData, planLabel) {
  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');
    const vfsFonts = vfsFontsModule.default || vfsFontsModule;
    pdfMake.vfs = vfsFonts?.pdfMake?.vfs || vfsFonts?.vfs || {};

    const CORAL = '#FF6332';
    const FUCSIA = '#E83E8C';
    const VIOLETA = '#6F42C1';
    const CARBON = '#212529';
    const BG0 = '#FFF8F5';
    const BG1 = '#FFF0EB';
    const isPro = planLabel.toLowerCase().includes('pro');
    const res = itinerario.resumen || {};

    const secHdr = (txt, col = CORAL) => ({
      table: { widths: ['*'], body: [[{ text: txt, bold: true, fontSize: 12, color: '#fff', margin: [10, 7, 10, 7], border: [false,false,false,false] }]] },
      layout: 'noBorders', fillColor: col, margin: [0, 14, 0, 6],
    });
    const sep = () => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 0.4, lineColor: '#e0e0e0' }], margin: [0, 6, 0, 6] });

    const content = [];

    // ── PORTADA (página 1, fondo coral por `background`) ──────────────────────
    content.push({ text: '', margin: [0, 50, 0, 0] });
    content.push({ text: 'VIVANTE', fontSize: 54, bold: true, color: '#fff', alignment: 'center', margin: [0, 0, 0, 6] });
    content.push({ text: 'VIAJA MÁS · PLANIFICA MENOS', fontSize: 9, color: 'rgba(255,255,255,0.75)', alignment: 'center', characterSpacing: 2, margin: [0, 0, 0, 20] });
    content.push({ canvas: [{ type: 'line', x1: 80, y1: 0, x2: 443, y2: 0, lineWidth: 0.5, lineColor: 'rgba(255,255,255,0.35)' }], margin: [0, 0, 0, 20] });
    content.push({
      table: { widths: ['auto'], body: [[{ text: planLabel.toUpperCase(), bold: true, fontSize: 9, color: CORAL, margin: [14, 5, 14, 5], border: [false,false,false,false] }]] },
      layout: 'noBorders', fillColor: '#fff', alignment: 'center', margin: [0, 0, 0, 22],
    });
    content.push({ text: itinerario.titulo || `Itinerario: ${formData.destino}`, fontSize: 21, bold: true, color: '#fff', alignment: 'center', margin: [0, 0, 0, 8] });
    if (itinerario.subtitulo) content.push({ text: itinerario.subtitulo, fontSize: 11, italics: true, color: 'rgba(255,255,255,0.9)', alignment: 'center', margin: [0, 0, 0, 28] });

    // Tabla resumen en portada (blanca semitransparente)
    const coverRows = [
      res.destino || formData.destino ? ['📍 Destino', res.destino || formData.destino] : null,
      formData.origen               ? ['🛫 Origen', formData.origen]                 : null,
      res.fecha_salida              ? ['📅 Ida', res.fecha_salida]                    : null,
      res.fecha_regreso             ? ['📅 Vuelta', res.fecha_regreso]                : null,
      formData.dias                 ? ['⏱ Duración', `${formData.dias} días`]         : null,
      formData.numViajeros          ? ['👥 Viajeros', String(formData.numViajeros)]   : null,
      itinerario.presupuesto_desglose?.total ? ['💰 Presupuesto', itinerario.presupuesto_desglose.total] : null,
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
    content.push({ text: `vivevivante.com  ·  @vive.vivante`, fontSize: 8, color: 'rgba(255,255,255,0.55)', alignment: 'center', margin: [0, 12, 0, 0] });
    content.push({ text: '', pageBreak: 'after' });

    // ── RESUMEN ───────────────────────────────────────────────────────────────
    if (coverRows.length) {
      content.push(secHdr('📊 RESUMEN DEL VIAJE'));
      content.push({
        table: {
          widths: [120, '*'],
          body: coverRows.map(([k, v], i) => [
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
      content.push(secHdr('💰 PRESUPUESTO ESTIMADO'));
      const pd = itinerario.presupuesto_desglose;
      const budRows = [
        pd.vuelos      ? ['✈️ Vuelos', pd.vuelos]           : null,
        pd.alojamiento ? ['🏨 Alojamiento', pd.alojamiento] : null,
        pd.comidas     ? ['🍽️ Comidas', pd.comidas]         : null,
        pd.transporte  ? ['🚌 Transporte', pd.transporte]   : null,
        pd.actividades ? ['🎟️ Actividades', pd.actividades] : null,
        pd.extras      ? ['🛍️ Extras', pd.extras]           : null,
        pd.total       ? ['TOTAL ESTIMADO', pd.total]       : null,
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

    // ── ITINERARIO DÍA A DÍA ─────────────────────────────────────────────────
    if (itinerario.dias?.length) {
      content.push({ text:'', pageBreak:'before' });
      content.push(secHdr('📅 ITINERARIO DÍA A DÍA'));
      itinerario.dias.forEach((dia, di) => {
        const dayRows = [];
        if (dia.manana?.actividad) {
          dayRows.push([
            { text:'🌅 Mañana', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
            { text: dia.manana.actividad + (dia.manana.costo ? `  💰 ${dia.manana.costo}` : ''), fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
          ]);
          if (dia.manana.tip) dayRows.push([
            { text:'', border:[false,false,false,false], fillColor:'#fff' },
            { text:`💡 ${dia.manana.tip}`, fontSize:7, color:VIOLETA, italics:true, border:[false,false,false,false], fillColor:'#fff', margin:[4,0,4,4] },
          ]);
        }
        if (dia.tarde?.actividad) {
          dayRows.push([
            { text:'🌞 Tarde', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:BG0, margin:[4,5,4,4] },
            { text:(dia.tarde.almuerzo?`🍴 ${dia.tarde.almuerzo}  `:'') + dia.tarde.actividad, fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:BG0, margin:[4,5,4,4] },
          ]);
        }
        if (dia.noche?.actividad || dia.noche?.cena) {
          const nt = [dia.noche?.cena?`🍷 ${dia.noche.cena}`:'', dia.noche?.actividad||''].filter(Boolean).join('  ');
          dayRows.push([
            { text:'🌙 Noche', bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
            { text:nt, fontSize:8, color:CARBON, border:[false,false,false,false], fillColor:'#fff', margin:[4,5,4,4] },
          ]);
        }
        if (dia.gasto_dia) {
          dayRows.push([
            { text:'💰 Gasto del día', bold:true, fontSize:8, color:VIOLETA, border:[false,false,false,false], fillColor:BG1, margin:[4,5,4,5] },
            { text:String(dia.gasto_dia), fontSize:8, bold:true, color:VIOLETA, alignment:'right', border:[false,false,false,false], fillColor:BG1, margin:[4,5,4,5] },
          ]);
        }
        // Day card wrapper
        const colHdr = di % 2 === 0 ? CORAL : FUCSIA;
        const dayStack = [
          {
            table:{ widths:['*'], body:[[{ text:`Día ${dia.numero}: ${dia.titulo||''}`, bold:true, fontSize:11, color:'#fff', border:[false,false,false,false], margin:[10,7,10,7] }]] },
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
          dayStack.push({ text:`💡 ${dia.tip_local}`, fontSize:8, color:VIOLETA, italics:true, margin:[8,3,8,3] });
        }
        content.push({ stack: dayStack, unbreakable: true });
      });
    }

    // ── VUELOS ────────────────────────────────────────────────────────────────
    if (itinerario.vuelos?.length) {
      content.push({ text:'', pageBreak:'before' });
      content.push(secHdr('✈️ VUELOS RECOMENDADOS'));
      const fHdr = ['Aerolínea','Ruta / Escala','Precio est.','Duración','Tip'].map(t => ({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const fRows = itinerario.vuelos.map((v,i) => [
        { text:v.aerolinea||'', fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:(v.ruta||'')+(v.escala?`\n${v.escala}`:''), fontSize:8, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.precio_estimado||'—', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.duracion||'—', fontSize:8, color:'#666', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:v.tip||'—', fontSize:7, color:VIOLETA, italics:true, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
      ]);
      content.push({
        table:{ widths:[90,110,65,52,'*'], body:[fHdr,...fRows] },
        layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
        margin:[0,0,0,10],
      });
    }

    // ── ALOJAMIENTO ───────────────────────────────────────────────────────────
    if (itinerario.alojamiento?.length) {
      content.push(secHdr('🏨 ALOJAMIENTO'));
      itinerario.alojamiento.forEach((zona,zi) => {
        if (zona.destino) content.push({ text:`📍 ${zona.destino}${zona.noches?` — ${zona.noches} noches`:''}`, fontSize:9, bold:true, color:VIOLETA, margin:[0,4,0,5] });
        const hHdr = ['Categoría','Hotel / Puntuación','Precio/noche','Por qué elegirlo'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:VIOLETA, border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const hRows = (zona.opciones||[]).map((op,i)=>[
          { text:op.categoria||'—', fontSize:8, bold:true, color:op.categoria==='Premium'?FUCSIA:CORAL, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:(op.nombre||'')+(op.puntuacion?`\n⭐ ${op.puntuacion}`:''), fontSize:8, color:CARBON, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:op.precio_noche||'—', fontSize:8, bold:true, color:VIOLETA, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:op.por_que||'—', fontSize:7, color:'#555', italics:true, fillColor:i%2===0?'#F5F0FF':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        ]);
        content.push({
          table:{ widths:[58,110,70,'*'], body:[hHdr,...hRows] },
          layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' },
          margin:[0,0,0,8], unbreakable: true,
        });
      });
    }

    // ── RESTAURANTES ──────────────────────────────────────────────────────────
    if (itinerario.restaurantes) {
      content.push(secHdr('🍽️ RESTAURANTES RECOMENDADOS'));
      const restData = Array.isArray(itinerario.restaurantes)
        ? { [(res.destino||formData.destino||'Destino').split(',')[0]]: itinerario.restaurantes }
        : itinerario.restaurantes;
      Object.entries(restData).forEach(([ciudad, lista]) => {
        if (Object.keys(restData).length > 1) content.push({ text:`📍 ${ciudad}`, fontSize:9, bold:true, color:CORAL, margin:[0,5,0,4] });
        const rHdr = ['Restaurante','Tipo','Precio/pers.','Reserva'].map(t=>({
          text:t, bold:true, fontSize:8, color:'#fff', fillColor:CORAL, border:[false,false,false,false], margin:[4,6,4,6]
        }));
        const rRows = (lista||[]).map((r,i)=>[
          { text:r.nombre+(r.por_que?`\n${r.por_que}`:''), fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.tipo||'—', fontSize:8, color:'#555', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.precio_promedio||'—', fontSize:8, bold:true, color:CORAL, fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
          { text:r.requiere_reserva?'✓ Sí':'—', fontSize:8, color:r.requiere_reserva?'#27ae60':'#aaa', fillColor:i%2===0?BG0:'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        ]);
        content.push({ table:{ widths:['*',75,70,42], body:[rHdr,...rRows] }, layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' }, margin:[0,0,0,8] });
      });
    }

    // ── EXPERIENCIAS ──────────────────────────────────────────────────────────
    if (itinerario.experiencias?.length) {
      content.push(secHdr('🎟️ EXPERIENCIAS Y TOURS', FUCSIA));
      const eHdr = ['Experiencia','Duración','Precio','Por qué vale'].map(t=>({
        text:t, bold:true, fontSize:8, color:'#fff', fillColor:FUCSIA, border:[false,false,false,false], margin:[4,6,4,6]
      }));
      const eRows = itinerario.experiencias.map((e,i)=>[
        { text:e.nombre||'—', fontSize:8, bold:true, color:CARBON, fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:e.duracion||'—', fontSize:8, color:'#666', fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:e.precio||'—', fontSize:8, bold:true, color:FUCSIA, fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
        { text:e.por_que_vale||'—', fontSize:7, color:'#555', italics:true, fillColor:i%2===0?'#FFF0F7':'#fff', border:[false,false,false,false], margin:[4,5,4,5] },
      ]);
      content.push({ table:{ widths:['*',60,65,'*'], body:[eHdr,...eRows] }, layout:{ hLineWidth:()=>0.3, hLineColor:()=>'#eee', vLineWidth:()=>0.3, vLineColor:()=>'#eee' }, margin:[0,0,0,8] });
    }

    // ── TIPS ──────────────────────────────────────────────────────────────────
    if (itinerario.tips?.length) {
      content.push(secHdr('💡 TIPS CLAVE'));
      itinerario.tips.forEach((tip, i) => {
        const tipText = typeof tip === 'string' ? tip : (tip.texto || tip.tip || JSON.stringify(tip));
        content.push({
          table:{ widths:[18,'*'], body:[[
            { text:`${i+1}.`, bold:true, fontSize:8, color:CORAL, border:[false,false,false,false], margin:[4,4,2,4] },
            { text:tipText, fontSize:8, color:CARBON, border:[false,false,false,false], margin:[2,4,4,4] },
          ]] },
          layout:'noBorders', fillColor: i%2===0?BG0:'#fff', margin:[0,0,0,0],
        });
      });
      content.push({ text:'', margin:[0,0,0,8] });
    }

    // ── LO IMPERDIBLE ─────────────────────────────────────────────────────────
    if (itinerario.lo_imperdible?.length) {
      content.push(secHdr('⭐ LO IMPERDIBLE', FUCSIA));
      itinerario.lo_imperdible.forEach((item, i) => {
        content.push({ text:`${i+1}. ${item.nombre}`, fontSize:10, bold:true, color:CARBON, margin:[0,6,0,2] });
        content.push({ text:item.descripcion||'', fontSize:8, color:'#555', margin:[0,0,0,6] });
        if (i < itinerario.lo_imperdible.length - 1) content.push({ canvas:[{ type:'line', x1:0, y1:0, x2:523, y2:0, lineWidth:0.4, lineColor:'#FFD0E8' }], margin:[0,0,0,6] });
      });
    }

    // ── PRO: NOCHE ────────────────────────────────────────────────────────────
    if (isPro) {
      const bares = Array.isArray(itinerario.bares_vida_nocturna) ? itinerario.bares_vida_nocturna : [];
      if (bares.length) {
        content.push(secHdr('🍸 BARES Y VIDA NOCTURNA'));
        bares.forEach(b => {
          content.push({ text:`• ${b.nombre||''}${b.tipo_ambiente?` — ${b.tipo_ambiente}`:''}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
          if (b.tip) content.push({ text:`  💡 ${b.tip}`, fontSize:8, color:VIOLETA, italics:true, margin:[16,0,8,4] });
        });
      }
      if (itinerario.transporte_local) {
        content.push(secHdr('🚇 TRANSPORTE LOCAL'));
        const tl = itinerario.transporte_local;
        if (tl.como_moverse) content.push({ text:`• ¿Cómo moverse? ${tl.como_moverse}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
        if (tl.apps_recomendadas?.length) content.push({ text:`• Apps: ${tl.apps_recomendadas.join(', ')}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
        if (tl.tarjeta_transporte) content.push({ text:`• Tarjeta: ${tl.tarjeta_transporte}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
        if (tl.conviene_auto) content.push({ text:`• Auto: ${tl.conviene_auto}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
      }
      if (itinerario.conectividad) {
        content.push(secHdr('📱 CONECTIVIDAD'));
        const co = itinerario.conectividad;
        if (co.esim_recomendada) content.push({ text:`• eSIM: ${co.esim_recomendada}${co.esim_precio?` — ${co.esim_precio}`:''}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
        if (co.operador_local) content.push({ text:`• Operador local: ${co.operador_local}`, fontSize:9, color:CARBON, margin:[8,3,8,3] });
      }
      if (itinerario.que_empacar) {
        content.push(secHdr('🎒 QUÉ EMPACAR'));
        const qe = itinerario.que_empacar;
        if (qe.clima_esperado) content.push({ text:`🌤 Clima: ${qe.clima_esperado}`, fontSize:9, color:CARBON, margin:[8,3,8,5] });
        if (qe.esencial?.length) content.push({ text:`• Esencial: ${qe.esencial.join(', ')}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
        if (qe.recomendado?.length) content.push({ text:`• Recomendado: ${qe.recomendado.join(', ')}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
        if (qe.adaptador_enchufe) content.push({ text:`• Adaptador: ${qe.adaptador_enchufe}`, fontSize:9, color:CARBON, margin:[8,2,8,2] });
      }
    }

    // ── BACK COVER ────────────────────────────────────────────────────────────
    content.push({ text:'', pageBreak:'before' });
    content.push({ text:'', margin:[0,100,0,0] });
    content.push({ text:'VIVANTE', fontSize:42, bold:true, color:CORAL, alignment:'center', margin:[0,0,0,8] });
    content.push({ text:'VIAJA MÁS · PLANIFICA MENOS', fontSize:9, color:'#888', alignment:'center', characterSpacing:2, margin:[0,0,0,16] });
    content.push({ canvas:[{ type:'line', x1:80, y1:0, x2:443, y2:0, lineWidth:1, lineColor:CORAL }], margin:[0,0,0,16] });
    content.push({ text:`¡Que tengas el viaje de tu vida${formData.nombre?', '+formData.nombre:''}! ✈️`, fontSize:13, italics:true, color:'#555', alignment:'center', margin:[0,0,0,20] });
    content.push({ text:'vivevivante.com  ·  @vive.vivante', fontSize:10, color:'#aaa', alignment:'center', margin:[0,0,0,0] });

    // ── DOCUMENT DEFINITION ───────────────────────────────────────────────────
    const docDefinition = {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 9, color: CARBON, lineHeight: 1.45 },
      pageMargins: [36, 58, 36, 42],
      info: {
        title: itinerario.titulo || 'Itinerario VIVANTE',
        author: 'VIVANTE — vivevivante.com',
        subject: `Itinerario ${formData.destino}`,
      },
      // Header en cada página (excepto portada y back cover)
      header: (currentPage, pageCount) => {
        if (currentPage === 1 || currentPage === pageCount) return null;
        return {
          stack: [
            {
              columns: [
                { text: 'VIVANTE', bold: true, fontSize: 11, color: CORAL, margin: [36, 13, 0, 0] },
                { text: (itinerario.titulo || formData.destino || '').split(',')[0].trim().substring(0, 35),
                  fontSize: 8, color: '#999', margin: [8, 16, 0, 0] },
                { text: planLabel, bold: true, fontSize: 8, color: CORAL, alignment: 'right', margin: [0, 13, 36, 0] },
              ]
            },
            { canvas: [{ type: 'line', x1: 36, y1: 0, x2: 559, y2: 0, lineWidth: 0.6, lineColor: CORAL }] }
          ]
        };
      },
      // Footer con número de página
      footer: (currentPage, pageCount) => {
        if (currentPage === 1) return null;
        return {
          text: `${currentPage} / ${pageCount}  ·  vivevivante.com`,
          fontSize: 7, color: '#ccc', alignment: 'center', margin: [0, 0, 0, 10]
        };
      },
      // Fondo coral solo en portada (página 1)
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
    console.error('PDF generation error:', e.message);
    return null;
  }
}

// ── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { formData, itinerario, planId } = await req.json();
    if (!formData?.email || !itinerario) {
      return NextResponse.json({ error: 'Faltan datos (formData.email o itinerario)' }, { status: 400 });
    }

    const isPro    = planId === 'pro';
    const planLabel = isPro ? 'Vivante Pro ⭐' : 'Vivante Básico';
    const fechaTexto = itinerario.resumen?.fecha_optima_texto || '';

    const emailHtml  = buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto, { isResend: true });
    const pdfBase64  = await generateItinerarioPdf(itinerario, formData, planLabel);
    if (!pdfBase64) console.warn('[VIVANTE resend] PDF no generado — email sin adjunto.');

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VIVANTE <noreply@vivevivante.com>',
        reply_to: 'vive.vivante.ch@gmail.com',
        to: [formData.email],
        subject: `📩 Reenvío de tu itinerario — ${itinerario.titulo || formData.destino} · ${planLabel}`,
        html: emailHtml,
        ...(pdfBase64 && {
          attachments: [{ filename: `itinerario-vivante-${isPro?'pro':'basico'}.pdf`, content: pdfBase64 }]
        }),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('[VIVANTE resend] Resend API error:', errText);
      return NextResponse.json({ error: 'Error enviando email' }, { status: 500 });
    }

    console.log('[VIVANTE resend] Email reenviado a:', formData.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[VIVANTE resend] Error:', err.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
