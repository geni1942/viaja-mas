import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    console.log('📝 Nueva solicitud:', formData.nombre, formData.email);

    if (!formData.email || !formData.nombre) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey || resendKey.length < 10) {
      console.error('❌ RESEND_API_KEY no configurada');
      return NextResponse.json(
        { error: 'Error de configuración. Contacta al administrador.' },
        { status: 500 }
      );
    }

    const interesesTexto = formData.intereses?.join(', ') || 'No especificado';
    const ritmoTexto = formData.ritmo <= 2 ? 'Relajado' : formData.ritmo <= 3 ? 'Moderado' : 'Intenso';
    const tipoViajeTexto = {
      'solo': 'Viajero solo',
      'pareja': 'Pareja',
      'familia': 'Familia',
      'amigos': 'Grupo de amigos/as'
    }[formData.tipoViaje] || 'No especificado';
    
    const alojamientoTexto = {
      'hotel': 'Hotel',
      'airbnb': 'Airbnb',
      'hostal': 'Hostal',
      'bnb': 'B&B'
    }[formData.alojamiento] || 'No especificado';

    const planTexto = formData.plan || 'No seleccionado';
    const planPrecio = formData.planPrecio ? `$${formData.planPrecio.toLocaleString('es-CL')} CLP` : 'No definido';

    console.log('📧 Enviando notificación...');

    // Email de notificación a la dueña
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (notificationEmail) {
      const notificationHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316, #ec4899); padding: 30px; text-align: center; color: white; border-radius: 16px 16px 0 0; }
    .content { background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-top: none; }
    .info-box { background: white; padding: 20px; border-radius: 12px; margin: 15px 0; border: 1px solid #e2e8f0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #1e293b; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 13px; background: #f1f5f9; border-radius: 0 0 16px 16px; }
    .highlight { background: linear-gradient(135deg, #fef3c7, #fce7f3); padding: 15px; border-radius: 10px; margin-top: 15px; }
    .plan-box { background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 15px; border-radius: 10px; margin-top: 15px; text-align: center; }
    .plan-box .precio { font-size: 24px; font-weight: bold; }
    .next-steps { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 10px; margin-top: 15px; }
    .next-steps h4 { color: #065f46; margin: 0 0 10px 0; }
    .next-steps ol { margin: 0; padding-left: 20px; color: #047857; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;">🎉 ¡Nueva Solicitud!</h1>
    <p style="margin:10px 0 0 0; opacity: 0.9;">Tienes un nuevo cliente esperando</p>
  </div>
  <div class="content">
    <div class="plan-box">
      <p style="margin: 0 0 5px 0; opacity: 0.9;">Plan seleccionado</p>
      <p class="precio" style="margin: 0;">${planTexto}</p>
      <p style="margin: 5px 0 0 0; font-size: 18px;">${planPrecio}</p>
    </div>

    <div class="info-box">
      <h3 style="margin: 0 0 15px 0; color: #f97316;">👤 Datos del Cliente</h3>
      <div class="info-row">
        <span class="label">Nombre:</span>
        <span class="value">${formData.nombre}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${formData.email}</span>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin: 0 0 15px 0; color: #f97316;">✈️ Detalles del Viaje</h3>
      <div class="info-row">
        <span class="label">Destino:</span>
        <span class="value">${formData.destino || 'Pidió recomendaciones'}</span>
      </div>
      <div class="info-row">
        <span class="label">Origen:</span>
        <span class="value">${formData.origen}</span>
      </div>
      <div class="info-row">
        <span class="label">Días:</span>
        <span class="value">${formData.dias} días</span>
      </div>
      <div class="info-row">
        <span class="label">Presupuesto:</span>
        <span class="value">$${formData.presupuesto?.toLocaleString()} USD por persona</span>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin: 0 0 15px 0; color: #f97316;">👥 Viajeros</h3>
      <div class="info-row">
        <span class="label">Tipo de viaje:</span>
        <span class="value">${tipoViajeTexto}</span>
      </div>
      <div class="info-row">
        <span class="label">Número de viajeros:</span>
        <span class="value">${formData.numViajeros || 1}</span>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin: 0 0 15px 0; color: #f97316;">🎯 Preferencias</h3>
      <div class="info-row">
        <span class="label">Intereses:</span>
        <span class="value">${interesesTexto}</span>
      </div>
      <div class="info-row">
        <span class="label">Ritmo:</span>
        <span class="value">${ritmoTexto}</span>
      </div>
      <div class="info-row">
        <span class="label">Alojamiento:</span>
        <span class="value">${alojamientoTexto}</span>
      </div>
    </div>

    <div class="highlight">
      <strong>💳 Estado del pago:</strong> Pendiente de verificación
      <br><small>El cliente recibió los datos de transferencia. Espera su comprobante en geniraggio@hotmail.com</small>
    </div>

    <div class="next-steps">
      <h4>📋 Próximos pasos:</h4>
      <ol>
        <li>Espera el comprobante de pago del cliente</li>
        <li>Verifica la transferencia de ${planPrecio}</li>
        <li>Genera el itinerario con el prompt de Notion</li>
        <li>Crea el PDF y envíalo al cliente</li>
      </ol>
    </div>
  </div>
  <div class="footer">
    <p>Viaja Más - Tu herramienta de itinerarios</p>
  </div>
</body>
</html>`;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Viaja Más <onboarding@resend.dev>',
            to: notificationEmail,
            subject: `🎉 Nueva solicitud: ${formData.nombre} - ${planTexto} (${planPrecio})`,
            html: notificationHtml,
          }),
        });
        console.log('✅ Notificación enviada a:', notificationEmail);
      } catch (e) {
        console.log('⚠️ No se pudo enviar notificación:', e.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar tu solicitud. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
