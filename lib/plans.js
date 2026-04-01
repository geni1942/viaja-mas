export const PLANS = [
  {
    id: 'basico',
    nombre: 'Vivante Básico',
    precio: 10,
    precioClp: 9990,
    descripcion: 'Itinerario personalizado día a día',
    incluye: [
      'Itinerario completo en PDF',
      'Links de vuelos y alojamientos',
      'Puntos de interés',
      'Tips culturales, de conectividad y dinero',
      'Tips locales básicos para viajeros',
    ],
  },
  {
    id: 'pro',
    nombre: 'Vivante Pro',
    precio: 17,
    precioClp: 16990,
    descripcion: 'Experiencia premium con todos los detalles',
    incluye: [
      'Todo lo del Vivante Básico',
      'Restaurantes recomendados por zona y RRSS',
      'Opciones de tours y actividades',
      'Tips de seguridad y transporte',
      'Tips culturales, de conectividad y dinero',
      'Presupuesto detallado por día',
    ],
    popular: true,
  },
];

export const UPGRADE_PRICE_CLP = 6790;

export function getPlan(planId) {
  return PLANS.find(p => p.id === planId) || null;
}
