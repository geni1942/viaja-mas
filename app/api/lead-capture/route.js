import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── POST /api/lead-capture ───────────────────────────────────────────────────
// Captura nombre + email cuando el usuario avanza del Paso 1 del formulario.
// Guarda el contacto en Brevo para remarketing de abandono del funnel.
// Silencioso: no bloquea el flujo del usuario — se llama en fire-and-forget.
export async function POST(req) {
  try {
    const { nombre, email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) {
      return NextResponse.json({ ok: false, error: 'No Brevo key' }, { status: 500 });
    }

    // Upsert contacto en Brevo (crea si no existe, actualiza si ya existe)
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
          SOURCE: 'form_step1',
        },
        listIds: [2],           // Lista de leads (ajustar ID según tu cuenta Brevo)
        updateEnabled: true,    // Si ya existe, actualiza en vez de dar error
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Error 400 con "Contact already exist" no es un error real — ignorar
      if (!errBody.includes('Contact already exist')) {
        console.error('Brevo lead-capture error:', res.status, errBody);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Nunca rompemos el flujo del usuario por esto
    console.error('lead-capture unexpected error:', error);
    return NextResponse.json({ ok: true }); // Respuesta positiva igual — fire-and-forget
  }
}
