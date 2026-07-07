import type { MetadataRoute } from "next";

// Manifesto PWA — permite "Adicionar à tela de início" e abrir como app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrossCamp",
    short_name: "CrossCamp",
    description: "Gestão de campeonatos — venda e validação de ingressos.",
    start_url: "/admin/login",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0711",
    theme_color: "#0a0711",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
