import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, nombre } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Falta el email' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Configuración de pago incompleta' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivevivante.com';

    const preference = {
      items: [
        {
          id: 'pro-upgrade',
          title: 'VIVANTE Pro — Upgrade desde Básico',
          description: 'Acceso completo al itinerario Pro: bares, transporte, conectividad, qué empacar y más.',
          quantity: 1,
          unit_price: 6790,   // $7 USD ≈ 6.790 CLP (ajustar según tasa)
          currency_id: 'CLP',
        },
      ],
      payer: {
        email,
        name: nombre || '',
      },
      back_urls: {
        success: `${baseUrl}/pago-exitoso?plan=pro`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`,
      },
      auto_return: 'approved',
      external_reference: email,
      statement_descriptor: 'VIVANTE PRO',
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
      console.error('MP upsell error:', data);
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
    }

    return NextResponse.json({ init_point: data.init_point });
  } catch (error) {
    console.error('Upsell preference error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
