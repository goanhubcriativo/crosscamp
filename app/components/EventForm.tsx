"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow } from "@/lib/db";

// Paleta padrão do CrossCamp.
const CROSSCAMP_COLORS = {
  color_bg: "#0A0711",
  color_primary: "#7D39EB",
  color_accent: "#C6FF33",
  color_text: "#F3F0FB",
} as const;

// Campos de cor com explicação de onde cada uma aparece.
const COLOR_FIELDS = [
  { key: "color_bg", label: "Fundo", hint: "Cor de fundo da página do evento." },
  { key: "color_primary", label: "Primária", hint: "Botões (ex.: Comprar) e detalhes principais." },
  { key: "color_accent", label: "Destaque", hint: "Preço, links, faixa e destaques (o 'lime' da marca)." },
  { key: "color_text", label: "Texto", hint: "Cor dos textos sobre o fundo." },
] as const;

type FormState = {
  name: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  price: string;
  color_bg: string;
  color_primary: string;
  color_accent: string;
  color_text: string;
  logo: string;
  asaas_api_key: string;
  asaas_env: "sandbox" | "production";
  published: boolean;
  owner_user: string;
  owner_password: string;
};

function fromEvent(e?: EventRow): FormState {
  return {
    name: e?.name ?? "",
    slug: e?.slug ?? "",
    description: e?.description ?? "",
    event_date: e?.event_date ?? "",
    location: e?.location ?? "",
    price: e ? String(e.price) : "",
    color_bg: e?.color_bg ?? "#000000",
    color_primary: e?.color_primary ?? "#7D39EB",
    color_accent: e?.color_accent ?? "#C6FF33",
    color_text: e?.color_text ?? "#FFFFFF",
    logo: e?.logo ?? "",
    asaas_api_key: e?.asaas_api_key ?? "",
    asaas_env: e?.asaas_env ?? "sandbox",
    published: e ? Boolean(e.published) : false,
    owner_user: e?.owner_user ?? "",
    owner_password: "",
  };
}

export default function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const editing = Boolean(event);
  const [form, setForm] = useState<FormState>(fromEvent(event));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyCrossCampColors = () =>
    setForm((f) => ({ ...f, ...CROSSCAMP_COLORS }));

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) {
      setError("Logo muito grande (máx. 400KB). Use uma imagem menor.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = editing ? `/api/admin/eventos/${event!.id}` : "/api/admin/eventos";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!event) return;
    if (!confirm(`Excluir o evento "${event.name}"? Isso não apaga os pedidos já feitos.`))
      return;
    setRemoving(true);
    await fetch(`/api/admin/eventos/${event.id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <div className="card">
        <h2>Informações</h2>
        <label htmlFor="name">Nome do evento</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => {
            const v = e.target.value;
            set("name", v);
            if (!editing && !form.slug) set("slug", slugify(v));
          }}
          required
        />

        <label htmlFor="slug">Link (slug) — o evento fica em /{form.slug || "seu-evento"}</label>
        <input
          id="slug"
          value={form.slug}
          onChange={(e) => set("slug", slugify(e.target.value))}
          required
        />

        <label htmlFor="description">Descrição (opcional)</label>
        <input
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="date">Data (opcional)</label>
            <input
              id="date"
              placeholder="2026-09-20 09:00"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="price">Preço (R$)</label>
            <input
              id="price"
              inputMode="decimal"
              placeholder="80.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </div>
        </div>

        <label htmlFor="location">Local (opcional)</label>
        <input
          id="location"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Identidade visual</h2>
        <button
          type="button"
          className="btn-ghost"
          onClick={applyCrossCampColors}
          style={{ marginBottom: 4 }}
        >
          Usar cores padrão do CrossCamp
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <div key={key}>
              <label htmlFor={key}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  id={key}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  style={{ width: 44, height: 40, padding: 4 }}
                />
                <input
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <p className="muted" style={{ fontSize: "0.72rem", marginTop: 4 }}>
                {hint}
              </p>
            </div>
          ))}
        </div>

        <label htmlFor="logo">Logo do evento (PNG/SVG, máx. 400KB)</label>
        <input id="logo" type="file" accept="image/*" onChange={onLogoFile} />
        {form.logo && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 10,
              background: form.color_bg,
              textAlign: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.logo} alt="prévia do logo" style={{ maxHeight: 60 }} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Pagamento (Asaas)</h2>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
          A chave de API da conta Asaas deste evento — o dinheiro cai nessa conta.
        </p>
        <label htmlFor="asaas_api_key">Chave de API do Asaas</label>
        <input
          id="asaas_api_key"
          value={form.asaas_api_key}
          onChange={(e) => set("asaas_api_key", e.target.value)}
          placeholder="$aact_..."
        />
        <label htmlFor="asaas_env">Ambiente</label>
        <select
          id="asaas_env"
          value={form.asaas_env}
          onChange={(e) => set("asaas_env", e.target.value as "sandbox" | "production")}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card-2)",
            color: "var(--text)",
            fontSize: "1rem",
          }}
        >
          <option value="sandbox">Sandbox (testes)</option>
          <option value="production">Produção (vendas reais)</option>
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 16,
            color: "var(--text)",
          }}
        >
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            style={{ width: "auto" }}
          />
          Publicar evento (fica acessível no link público)
        </label>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Acesso do cliente</h2>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
          Crie um login para o organizador acompanhar as vendas e validar entradas
          deste evento (ele vê só este evento, sem editar nada).
        </p>
        <label htmlFor="owner_user">Usuário do cliente</label>
        <input
          id="owner_user"
          value={form.owner_user}
          onChange={(e) => set("owner_user", e.target.value)}
          placeholder="ex.: battlegames"
        />
        <label htmlFor="owner_password">
          Senha do cliente {editing && "(deixe em branco para manter a atual)"}
        </label>
        <input
          id="owner_password"
          type="text"
          value={form.owner_password}
          onChange={(e) => set("owner_password", e.target.value)}
          placeholder={editing ? "••••••••" : "defina uma senha"}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button disabled={saving} style={{ flex: 1 }}>
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar evento"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn-ghost"
            onClick={remove}
            disabled={removing}
            style={{ color: "var(--err)" }}
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
