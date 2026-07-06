"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyForm({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventSlug }),
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
        {loading ? "Gerando PIX..." : "Comprar com PIX"}
      </button>
    </form>
  );
}
