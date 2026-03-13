import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vivante - Itinerarios de Viaje Personalizados",
  description: "Viaja más. Planifica menos. Recibe itinerarios personalizados con IA para tu próximo viaje.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Travelpayouts Verification Script */}
        <Script
          id="travelpayouts-verification"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var script = document.createElement("script");
                script.async = 1;
                script.src = 'https://tpembars.com/NTA2OTM0.js?t=506934';
                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
