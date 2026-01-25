import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bodega Jormard", // El nombre que saldrá en la pestaña
  description: "Tu tienda de confianza con los mejores productos",
  icons: {
    icon: "/favicon.ico", // Ruta a tu nuevo logo
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png", // Opcional para iPhone
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
