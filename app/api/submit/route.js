import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Email donde recibes las solicitudes
    const OWNER_EMAIL = 'mraggio@fen.uchile.cl';
    
    // Formatear los intereses
    const interesesMap = {
      'playa': '🏖️ Playa',
      'cultura': '🏛️ Cultura',
      'aventura': '🏔️ Aventura',
      'gastronomia': '🍽️ Gastronomía',
      'relax': '🧘 Relax',
      'naturaleza': '🌲 Naturaleza',
      'nocturna': '🎉 Vida Nocturna',
      'deporte': '⚽ Deporte',
      'shopping': '🛍️ Shopping',
    };
    
    const interesesTexto = data.intereses
      .map(i => interesesMap[i] || i)
      .join(', ');
    
    // Formatear ritmo
    const ritmoTexto = data.ritmo <= 2 ? 'Relajado' : data.ritmo <= 3 ? 'Moderado' : 'Intenso';
    
    // Formatear tipo de viaje
    const tipoViajeMap = {
      'solo': 'Solo/a',
      'pareja': 'Pareja',
      'familia': 'Familia',
      'amigos': 'Amigos/as'
    };
    
    // Email HTML para ti (el dueño) con todos los detalles
    const ownerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ec4899); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nueva Solicitud de Itinerario</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Datos del cliente -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">👤 Datos del Cliente</h2>
            <p style="margin: 5px 0; color: #333;"><strong>Nombre:</strong> ${data.nombre}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #f97316;">${data.email}</a></p>
          </div>
          
          <!-- Detalles del viaje -->
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 18px;">✈️ Detalles del Viaje</h2>
            <p style="margin: 5px 0; color: #333;"><strong>Destino:</strong> ${data.tieneDestino ? data.destino : '🎲 Quiere recomendaciones (Sorpréndeme)'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Origen:</strong> ${data.origen}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Presupuesto:</strong> $${data.presupuesto.toLocaleString()} USD por persona</p>
            <p style="margin: 5px 0; color: #333;"><strong>Duración:</strong> ${data.dias} días</p>
          </div>
          
          <!-- Viajeros -->
          <div style="background: #fdf4ff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #86198f; font-size: 18px;">👥 Viajeros</h2>
            <p style="margin: 5px 0; color: #333;"><strong>Tipo:</strong> ${tipoViajeMap[data.tipoViaje] || data.tipoViaje}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Número de viajeros:</strong> ${data.numViajeros}</p>
          </div>
          
          <!-- Preferencias -->
          <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">✨ Preferencias</h2>
            <p style="margin: 5px 0; color: #333;"><strong>Intereses:</strong> ${interesesTexto}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Ritmo:</strong> ${ritmoTexto} (${data.ritmo}/5)</p>
          </div>
          
          <!-- Próximos pasos -->
          <div style="background: #fff7ed; padding: 20px; border-radius: 12px; border-left: 4px solid #f97316;">
            <h2 style="margin: 0 0 15px 0; color: #c2410c; font-size: 18px;">📋 Próximos Pasos</h2>
            <ol style="margin: 0; padding-left: 20px; color: #333;">
              <li style="margin-bottom: 8px;">Crear itinerario personalizado con IA</li>
              <li style="margin-bottom: 8px;">Enviar preview + datos de pago al cliente</li>
              <li style="margin-bottom: 8px;">Esperar confirmación de pago</li>
              <li style="margin-bottom: 0;">Enviar itinerario completo</li>
            </ol>
          </div>
          
          <!-- Botón de responder -->
          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${data.email}?subject=Tu%20itinerario%20de%20Viaja%20M%C3%A1s%20est%C3%A1%20listo" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold;">
              Responder al Cliente
            </a>
          </div>
          
        </div>
        
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          Viaja Más · Nueva solicitud recibida
        </p>
      </div>
    </body>
    </html>
    `;

    // Enviar email usando Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Viaja Más <onboarding@resend.dev>',
        to: OWNER_EMAIL,
        subject: `🎉 Nueva solicitud: ${data.nombre} - ${data.tieneDestino ? data.destino : 'Quiere recomendaciones'}`,
        html: ownerEmailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Error de Resend:', errorData);
      throw new Error('Error al enviar notificación');
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Solicitud recibida correctamente'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
