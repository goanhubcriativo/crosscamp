import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

// Display pesada (títulos gigantes), sans moderna (corpo) e mono (etiquetas).
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CrossCamp",
  description: "Sistema de gestão de campeonatos.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CrossCamp",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0711",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${grotesk.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
