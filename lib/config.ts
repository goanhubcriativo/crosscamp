// Configuração da PLATAFORMA (CrossCamp). Dados de cada evento ficam no banco.

export const config = {
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  db: {
    // Aceita os nomes padrão e também os injetados pela integração Turso do Vercel.
    url:
      process.env.DATABASE_URL ??
      process.env.TURSO_DATABASE_URL ??
      "file:local.db",
    authToken:
      process.env.DATABASE_AUTH_TOKEN ||
      process.env.TURSO_AUTH_TOKEN ||
      undefined,
  },
  // Token compartilhado dos webhooks do Asaas (o mesmo em todas as contas/eventos).
  asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
  admin: {
    user: process.env.ADMIN_USER ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-insecure-secret",
  },
};

// Identidade CrossCamp (usada na raiz "em breve" e como padrão de eventos novos).
export const brand = {
  black: "#000000",
  violet: "#7D39EB",
  lime: "#C6FF33",
  white: "#FFFFFF",
};

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
