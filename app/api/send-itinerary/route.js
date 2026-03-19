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

    // Plataformas según preferencia del cliente
    // hotel → Eco=Airbnb, Mid=Booking.com, Prem=Booking.com
    // airbnb → todo Airbnb | hostal → todo Hostelworld | bnb → todo Booking.com
    const alojPref = formData.alojamiento || 'hotel';
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
    "link_gyg": "URL directa del tour en GetYourGuide si la conoces con certeza, o null. Ejemplo: https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-t12345/ — NO inventes URLs. Si no estás seguro, pon null."
  }
]
IMPORTANTE sobre plataformas_disponibles: La GRAN MAYORÍA de tours, excursiones y actividades turísticas están disponibles en GetYourGuide y/o Viator. Por defecto usa ["GetYourGuide","Viator"]. Usa [] ÚNICAMENTE para actividades completamente locales/gratuitas que NO se comercializan online (ej: entrar a una iglesia gratis, caminar por un barrio, mercado local sin entrada). En caso de duda, siempre incluye GetYourGuide.`;

    // ─── PROMPT BÁSICO ─────────────────────────────────────────────────────────
    const promptBasico = `Eres el planificador de VIVANTE. Crea un itinerario COMPLETO con el tono VIVANTE: cercano, directo, como un amigo experto. Precios realistas para ${currentYear}.
${clienteCtx}

REGLAS IMPORTANTES:
- VUELOS: Usa tu conocimiento real de rutas aéreas. Incluye mínimo 3 aerolíneas distintas. SOLO pon escala="Directo" si existe un vuelo directo real en esa ruta específica. Si NO hay vuelo directo, nunca lo inventes — pon la mejor conexión con ciudad real de escala (ej: "1 escala en Lima"). En el campo "ruta" especifica siempre las ciudades de escala reales (ej: "SCL → BOG → NRT").
- ALOJAMIENTO: Recomienda SOLO hoteles/alojamientos con nombre REAL y verificable. Prioriza cadenas conocidas (Hilton, Marriott, NH, Ibis, Radisson, Hyatt, etc.) o boutiques con alta presencia online. NUNCA inventes nombres de hoteles. SIEMPRE incluye EXACTAMENTE 3 opciones por ciudad: Económico, Confort y Premium. Nunca menos de 3.
- RESTAURANTES: incluye exactamente 3 restaurantes por cada ciudad/destino visitado, agrupados por ciudad.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta vuelos, alojamiento y actividades a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa el campo resumen.ritmo para incluir una nota como "⚠️ Presupuesto ajustado — hemos optimizado el itinerario para sacar el máximo con tu presupuesto."
- RITMO: El cliente eligió ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el número de actividades por día: ritmo 1-2 = máximo 2 actividades por día (días relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por día con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por día, días aprovechados al máximo. NO incluyas más actividades de las correspondientes aunque el destino lo permita. El ritmo también afecta el tono: ritmo bajo = más descripción contemplativa, ritmo alto = más dinámico y energético.

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
- ALOJAMIENTO: Recomienda SOLO hoteles/alojamientos con nombre REAL y verificable. Prioriza cadenas conocidas (Hilton, Marriott, NH, Ibis, Radisson, Hyatt, etc.) o boutiques con alta presencia online. NUNCA inventes nombres de hoteles. SIEMPRE incluye EXACTAMENTE 3 opciones por ciudad: Económico, Confort y Premium. Nunca menos de 3.
- RESTAURANTES: incluye exactamente 3 restaurantes por cada ciudad/destino visitado, agrupados por ciudad.
- PRESUPUESTO: El presupuesto indicado ($${presupuesto} USD) es el TOTAL por persona para TODO el viaje. El campo presupuesto_desglose.total NO debe superar ese valor. Adapta todas las recomendaciones (vuelos, alojamiento, actividades, restaurantes) a esa realidad. Si el presupuesto es insuficiente para el destino elegido, usa resumen.ritmo para incluir una nota como "⚠️ Presupuesto ajustado — optimizamos el itinerario para sacar el máximo con tu presupuesto."
- RITMO: El cliente eligió ritmo ${formData.ritmo || 3}/5. DEBES respetar ESTRICTAMENTE el número de actividades por día: ritmo 1-2 = máximo 2 actividades por día (días relajados, pausas largas, tiempo libre); ritmo 3 = exactamente 2-3 actividades por día con tiempo libre entre ellas; ritmo 4-5 = 3-4 actividades por día, días aprovechados al máximo. NO incluyas más actividades de las correspondientes aunque el destino lo permita. El ritmo también afecta el tono: ritmo bajo = más descripción contemplativa, ritmo alto = más dinámico y energético.
- TRANSPORTE aeropuerto→centro: lista TODAS las opciones disponibles (Uber, Taxi, Metro, Bus express, Tren, etc.) con costo estimado y duración en el array opciones_aeropuerto_centro.
- BARES: en bares_vida_nocturna usa un objeto cuyas claves son los nombres REALES de las ciudades visitadas. Incluye EXACTAMENTE 2 bares/lugares por ciudad.
- EXTRAS: las categorías deben relacionarse directamente con los intereses del cliente (${Array.isArray(formData.intereses) ? formData.intereses.join(', ') : 'cultura, aventura'}). Ejemplo: si tiene 'gastronomia' → categoría gastronómica; si tiene 'aventura' → actividades de adrenalina. Siempre incluir una categoría "Para días de lluvia o descanso".
- QUE_EMPACAR: adapta el clima_esperado a las fechas reales propuestas (fecha_salida / fecha_regreso). La lista de ropa debe ser práctica y concisa para el tipo de viaje y el clima del destino.

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

    // ── Brevo: enviar email upsell Pro (solo para plan básico) ───────────────
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
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: 1,
            to: [{ email: formData.email, name: formData.nombre }],
            params: {
              FIRSTNAME:   formData.nombre,
              UPGRADE_URL: upgradeUrl,
            },
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
