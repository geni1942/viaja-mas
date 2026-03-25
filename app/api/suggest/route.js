import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // ── Intereses con prioridad ───────────────────────────────────────────────
    const interesesMap = {
      'playa': 'Playa y mar', 'cultura': 'Cultura e historia',
      'aventura': 'Aventura y deportes extremos', 'gastronomia': 'Gastronomía',
      'relax': 'Relax y bienestar', 'naturaleza': 'Naturaleza y paisajes',
      'nocturna': 'Vida nocturna', 'deporte': 'Deportes', 'shopping': 'Compras y shopping',
    };
    const interesesArray = Array.isArray(data.intereses) ? data.intereses : [];
    const interesesTexto = interesesArray.length > 0
      ? interesesArray.map((i, idx) => {
          const pesos = ['PRINCIPAL', 'secundario', 'complementario', 'ocasional'];
          return `${interesesMap[i] || i} (${pesos[idx] || 'ocasional'})`;
        }).join(', ')
      : 'cultura, gastronomía';

    const ritmoTexto = data.ritmo <= 2 ? 'relajado' : data.ritmo <= 3 ? 'moderado' : 'intenso';

    const alojamientoMap = {
      'hotel':  'Hotel (mid-range a premium)',
      'airbnb': 'Airbnb / apartamento privado',
      'hostal': 'Hostal (económico, social)',
      'bnb':    'Bed & Breakfast (pequeño, familiar)',
    };
    const alojTexto = alojamientoMap[data.alojamiento] || 'Hotel';

    // ── Contexto de ocasión especial ─────────────────────────────────────────
    const ocasionSuggestMap = {
      'luna-de-miel': 'LUNA DE MIEL — destinos ultra-románticos e íntimos, opciones de hoteles boutique especiales',
      'aniversario':  'ANIVERSARIO — destinos románticos con experiencias memorables de pareja',
      'despedida':    'DESPEDIDA DE SOLTERO/A — destinos con buena vida nocturna y actividades de adrenalina grupal',
      'cumpleanos':   'CUMPLEAÑOS — destinos festivos con buena variedad de actividades grupales',
      'graduacion':   'GRADUACIÓN — destinos con experiencias premium accesibles para celebrar',
    };
    const ocasionCtxSuggest = data.ocasionEspecial && ocasionSuggestMap[data.ocasionEspecial]
      ? `\n- Ocasión especial: ${ocasionSuggestMap[data.ocasionEspecial]}`
      : '';

    // ── Contexto de mes de viaje ──────────────────────────────────────────────
    const mesCtx = data.mesViaje
      ? `\n- Mes de viaje preferido: ${data.mesViaje.replace('-', ' ')} — considera temporada, clima y precios de esa época`
      : '';

    // ── Prioridad de gasto ────────────────────────────────────────────────────
    const prioridadSuggestMap = {
      'vuelo-directo': 'prefiere destinos con vuelo directo disponible desde su ciudad de origen',
      'mejor-hotel':   'prioriza destinos con buena oferta hotelera de calidad',
      'actividades':   'prioriza destinos con abundante oferta de actividades y experiencias',
      'gastronomia':   'prioriza destinos reconocidos por su gastronomía',
    };
    const prioridadCtxSuggest = data.prioridadGasto && data.prioridadGasto !== 'equilibrado' && prioridadSuggestMap[data.prioridadGasto]
      ? `\n- Preferencia de gasto: ${prioridadSuggestMap[data.prioridadGasto]}`
      : '';

    // ── Restricción dietaria ──────────────────────────────────────────────────
    const restriccionSuggestMap = {
      'vegetariano': 'vegetariano — prioriza destinos con buena oferta vegetariana',
      'vegano':      'vegano — prioriza destinos con buena cultura plant-based (Asia, Europa occidental)',
      'sin-gluten':  'sin gluten — evita destinos donde sea difícil comer sin gluten',
      'halal':       'halal — prioriza destinos con restaurantes halal accesibles',
    };
    const restriccionCtxSuggest = data.restriccionDietaria && data.restriccionDietaria !== 'sin-restriccion' && restriccionSuggestMap[data.restriccionDietaria]
      ? `\n- Alimentación: ${restriccionSuggestMap[data.restriccionDietaria]}`
      : '';

    // ── Experiencia como viajero ──────────────────────────────────────────────
    const experienciaCtxSuggest = data.experienciaViajero === 'frecuente'
      ? '\n- Perfil: viajero frecuente — evita los destinos más obvios y turísticos, propone opciones con más carácter y menos masificadas'
      : data.experienciaViajero === 'primera-vez'
      ? '\n- Perfil: primera experiencia viajando — prioriza destinos amigables para viajeros novatos, bien conectados y seguros'
      : '';

    // ── Familia con niños ─────────────────────────────────────────────────────
    const numNinos = data.numNinos || 0;
    const familiaCtx = data.tipoViaje === 'familia' && numNinos > 0
      ? `\n- Viaje familiar con ${numNinos} niño${numNinos > 1 ? 's' : ''}: prioriza destinos seguros con actividades para todas las edades. EVITA destinos de fiesta, aventura extrema o sin infraestructura familiar.`
      : data.tipoViaje === 'familia'
        ? `\n- Viaje familiar: prioriza destinos seguros con atracciones para todas las edades.`
        : '';

    const tipoViajeMap = {
      'solo': 'viajero solo', 'pareja': 'pareja', 'familia': 'familia', 'amigos': 'grupo de amigos',
    };
    const tipoViajero = tipoViajeMap[data.tipoViaje] || data.tipoViaje;

    // Prompt para generar 3 opciones de destino
    const prompt = `Eres un experto en viajes. Genera exactamente 3 opciones de destino para este viajero. Las 3 opciones deben ser las MEJORES para su perfil específico — no sigas un formato rígido de tipos, elige lo que realmente encaje mejor.

PERFIL DEL VIAJERO:
- Origen: ${data.origen}
- Presupuesto: $${data.presupuesto} USD por persona (incluye vuelos, hotel y actividades)
- Duración: ${data.dias} días
- Tipo de viajero: ${tipoViajero} (${data.numViajeros} personas)
- Intereses EN PRIORIDAD: ${interesesTexto}
- Ritmo preferido: ${ritmoTexto}
- Alojamiento preferido: ${alojTexto}${familiaCtx}${ocasionCtxSuggest}${mesCtx}${prioridadCtxSuggest}${restriccionCtxSuggest}${experienciaCtxSuggest}

REGLAS:
- Variedad: las 3 opciones deben ser destinos diferentes entre sí (diferentes regiones o países)
- Al menos una opción debe ser multidestino si los días lo permiten (${data.dias >= 7 ? 'los días lo permiten' : 'con cuidado si los días son pocos'})
- El precio estimado debe ser REALISTA considerando vuelos desde ${data.origen}
- Los destinos deben coincidir directamente con los intereses priorizados
- Si hay restricción dietaria, los destinos deben tenerla cubierta
- Si hay ocasión especial, los destinos deben potenciarla
- Si el alojamiento es "Hostal": prioriza la ruta mochilera (Bangkok, Lisboa, Medellín, Berlín, etc.)
- Si es "B&B": ciudades medianas con encanto (Toscana, Provence, Alentejo) sobre megalópolis
- El presupuesto es por persona

Responde ÚNICAMENTE en este formato JSON exacto, sin texto adicional:
{
  "opciones": [
    {
      "id": 1,
      "tipo": "multidestino",
      "destino": "Roma + París",
      "paises": "Italia y Francia",
      "dias_distribucion": "4 días Roma + 3 días París",
      "precio_estimado": 1850,
      "porque": "Combinación perfecta de historia, arte y gastronomía mediterránea y francesa",
      "highlights": ["Coliseo y Vaticano", "Torre Eiffel y Louvre", "Pasta romana y croissants parisinos"]
    },
    {
      "id": 2,
      "tipo": "monopais",
      "destino": "Barcelona + Madrid",
      "paises": "España",
      "dias_distribucion": "4 días Barcelona + 3 días Madrid",
      "precio_estimado": 1200,
      "porque": "Lo mejor de España: playa mediterránea y cultura urbana",
      "highlights": ["Sagrada Familia y playas", "Museo del Prado y tapas", "Tren AVE entre ciudades"]
    },
    {
      "id": 3,
      "tipo": "destino_unico",
      "destino": "Lisboa",
      "paises": "Portugal",
      "dias_distribucion": "7 días completos",
      "precio_estimado": 950,
      "porque": "Ciudad costera con encanto, asequible y llena de historia",
      "highlights": ["Barrio de Alfama", "Pastéis de Belém", "Excursión a Sintra"]
    }
  ]
}`;

    // Llamar a Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en viajes que genera recomendaciones de destinos. Siempre respondes en formato JSON válido, sin texto adicional ni markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Un poco de variación para sugerencias diferentes
        max_tokens: 1500,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error('Error de Groq:', errorData);
      throw new Error('Error al generar sugerencias');
    }

    const groqData = await groqResponse.json();
    const responseText = groqData.choices[0]?.message?.content || '';
    
    // Parsear JSON de la respuesta
    let opciones;
    try {
      // Intentar extraer JSON si viene con texto adicional
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        opciones = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido');
      }
    } catch (parseError) {
      console.error('Error parseando respuesta:', responseText);
      throw new Error('Error al procesar sugerencias');
    }

    return NextResponse.json({
      success: true,
      opciones: opciones.opciones
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar sugerencias' },
      { status: 500 }
    );
  }
}

