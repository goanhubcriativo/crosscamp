import type { EventInput } from "./db";

// Slugs que não podem ser usados por eventos (colidem com rotas do sistema).
const RESERVED = new Set([
  "admin",
  "api",
  "pedido",
  "ingresso",
  "_next",
  "favicon.ico",
]);

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Valida e monta um EventInput a partir do corpo da requisição.
// Retorna { ok: true, value } ou { ok: false, error }.
export function parseEventInput(
  body: Record<string, unknown>
):
  | { ok: true; value: EventInput; ownerUser: string | null; ownerPassword: string | null }
  | { ok: false; error: string } {
  const slug = normalizeSlug(String(body.slug ?? ""));
  const name = String(body.name ?? "").trim();
  const price = Number(body.price);
  const ownerUser = String(body.owner_user ?? "").trim() || null;
  const ownerPassword = String(body.owner_password ?? "").trim() || null;

  if (!name) return { ok: false, error: "Informe o nome do evento." };
  if (!slug) return { ok: false, error: "Informe um link (slug) válido." };
  if (RESERVED.has(slug)) return { ok: false, error: `O link "${slug}" é reservado.` };
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Preço inválido." };
  }

  const hex = (v: unknown, fallback: string) => {
    const s = String(v ?? "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
  };

  const env = String(body.asaas_env ?? "sandbox") === "production"
    ? "production"
    : "sandbox";

  return {
    ok: true,
    ownerUser,
    ownerPassword,
    value: {
      slug,
      name,
      description: (String(body.description ?? "").trim() || null),
      event_date: (String(body.event_date ?? "").trim() || null),
      location: (String(body.location ?? "").trim() || null),
      price,
      color_bg: hex(body.color_bg, "#000000"),
      color_primary: hex(body.color_primary, "#7D39EB"),
      color_accent: hex(body.color_accent, "#C6FF33"),
      color_text: hex(body.color_text, "#FFFFFF"),
      logo: (String(body.logo ?? "").trim() || null),
      asaas_api_key: (String(body.asaas_api_key ?? "").trim() || null),
      asaas_env: env,
      published: Boolean(body.published),
      owner_user: ownerUser,
    },
  };
}
