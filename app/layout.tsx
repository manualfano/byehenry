import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bye Henry — Dashboard Financiero",
  description: "Tablero de gestión financiera — Bye Henry Craft Bar, La Plata",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
