import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrossCamp",
  description: "Plataforma de venda de ingressos para eventos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
