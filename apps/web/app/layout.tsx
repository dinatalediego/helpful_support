import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Helpful Support · API Experience Lab",
  description:
    "Laboratorio visual para observar REST, RPC, Auth, RLS, Edge Functions y Realtime en acción.",
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
