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
      'vegetariano': 'VEGETARIANO — prioriza destinos con amplia oferta vegetariana real (no solo ensaladas). Ciudades universitarias y cosmopolitas son ideales. EVITA destinos donde la cocina local sea principalmente carne (ej: Buenos Aires asado-céntrico es factible en ciudad; zonas rurales de Argentina, no).',
      'vegano':      'VEGANO — prioriza destinos con cultura plant-based establecida: Berlín, Amsterdam, Barcelona, Ciudad de México, Bangkok, Bali, Lisboa. PENALIZA destinos donde el veganismo es muy difícil: zonas rurales de Europa del Este, ciudades medianas de LATAM sin oferta diversa.',
      'sin-gluten':  'SIN GLUTEN — prioriza destinos donde el sin-gluten es conocido y accesible. EVITA destinos con cocina basada en pasta/pan masivo sin alternativas (sur de Italia rural, por ejemplo). Incluye en el "por_que" cómo manejar la restricción en ese destino.',
      'halal':       'HALAL — prioriza destinos con comunidad musulmana establecida y oferta halal clara: Estambul, Dubai, Kuala Lumpur, México DF, Madrid (barrio de Lavapiés), etc. Penaliza destinos donde sea muy difícil encontrar opciones halal.',
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

    // ── Regla de presupuesto ─────────────────────────────────────────────────
    const _presupuestoNum = parseInt(data.presupuesto) || 0;
    const _presupuestoDiaSuggest = _presupuestoNum > 0 ? Math.round(_presupuestoNum / (parseInt(data.dias) || 7)) : 0;
    const presupuestoReglaSuggest = _presupuestoNum > 0
      ? `\n- PRESUPUESTO MÁXIMO: $${_presupuestoNum} USD por persona TOTAL — el precio_estimado de CADA opción DEBE ser ≤ $${_presupuestoNum}. ${
          _presupuestoDiaSuggest < 100
            ? `Con $${_presupuestoDiaSuggest}/día, OBLIGATORIO priorizar destinos económicos: LATAM (Colombia, Perú, México, Bolivia, Guatemala, Nicaragua), Europa del Este (Budapest, Praga, Varsovia, Belgrado, Bucarest). PROHIBIDOS destinos de alto costo: Hawaii, Maldivas, Seychelles, Islandia, Dubái, Tokio, Nueva York, Londres, Zurich — el vuelo+hotel básico ya supera o iguala el presupuesto total.`
            : _presupuestoDiaSuggest < 180
            ? `Con $${_presupuestoDiaSuggest}/día prioriza LATAM y Europa mid-range. Evita destinos conocidamente caros (Hawaii, Maldivas, Dubái, Islandia, Seychelles).`
            : `Presupuesto suficiente para destinos premium. Propón opciones que aprovechen bien ese nivel.`
        }`
      : '';

    // ── Regla distancia/eficiencia por días ──────────────────────────────────
    const _origenNormS = (data.origen || '').toLowerCase();
    // Detección ampliada: países Y ciudades principales de LATAM
    const _esSudAmericaS = [
      // Países
      'chile','argentina','per\u00fa','peru','colombia','brasil','brazil',
      'bolivia','ecuador','uruguay','venezuela','paraguay',
      // Ciudades principales
      'santiago','buenos aires','lima','bogot\u00e1','bogota','s\u00e3o paulo','sao paulo',
      'rio de janeiro','m\u00e9xico','mexico','ciudad de m\u00e9xico','ciudad de mexico',
      'montevideo','asunci\u00f3n','asuncion','quito','la paz','caracas',
      'medell\u00edn','medellin','c\u00e1li','cali','barranquilla',
      'porto alegre','belo horizonte','salvador','brasilia',
      'guayaquil','cochabamba','santa cruz',
    ].some(p => _origenNormS.includes(p));
    const _diasNum = parseInt(data.dias) || 7;
    // La regla de distancia aplica para CUALQUIER origen cuando los días son pocos
    const distanciaReglaSuggest = _diasNum <= 4
      ? `\n- DISTANCIA CR\u00cdTICA — SOLO ${_diasNum} D\u00cdAS: OBLIGATORIO proponer \u00daNICAMENTE destinos con m\u00e1ximo 6h de vuelo desde ${data.origen || 'el origen'}.${_esSudAmericaS ? ' (Sudam\u00e9rica, Caribe cercano, M\u00e9xico)' : ''} PROHIBIDOS destinos con vuelo >8h — el tiempo de traslado har\u00eda el viaje ineficiente. Esto NO es opcional.`
      : _diasNum <= 7
      ? `\n- DISTANCIA CR\u00cdTICA — ${_diasNum} D\u00cdAS: OBLIGATORIO respetar estas reglas de forma estricta: (1) AL MENOS 2 DE LAS 3 OPCIONES deben tener vuelo \u22648h desde ${data.origen || 'el origen'}. (2) ABSOLUTAMENTE PROHIBIDO sugerir Jap\u00f3n, Sudeste Asi\u00e1tico (Tailandia, Vietnam, Indonesia, etc.), Ocean\u00eda (Australia, Nueva Zelanda), Hawaii o cualquier destino con vuelo >9h desde ${data.origen || 'el origen'} — con ${_diasNum} d\u00edas solo quedan 3-4 d\u00edas reales en destino despu\u00e9s del tr\u00e1nsito, lo que hace el viaje inviable. (3) Europa del Oeste es el l\u00edmite m\u00e1ximo SOLO si encaja claramente con los intereses, e IMPRESCINDIBLE indicar en "por_que" cu\u00e1ntos d\u00edas reales quedan en destino. (4) Si el usuario tiene inter\u00e9s expl\u00edcito en Asia u Ocean\u00eda, recomendar igual un destino cercano que satisfaga ese inter\u00e9s (ej: inter\u00e9s en culturas asi\u00e1ticas → M\u00e9xico con influencia oriental, o Canarias, no Tokio).`
      : _diasNum <= 11
      ? `\n- DISTANCIA — ${_diasNum} D\u00cdAS: PROHIBIDOS Ocean\u00eda y Asia muy lejana (>16h de vuelo). Para destinos de 12-14h (Jap\u00f3n, Sudeste Asi\u00e1tico): solo incluirlos si los intereses del viajero los justifican claramente, e incluir en "por_que" los d\u00edas reales disponibles en destino.`
      : '';

    // Prompt para generar 3 opciones de destino
    const prompt = `Eres un experto en viajes. Genera exactamente 3 opciones de destino para este viajero. Las 3 opciones deben ser las MEJORES para su perfil específico — no sigas un formato rígido de tipos, elige lo que realmente encaje mejor.

PERFIL DEL VIAJERO:
- Origen: ${data.origen}
- Presupuesto: $${data.presupuesto} USD por persona (incluye vuelos, hotel y actividades)
- Duración: ${data.dias} días
- Tipo de viajero: ${tipoViajero} (${data.numViajeros} personas)
- Intereses EN PRIORIDAD: ${interesesTexto}
- Ritmo preferido: ${ritmoTexto}
- Alojamiento preferido: ${alojTexto}${familiaCtx}${ocasionCtxSuggest}${mesCtx}${prioridadCtxSuggest}${restriccionCtxSuggest}${experienciaCtxSuggest}${presupuestoReglaSuggest}${distanciaReglaSuggest}

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
- Considera que un vuelo largo consume días reales del viaje (vuelo >8h = 1 día perdido por tramo; vuelo >12h = 2 días perdidos)
- Calcula y completa el campo "dias_reales_en_destino" = días totales - días perdidos en tránsito (ida + vuelta). Ejemplo: 7 días con vuelo 13h = 7 - 2 = 5 días reales
${_diasNum <= 4 ? `- REGLA DE DISTANCIA OBLIGATORIA (${_diasNum} días): SOLO destinos con vuelo ≤6h. RECHAZA cualquier destino con vuelo >6h. Esta regla es ABSOLUTA.` : _diasNum <= 7 ? `- REGLA DE DISTANCIA OBLIGATORIA (${_diasNum} días): RECHAZA Japón, Australia, Nueva Zelanda, Sudeste Asiático, Hawaii o cualquier destino con vuelo >9h desde ${data.origen || 'el origen'}. MÍNIMO 2 de tus 3 opciones deben tener vuelo ≤8h. Esta regla es ABSOLUTA y no admite excepciones.` : ''}
- PRESUPUESTO ESTRICTO: el precio_estimado de CADA opción debe ser ≤ $${data.presupuesto} USD. Calcula realísticamente vuelo (ida+vuelta desde ${data.origen}) + hotel (${data.dias} noches) + actividades antes de proponer.

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
      "dias_reales_en_destino": 5,
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
      "dias_reales_en_destino": 5,
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
      "dias_reales_en_destino": 7,
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

