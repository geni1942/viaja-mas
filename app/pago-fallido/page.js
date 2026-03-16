'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PagoFallidoContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 text-center max-w-md shadow-sm">
        <div className="text-5xl mb-5">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">El pago no pudo procesarse</h1>
        <p className="text-gray-500 mb-6">
          {status === 'rejected'
            ? 'Tu pago fue rechazado. Por favor verifica los datos de tu tarjeta o intenta con otro método de pago.'
            : 'Hubo un problema al procesar tu pago. Puedes intentarlo nuevamente.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Intentar nuevamente
          </button>
          <a
            href="mailto:vive.vivante.ch@gmail.com"
            className="block w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PagoFallido() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PagoFallidoContent />
    </Suspense>
  );
}
