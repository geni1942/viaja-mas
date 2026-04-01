import { NextResponse } from 'next/server';
import { getPlan } from '@/lib/plans';

export async function POST(req) {
  try {
    const { planId, email, nombre, destino, formData } = await req.json();

    if (!planId || !email) {
      return NextResponse.json({ error: 'Faltan datos del plan' }, { status: 400 });
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 });
    }
    const precio = plan.precioClp;
    const planNombre = plan.nombre;

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
        // IMPORTANTE: incluir ?plan= y ?d= para que pago-exitoso sepa qué plan y destino compró el usuario
        success: `${baseUrl}/pago-exitoso?plan=${planId}&d=${encodeURIComponent(destino || '')}`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`,
      },
      auto_return: 'approved',
      external_reference: email,
      statement_descriptor: 'VIVANTE TRAVEL',
      metadata: formData ? { vivante_form: JSON.stringify(formData) } : undefined,
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

    return NextResponse.json({ init_point: checkoutUrl, preference_id: data.id });
  } catch (error) {
    console.error('Payment preference error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
