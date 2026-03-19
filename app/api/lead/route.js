// app/api/lead/route.js
// Guarda email de lead en Brevo Contacts para remarketing

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, nombre, destino } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
    }

    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) return NextResponse.json({ ok: true, skip: true });

    // Upsert contact en Brevo (crea o actualiza si ya existe)
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: nombre || '',
          DESTINO:   destino || '',
          SOURCE:    'form_lead',
        },
        listIds: [3],        // Lista "Leads VIVANTE" — ajustá el ID si tenés otra lista
        updateEnabled: true, // Si ya existe, actualiza en vez de dar error
      }),
    });

    // 204 = creado, 400 con "Contact already exist" = actualizado (updateEnabled)
    if (res.status === 204 || res.status === 201 || res.status === 200) {
      return NextResponse.json({ ok: true });
    }
    const body = await res.json().catch(() => ({}));
    // Brevo devuelve 400 si el contacto ya existe y updateEnabled=false, pero con
    // updateEnabled:true debería dar 204. Igual tratamos como éxito silencioso.
    if (body?.code === 'duplicate_parameter') {
      return NextResponse.json({ ok: true, note: 'already exists' });
    }

    console.error('Brevo lead error', res.status, body);
    return NextResponse.json({ ok: false }, { status: 500 });
  } catch (err) {
    console.error('Lead route error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
