import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── GET /api/payment/recover-session?preference_id=xxx ──────────────────────
// Recupera formData desde los metadatos de una preferencia de MercadoPago.
// Usado como fallback cross-device cuando localStorage no tiene los datos
// (p.ej. usuario completó el form en móvil y abrió el link de retorno en desktop).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const preferenceId = searchParams.get('preference_id');

    if (!preferenceId) {
      return NextResponse.json({ formData: null, error: 'Missing preference_id' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ formData: null, error: 'No access token' }, { status: 500 });
    }

    const res = await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('MP recover-session error:', res.status);
      return NextResponse.json({ formData: null });
    }

    const preference = await res.json();

    let formData = null;
    try {
      const raw = preference?.metadata?.vivante_form;
      if (raw) formData = JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing vivante_form metadata:', e);
    }

    return NextResponse.json({ formData });
  } catch (error) {
    console.error('recover-session unexpected error:', error);
    return NextResponse.json({ formData: null });
  }
}
