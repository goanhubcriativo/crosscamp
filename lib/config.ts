// Configuração central lida das variáveis de ambiente.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export const config = {
  event: {
    name: process.env.EVENT_NAME ?? "Meu Evento",
    description: process.env.EVENT_DESCRIPTION ?? "",
    date: process.env.EVENT_DATE ?? "",
    location: process.env.EVENT_LOCATION ?? "",
    // Preço em reais (número). Ex.: 50.00
    price: Number(process.env.EVENT_PRICE ?? "0"),
  },
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  db: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
  asaas: {
    env: (process.env.ASAAS_ENV ?? "sandbox") as "sandbox" | "production",
    apiKey: process.env.ASAAS_API_KEY ?? "",
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
    get baseUrl() {
      return this.env === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";
    },
  },
  admin: {
    user: process.env.ADMIN_USER ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-insecure-secret",
  },
};

export function assertServerConfig() {
  required("ASAAS_API_KEY");
  required("ADMIN_PASSWORD");
  required("SESSION_SECRET");
  if (!config.event.price || config.event.price <= 0) {
    throw new Error("EVENT_PRICE inválido");
  }
}

// Formata número em BRL.
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
