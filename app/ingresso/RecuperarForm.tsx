"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecuperarForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cpf }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não encontrado.");
      router.push(`/ingresso/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">E-mail usado na compra</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <label htmlFor="cpf">CPF usado na compra</label>
      <input
        id="cpf"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        required
      />

      {error && <div className="error">{error}</div>}

      <button className="btn-block" disabled={loading}>
        {loading ? "Buscando..." : "Recuperar meu ingresso"}
      </button>
    </form>
  );
}
