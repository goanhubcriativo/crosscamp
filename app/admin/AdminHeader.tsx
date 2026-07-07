"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminHeader({
  role = "admin",
  eventId,
  eventName,
}: {
  role?: "admin" | "org";
  eventId?: string;
  eventName?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="row-between" style={{ marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
      {role === "admin" ? (
        <Link href="/admin" style={{ fontWeight: 700, textDecoration: "none" }}>
          <span className="kicker">
            <span className="slashes">///</span> CROSSCAMP · ADMIN
          </span>
        </Link>
      ) : (
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <span className="kicker">
            <span className="slashes">///</span> {eventName ?? "MEU EVENTO"}
          </span>
          {eventId && (
            <span style={{ display: "flex", gap: 10 }}>
              <Link href={`/admin/eventos/${eventId}/compradores`}>Vendas</Link>
              <Link href={`/admin/eventos/${eventId}/validar`}>Validar</Link>
            </span>
          )}
        </div>
      )}
      <button className="btn-ghost" onClick={logout}>
        Sair
      </button>
    </div>
  );
}
