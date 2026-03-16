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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivante.vercel.app';

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
      notification_url: `${baseUrl}/api/payment/webhook`,
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
      console.error('MP error:', data);
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
    }

    return NextResponse.json({ init_point: data.init_point });
  } catch (error) {
    console.error('Payment preference error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
