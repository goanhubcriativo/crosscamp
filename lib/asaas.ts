// Wrapper mínimo da API do Asaas para cobranças PIX.
// Cada evento tem suas próprias credenciais (chave + ambiente).
// Docs: https://docs.asaas.com/

export type AsaasCreds = {
  apiKey: string;
  env: "sandbox" | "production";
};

type AsaasCustomer = { id: string };
type AsaasPayment = { id: string; status: string; invoiceUrl?: string };
type AsaasPixQr = {
  success: boolean;
  encodedImage: string; // PNG em base64 (sem prefixo data:)
  payload: string; // "copia e cola"
  expirationDate?: string;
};

function baseUrl(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

type FetchOpts = Omit<RequestInit, "body"> & { body?: unknown };

async function asaasFetch<T>(
  creds: AsaasCreds,
  path: string,
  init?: FetchOpts
): Promise<T> {
  const { body, ...rest } = init ?? {};
  const res = await fetch(`${baseUrl(creds.env)}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      access_token: creds.apiKey,
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

export async function createCustomer(
  creds: AsaasCreds,
  input: { name: string; email: string; cpfCnpj: string; mobilePhone?: string }
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(creds, "/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.mobilePhone,
    },
  });
}

export async function createPixPayment(
  creds: AsaasCreds,
  input: {
    customerId: string;
    value: number;
    description: string;
    externalReference: string;
  }
): Promise<AsaasPayment> {
  const today = new Date().toISOString().slice(0, 10);
  return asaasFetch<AsaasPayment>(creds, "/payments", {
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

export async function getPixQrCode(
  creds: AsaasCreds,
  paymentId: string
): Promise<AsaasPixQr> {
  return asaasFetch<AsaasPixQr>(creds, `/payments/${paymentId}/pixQrCode`, {
    method: "GET",
  });
}

export async function getPayment(
  creds: AsaasCreds,
  paymentId: string
): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(creds, `/payments/${paymentId}`, {
    method: "GET",
  });
}

export function isPaidStatus(status: string): boolean {
  return (
    status === "RECEIVED" ||
    status === "CONFIRMED" ||
    status === "RECEIVED_IN_CASH"
  );
}
