import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Control IT Hub",
  description: "Plataforma multiempresa para control operativo IT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
