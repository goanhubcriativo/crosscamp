import { NextRequest, NextResponse } from "next/server";
import { initDb, getEventBySlug, insertOrder } from "@/lib/db";
import { newId } from "@/lib/ticket";
import { createCustomer, createPixPayment, getPixQrCode } from "@/lib/asaas";

export const runtime = "nodejs";
// Executa em São Paulo para que as chamadas ao Asaas saiam de um IP brasileiro.
export const preferredRegion = "gru1";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

function isValidCpf(cpf: string): boolean {
  cpf = onlyDigits(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (const d of base) sum += Number(d) * factor--;
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = await req.json();
    const eventSlug = String(body.eventSlug ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = onlyDigits(String(body.phone ?? ""));
    const cpf = onlyDigits(String(body.cpf ?? ""));
    // Quantidade de ingressos (1 a 10).
    const quantity = Math.min(10, Math.max(1, Math.floor(Number(body.quantity) || 1)));

    const event = eventSlug ? await getEventBySlug(eventSlug) : null;
    if (!event || !event.published) {
      return NextResponse.json({ error: "Evento indisponível." }, { status: 404 });
    }
    if (!event.asaas_api_key) {
      return NextResponse.json(
        { error: "Este evento ainda não está com o pagamento configurado." },
        { status: 400 }
      );
    }
    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    const creds = { apiKey: event.asaas_api_key, env: event.asaas_env };
    const orderId = newId();
    const amount = Math.round(event.price * quantity * 100) / 100;

    const customer = await createCustomer(creds, {
      name,
      email,
      cpfCnpj: cpf,
      mobilePhone: phone || undefined,
    });

    const payment = await createPixPayment(creds, {
      customerId: customer.id,
      value: amount,
      description:
        quantity > 1
          ? `${quantity}x Ingresso - ${event.name}`
          : `Ingresso - ${event.name}`,
      externalReference: orderId,
    });

    const qr = await getPixQrCode(creds, payment.id);

    await insertOrder({
      id: orderId,
      event_id: event.id,
      name,
      email,
      phone: phone || null,
      cpf,
      amount,
      quantity,
      asaas_customer_id: customer.id,
      asaas_payment_id: payment.id,
      pix_payload: qr.payload,
      pix_qr_image: qr.encodedImage,
    });

    return NextResponse.json({ orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar.";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
