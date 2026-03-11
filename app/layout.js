import './globals.css';

export const metadata = {
  title: 'Viaja Más | Planifica menos, vive más',
  description: 'Cuéntanos tu presupuesto, tus días y lo que te apasiona. Creamos tu viaje perfecto: vuelos, hotel, actividades y más — todo listo para reservar.',
  keywords: 'viajes, itinerarios, planificación de viajes, vacaciones, turismo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✈️</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
