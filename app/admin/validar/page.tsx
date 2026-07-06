import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import AdminHeader from "../AdminHeader";
import Validator from "./Validator";

export const dynamic = "force-dynamic";

export default async function ValidarPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <div className="container">
      <AdminHeader />
      <h1>Validar entrada</h1>
      <p className="muted">
        Escaneie o QR do ingresso ou cole o código/link para registrar a entrada.
      </p>
      <Validator />
    </div>
  );
}
