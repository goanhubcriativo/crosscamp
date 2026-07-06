import { config } from "./config";

// Wrapper mínimo da API do Asaas para cobranças PIX.
// Docs: https://docs.asaas.com/

type AsaasCustomer = { id: string };
type AsaasPayment = { id: string; status: string; invoiceUrl?: string };
type AsaasPixQr = {
  success: boolean;
  encodedImage: string; // PNG em base64 (sem prefixo data:)
  payload: string; // "copia e cola"
  expirationDate?: string;
};

type FetchOpts = Omit<RequestInit, "body"> & { body?: unknown };

async function asaasFetch<T>(path: string, init?: FetchOpts): Promise<T> {
  const { body, ...rest } = init ?? {};
  const res = await fetch(`${config.asaas.baseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      access_token: config.asaas.apiKey,
      ...(rest.headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg =
      data?.errors?.map((e: { description: string }) => e.description).join("; ") ??
      `Erro Asaas ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone,
    },
  });
}

export async function createPixPayment(input: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}): Promise<AsaasPayment> {
  // dueDate = hoje (a cobrança PIX pode ser paga na hora)
  const today = new Date().toISOString().slice(0, 10);
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: "PIX",
      value: input.value,
      dueDate: today,
      description: input.description,
      externalReference: input.externalReference,
    },
  });
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQr> {
  return asaasFetch<AsaasPixQr>(`/payments/${paymentId}/pixQrCode`, {
    method: "GET",
  });
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`, { method: "GET" });
}

// Status do Asaas que significam "pago".
export function isPaidStatus(status: string): boolean {
  return status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH";
}
