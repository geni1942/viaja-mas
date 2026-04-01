export function buildConfirmationEmail(formData, itinerario, planLabel, fechaTexto, { isResend = false } = {}) {
  const coral = '#FF6332';
  const violeta = '#6F42C1';
  const crema = '#FCF8F4';
  const bg1 = '#FFF0EB';
  const bg0 = '#FFF8F5';
  const greeting = isResend
    ? `Te reenviamos tu plan <strong style="color:${coral};">${planLabel}</strong>.`
    : `Tu plan <strong style="color:${coral};">${planLabel}</strong> está listo.`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu itinerario VIVANTE</title></head>
<body style="margin:0;padding:0;background:${crema};font-family:Arial,sans-serif;color:#212529;">
<div style="max-width:640px;margin:0 auto;background:${crema};">
  <div style="background:${coral};padding:28px;text-align:center;">
    <p style="color:#fff;font-size:28px;font-weight:800;margin:0 0 4px;letter-spacing:-1px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:0;letter-spacing:2px;">VIAJA M\u00c1S. PLANIFICA MENOS.</p>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#212529;margin:0 0 8px;">\u00a1Hola, ${formData.nombre}! \u2708\ufe0f</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 6px;">${greeting}</p>
    ${fechaTexto ? `<p style="color:${violeta};font-style:italic;font-size:14px;margin:0 0 20px;">\ud83d\udcc5 ${fechaTexto}</p>` : ''}
    <div style="background:${bg1};border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="color:${coral};font-size:17px;margin:0 0 12px;">\ud83d\udcca Resumen</h2>
      <p style="margin:4px 0;"><strong>Destino:</strong> ${itinerario.resumen?.destino || formData.destino}</p>
      <p style="margin:4px 0;"><strong>Duraci\u00f3n:</strong> ${formData.dias} d\u00edas &middot; ${formData.numViajeros} viajero${formData.numViajeros > 1 ? 's' : ''}</p>
      <p style="margin:4px 0;"><strong>Fecha de ida:</strong> ${itinerario.resumen?.fecha_salida || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Fecha de vuelta:</strong> ${itinerario.resumen?.fecha_regreso || 'Ver en el itinerario'}</p>
      <p style="margin:4px 0;"><strong>Presupuesto estimado:</strong> ${itinerario.presupuesto_desglose?.total || ''}</p>
    </div>
    <div style="background:${coral};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#fff;font-size:14px;margin:0 0 8px;">Tu itinerario completo est\u00e1 adjunto como PDF en este correo.</p>
      <p style="color:#fff;font-size:13px;font-style:italic;margin:0;">\u00bfProblemas? Esc\u00edbenos a <a href="mailto:vive.vivante.ch@gmail.com" style="color:#FFE0D0;">vive.vivante.ch@gmail.com</a></p>
    </div>
    ${(itinerario.dias || []).slice(0, 3).map(dia => `
    <div style="border-left:4px solid ${coral};padding:12px 16px;margin-bottom:16px;background:${bg0};border-radius:0 8px 8px 0;">
      <p style="font-weight:700;color:${coral};margin:0 0 6px;">D\u00eda ${dia.numero}: ${dia.titulo}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">\ud83c\udf05 ${dia.manana?.actividad || ''}</p>
      <p style="margin:0 0 4px;color:#212529;font-size:14px;">\ud83c\udf1e ${dia.tarde?.almuerzo || ''}</p>
      <p style="margin:0;color:${violeta};font-size:12px;font-style:italic;">\ud83d\udcb0 ${dia.gasto_dia || ''}</p>
    </div>`).join('')}
    ${(itinerario.dias || []).length > 3 ? `<p style="text-align:center;color:#888;font-size:13px;">... y ${itinerario.dias.length - 3} d\u00edas m\u00e1s en tu itinerario completo (ver PDF adjunto)</p>` : ''}
  </div>
  <div style="background:${coral};padding:32px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">VIVANTE</p>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 16px;">
      ${itinerario.subtitulo || `\u00a1Solo falta hacer la maleta, ${formData.nombre}!`}
    </p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">
      <a href="https://vivevivante.com" style="color:rgba(255,255,255,0.85);">vivevivante.com</a> &middot;
      <a href="https://instagram.com/vive.vivante" style="color:rgba(255,255,255,0.85);">@vive.vivante</a>
    </p>
  </div>
</div>
</body></html>`;
}
