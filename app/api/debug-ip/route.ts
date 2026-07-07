import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "gru1";

// TEMPORÁRIO: mostra o IP de saída do servidor e o país, para diagnosticar o
// bloqueio "IP não autorizado" do Asaas. Remover depois.
export async function GET() {
  let ip = "";
  let geo: Record<string, unknown> = {};
  try {
    ip = (await (await fetch("https://api.ipify.org?format=json", { cache: "no-store" })).json()).ip;
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
  try {
    geo = await (await fetch(`https://ipapi.co/${ip}/json/`, { cache: "no-store" })).json();
  } catch {
    /* ignora */
  }
  return NextResponse.json({
    ip,
    country: geo.country_name ?? geo.country,
    region: geo.region,
    city: geo.city,
    org: geo.org,
  });
}
