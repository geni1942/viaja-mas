import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, planId } = body;

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

    const clienteCtx = `
DATOS DEL CLIENTE:
- Nombre: ${formData.nombre}
- Destino: ${formData.destino || 'Destino flexible'}
- Origen: ${formData.origen || 'Santiago, Chile'}
- Presupuesto: $${formData.presupuesto >= 15000 ? '15.000+' : formData.presupuesto} USD por persona
- Duración: ${formData.dias} días
- Tipo de viajero: ${formData.tipoViaje || 'pareja'}
- Número de viajeros: ${formData.numViajeros || 2}
- Intereses: ${Array.isArray(formData.intereses) ? formData.intereses.join(', ') : (formData.intereses || 'cultura, gastronomía')}
- Ritmo: ${formData.ritmo <= 2 ? 'Relajado (max 2 actividades/día)' : formData.ritmo <= 3 ? 'Moderado (2-3 actividades)' : 'Intenso (3-4 actividades)'}
- Alojamiento preferido: ${formData.alojamiento || 'hotel'}

Hoy es ${today}. Los precios, vuelos y datos de alojamiento deben ser realistas para esta fecha.
Para fecha_salida y fecha_regreso: propón fechas REALES en formato YYYY-MM-DD, mínimo 6-8 semanas desde hoy (${today}), en temporada ideal para el destino. fecha_regreso = fecha_salida + ${formData.dias} días.
Para origen_iata y destino_iata: código IATA de 3 letras del aeropuerto principal.`;

    const alojamientoSchema = `
"alojamiento": [
  {
    "destino": "string (ciudad/zona)",
    "noches": número,
    "opciones": [
      {
        "plataforma": "Booking.com",
        "nombre": "string (nombre real del alojamiento)",
        "categoria": "Económico",
        "precio_noche": "string en USD",
        "puntuacion": "string (ej: 8.7/10)",
        "cancelacion": "Gratuita",
        "highlights": ["string feature 1", "string feature 2"],
        "por_que": "string en voz VIVANTE cálida y directa",
        "link": "URL directa del alojamiento en la plataforma o URL de búsqueda: https://www.booking.com/searchresults.html?ss=CIUDAD&group_adults=VIAJEROS"
      },
      {
        "plataforma": "${formData.alojamiento === 'airbnb' ? 'Airbnb' : formData.alojamiento === 'hostal' ? 'Hostelworld' : 'Booking.com'}",
        "nombre": "string",
        "categoria": "Confort",
        "precio_noche": "string",
        "puntuacion": "string",
        "cancelacion": "Gratuita",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL"
      },
      {
        "plataforma": "Airbnb",
        "nombre": "string",
        "categoria": "Premium",
        "precio_noche": "string",
        "puntuacion": "string (ej: 4.9/5)",
        "cancelacion": "string",
        "highlights": ["string"],
        "por_que": "string",
        "link": "URL directa o búsqueda: https://www.airbnb.com/s/CIUDAD/homes"
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
IMPORTANTE: Reemplaza NOMBRE_REAL_CIUDAD_1 y NOMBRE_REAL_CIUDAD_2 con los nombres reales de las ciudades visitadas. Incluye EXACTAMENTE 3 restaurantes por ciudad. Si hay más ciudades, agrega más claves al objeto. Varía barrios, tipos de cocina y rangos de precio.`;

    const experienciasSchema = `
"experiencias": [
  {
    "nombre": "string (nombre de la actividad/tour)",
    "por_que_vale": "string en voz VIVANTE",
    "duracion": "string (ej: 3 horas)",
    "precio": "string (ej: $25-40 USD por persona)",
    "anticipacion": "string (ej: Reservar con 1 semana de anticipación)",
    "plataformas_disponibles": ["GetYourGuide", "Viator"],
    "link": "URL REAL de la actividad en Civitatis, GetYourGuide o Viator. Si no tienes la URL exacta, usa búsqueda: GetYourGuide: https://www.getyourguide.com/s/?q=ACTIVIDAD+CIUDAD&searchSource=2, Civitatis: https://www.civitatis.com/es/CIUDAD/?q=ACTIVIDAD, Viator: https://www.viator.com/search?q=ACTIVIDAD+CIUDAD"
  }
]
IMPORTANTE sobre plataformas_disponibles: incluye SOLO las plataformas donde esta actividad específica está realmente disponible. Usa ["GetYourGuide"] si solo está en GYG, ["Viator"] si solo está en Viator, ["GetYourGuide","Viator"] si está en ambas. Usa [] si es una actividad muy local/independiente no comercializada en estas plataformas. Basa esto en tu conocimiento real de qué tours se venden en cada plataforma.`;

    // ─── PROMPT BÁSICO ─────────────────────────────────────────────────────────
    const promptBasico = `Eres el planificador de VIVANTE. Crea un itinerario COMPLETO con el tono VIVANTE: cercano, directo, como un amigo experto. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas aéreas. Incluye mínimo 3 aerolíneas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta específica. Si NO hay vuelo directo, nunca lo inventes — pon la mejor conexión con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL → BOG → NRT").
- ALOJAMIENTO: Recomienda SOLO hoteles/alojamientos con nombre REAL y verificable. Prioriza cadenas conocidas (Hilton, Marriott, NH, Ibis, Radisson, Hyatt, etc.) o boutiques con alta presencia online. NUNCA inventes nombres de hoteles.
- RESTAURANTES: incluye exactamente 3 restaurantes por cada ciudad/destino visitado, agrupados por ciudad.

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
    const promptPro = `Eres el planificador PRO de VIVANTE. Itinerario PREMIUM ultra-detallado, con el tono cálido y experto VIVANTE. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas aéreas. Incluye mínimo 3 aerolíneas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta específica. Si NO hay vuelo directo, nunca lo inventes — pon la mejor conexión con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL → BOG → NRT").
- ALOJAMIENTO: Recomienda SOLO hoteles/alojamientos con nombre REAL y verificable. Prioriza cadenas conocidas (Hilton, Marriott, NH, Ibis, Radisson, Hyatt, etc.) o boutiques con alta presencia online. NUNCA inventes nombres de hoteles.
- RESTAURANTES: incluye exactamente 3 restaurantes por cada ciudad/destino visitado, agrupados por ciudad.
- TRANSPORTE aeropuerto→centro: lista TODAS las opciones disponibles (Uber, Taxi, Metro, Bus express, Tren, etc.) con costo estimado y duración en el array opciones_aeropuerto_centro.

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
  "bares_vida_nocturna": [
    {
      "nombre": "string",
      "tipo_ambiente": "string",
      "precio_trago": "string",
      "mejor_dia": "string (ej: jueves o viernes)",
      "tip": "string"
    }
  ],
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
  "extras": [
    { "categoria": "string (Cultural/Gastronómica/Para días de lluvia)", "actividades": ["string"] }
  ]
}`;

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

    const emailHtml = `
<!DOCTYPE html>
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
      <p style="color:#fff;font-size:14px;margin:0 0 8px;">Este itinerario completo con día a día, alojamiento, restaurantes y más lo encontrás en:</p>
      <p style="color:#fff;font-size:13px;font-style:italic;margin:0;">Revisá tu pantalla de confirmación de pago o solicitalo a <a href="mailto:vive.vivante.ch@gmail.com" style="color:#FFE0D0;">vive.vivante.ch@gmail.com</a></p>
    </div>

    ${(itinerario.dias || []).slice(0, 3).map(dia => `
    <div style="border-left:4px solid #FF6332;padding:12px 16px;margin-bottom:16px;background:#FFF8F5;border-radius:0 8px 8px 0;">
      <p style="font-weight:700;color:#FF6332;margin:0 0 6px;">Día ${dia.numero}: ${dia.titulo}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">🌅 ${dia.manana?.actividad || ''}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">🌞 ${dia.tarde?.almuerzo || ''}</p>
      <p style="margin:0;color:#6F42C1;font-size:12px;font-style:italic;">💰 ${dia.gasto_dia || ''}</p>
    </div>`).join('')}
    ${(itinerario.dias || []).length > 3 ? `<p style="text-align:center;color:#888;font-size:13px;">... y ${itinerario.dias.length - 3} días más en tu itinerario completo</p>` : ''}

  </div>

  ${!isPro ? `<div style="background:linear-gradient(135deg,#FF6332 0%,#C2185B 100%);border-radius:12px;padding:24px 20px;margin:0 0 24px;text-align:center;">
    <p style="color:#fff;font-size:16px;font-weight:800;margin:0 0 8px;">&#x1F680; &iquest;Quer&eacute;s m&aacute;s detalle de tu viaje?</p>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;line-height:1.6;margin:0 0 16px;">Mejor&aacute; a Vivante Pro por solo <strong>$9 m&aacute;s</strong> y agreg&aacute; restaurantes recomendados, vida nocturna, tips de seguridad, eSIM, frases locales y presupuesto detallado d&iacute;a a d&iacute;a.</p>
    <a href="mailto:vive.vivante.ch@gmail.com?subject=Quiero%20mejorar%20a%20Vivante%20Pro" style="display:inline-block;background:#fff;color:#FF6332;padding:10px 28px;border-radius:24px;font-weight:800;font-size:13px;text-decoration:none;">Mejorar a Pro por $9 &rarr;</a>
  </div>` : ''}
  <div style="background:#FF6332;padding:32px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 16px;">
      ${itinerario.subtitulo || `Solo falta hacer la maleta, ${formData.nombre}. ✈️`}
    </p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
      <a href="https://www.vivante.com" style="color:rgba(255,255,255,0.85);">www.vivante.com</a> ·
      <a href="https://instagram.com/vive.vivante" style="color:rgba(255,255,255,0.85);">@vive.vivante</a>
    </p>
  </div>

</div>
</body>
</html>`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
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
        }),
      });
      if (!emailRes.ok) console.error('Resend error:', await emailRes.text());
    }

    return NextResponse.json({ itinerario, planId });
  } catch (error) {
    console.error('send-itinerary error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
