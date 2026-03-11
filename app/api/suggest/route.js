import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Formatear intereses para el prompt
    const interesesMap = {
      'playa': 'Playa y mar',
      'cultura': 'Cultura e historia',
      'aventura': 'Aventura y deportes extremos',
      'gastronomia': 'Gastronomía',
      'relax': 'Relax y bienestar',
      'naturaleza': 'Naturaleza y paisajes',
      'nocturna': 'Vida nocturna',
      'deporte': 'Deportes',
      'shopping': 'Compras y shopping',
    };
    
    const interesesTexto = data.intereses
      .map(i => interesesMap[i] || i)
      .join(', ');
    
    const ritmoTexto = data.ritmo <= 2 ? 'relajado' : data.ritmo <= 3 ? 'moderado' : 'intenso';
    
    const tipoViajeMap = {
      'solo': 'viajero solo',
      'pareja': 'pareja',
      'familia': 'familia',
      'amigos': 'grupo de amigos'
    };
    
    const tipoViajero = tipoViajeMap[data.tipoViaje] || data.tipoViaje;

    // Prompt para generar 3 opciones de destino
    const prompt = `Eres un experto en viajes. Genera exactamente 3 opciones de destino para este viajero:

PERFIL DEL VIAJERO:
- Origen: ${data.origen}
- Presupuesto: $${data.presupuesto} USD por persona (incluye vuelos, hotel y actividades)
- Duración: ${data.dias} días
- Tipo de viajero: ${tipoViajero} (${data.numViajeros} personas)
- Intereses: ${interesesTexto}
- Ritmo preferido: ${ritmoTexto}

REGLAS PARA LAS OPCIONES:
1. OPCIÓN 1: Multidestino (2 países o 2 ciudades en países diferentes). Ejemplo: "Roma + París"
2. OPCIÓN 2: Monopaís multiciudad (2-3 ciudades del mismo país). Ejemplo: "Barcelona + Madrid"
3. OPCIÓN 3: ${data.dias <= 7 ? 'Destino único (una sola ciudad, ideal para viajes cortos)' : 'Otra combinación multidestino o monopaís diferente a las anteriores'}

IMPORTANTE:
- El precio estimado debe ser REALISTA considerando vuelos desde ${data.origen}, hoteles de categoría media y actividades
- Considera la temporada actual y costos de vida del destino
- Los destinos deben coincidir con los intereses del viajero
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
