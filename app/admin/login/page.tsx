import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  return (
    <div className="container">
      <div className="card">
        <h1>CrossCamp · Admin</h1>
        <p className="muted">Entre para gerenciar seus eventos.</p>
        <LoginForm />
      </div>
    </div>
  );
}
