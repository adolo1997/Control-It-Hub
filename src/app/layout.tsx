import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Millán Manager",
  description: "Panel interno de Sistemas Millán.",
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
