"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BuyForm({
  eventSlug,
  price,
}: {
  eventSlug: string;
  price: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const changeQty = (d: number) => setQty((q) => Math.min(10, Math.max(1, q + d)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventSlug, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar cobrança.");
      router.push(`/pedido/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label>Quantidade de ingressos</label>
      <div className="qty">
        <button type="button" onClick={() => changeQty(-1)} aria-label="menos">
          −
        </button>
        <span className="qty-value">{qty}</span>
        <button type="button" onClick={() => changeQty(1)} aria-label="mais">
          +
        </button>
        <span className="qty-total">Total: {brl(price * qty)}</span>
      </div>

      <label htmlFor="name">Nome completo</label>
      <input id="name" value={form.name} onChange={set("name")} required />

      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" value={form.email} onChange={set("email")} required />

      <label htmlFor="cpf">CPF</label>
      <input
        id="cpf"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={form.cpf}
        onChange={set("cpf")}
        required
      />

      <label htmlFor="phone">Celular (opcional)</label>
      <input
        id="phone"
        inputMode="numeric"
        placeholder="(11) 99999-9999"
        value={form.phone}
        onChange={set("phone")}
      />

      {error && <div className="error">{error}</div>}

      <button className="btn-block" disabled={loading}>
        {loading ? "Gerando PIX..." : `Comprar ${qty > 1 ? qty + " ingressos" : "ingresso"} · ${brl(price * qty)}`}
      </button>
    </form>
  );
}
