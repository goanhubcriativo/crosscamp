"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminHeader() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="row-between" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <Link href="/admin">Compradores</Link>
        <Link href="/admin/validar">Validar entrada</Link>
      </div>
      <button className="btn-ghost" onClick={logout}>
        Sair
      </button>
    </div>
  );
}
