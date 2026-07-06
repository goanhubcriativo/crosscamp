import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { db, initDb } from "@/lib/db";
import { newId } from "@/lib/ticket";
import {
  createCustomer,
  createPixPayment,
  getPixQrCode,
} from "@/lib/asaas";

export const runtime = "nodejs";

// Remove tudo que não for dígito.
const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Validação simples de CPF (11 dígitos + dígitos verificadores).
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
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = onlyDigits(String(body.phone ?? ""));
    const cpf = onlyDigits(String(body.cpf ?? ""));

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    const orderId = newId();

    // 1) Cliente no Asaas
    const customer = await createCustomer({
      name,
      email,
      cpfCnpj: cpf,
      mobilePhone: phone || undefined,
    });

    // 2) Cobrança PIX
    const payment = await createPixPayment({
      customerId: customer.id,
      value: config.event.price,
      description: `Ingresso - ${config.event.name}`,
      externalReference: orderId,
    });

    // 3) QR + copia e cola
    const qr = await getPixQrCode(payment.id);

    // 4) Persistir pedido PENDING
    const now = new Date().toISOString();
    await db().execute({
      sql: `INSERT INTO orders
              (id, name, email, phone, cpf, amount, status,
               asaas_customer_id, asaas_payment_id, pix_payload, pix_qr_image, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
      args: [
        orderId,
        name,
        email,
        phone || null,
        cpf,
        config.event.price,
        customer.id,
        payment.id,
        qr.payload,
        qr.encodedImage,
        now,
      ],
    });

    return NextResponse.json({ orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar.";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
