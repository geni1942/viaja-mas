import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { planId, planNombre, precio, email, nombre } = await req.json();

    if (!planId || !precio || !email) {
      return NextResponse.json({ error: 'Faltan datos del plan' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Configuración de pago incompleta' }, { status: 500 });
    }

    // Detectar si estamos en modo test (credenciales de prueba empiezan con TEST-)
    const isTestMode = accessToken.startsWith('TEST-');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivevivante.com';

    const preference = {
      items: [
        {
          id: planId,
          title: `VIVANTE — ${planNombre}`,
          quantity: 1,
          unit_price: precio,
          currency_id: 'CLP',
        },
      ],
      payer: {
        email,
        name: nombre,
      },
      back_urls: {
        success: `${baseUrl}/pago-exitoso`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`,
      },
      auto_return: 'approved',
      external_reference: email,
      statement_descriptor: 'VIVANTE TRAVEL',
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP error response:', JSON.stringify(data));
      return NextResponse.json(
        { error: 'Error al crear preferencia de pago', detail: data?.message || '' },
        { status: 500 }
      );
    }

    // En modo test usar sandbox_init_point, en produccion usar init_point
    const checkoutUrl = isTestMode
      ? (data.sandbox_init_point || data.init_point)
      : data.init_point;

    return NextResponse.json({ init_point: checkoutUrl });
  } catch (error) {
    console.error('Payment preference error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
