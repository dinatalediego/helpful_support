import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Helpful Support · Decision Experience Lab",
  description:
    "Demo inmobiliaria para observar el camino desde un dato hasta una decisión y su resultado Realtime.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
