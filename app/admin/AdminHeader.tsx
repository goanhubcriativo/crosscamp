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
    <div className="row-between" style={{ marginBottom: 24 }}>
      <Link href="/admin" style={{ fontWeight: 700, textDecoration: "none" }}>
        CrossCamp · Admin
      </Link>
      <button className="btn-ghost" onClick={logout}>
        Sair
      </button>
    </div>
  );
}
