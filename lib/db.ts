import { createClient, type Client } from "@libsql/client";
import { config } from "./config";

let _client: Client | null = null;

export function db(): Client {
  if (!_client) {
    _client = createClient({
      url: config.db.url,
      authToken: config.db.authToken,
    });
  }
  return _client;
}

// Cria a tabela se ainda não existir. Idempotente.
export async function initDb(): Promise<void> {
  await db().execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id                TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      phone             TEXT,
      cpf               TEXT NOT NULL,
      amount            REAL NOT NULL,
      status            TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | PAID | CANCELLED
      asaas_customer_id TEXT,
      asaas_payment_id  TEXT,
      pix_payload       TEXT,
      pix_qr_image      TEXT,
      ticket_token      TEXT UNIQUE,
      checked_in        INTEGER NOT NULL DEFAULT 0,
      checked_in_at     TEXT,
      created_at        TEXT NOT NULL,
      paid_at           TEXT
    );
  `);
  await db().execute(
    `CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders (asaas_payment_id);`
  );
}

export type Order = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  asaas_customer_id: string | null;
  asaas_payment_id: string | null;
  pix_payload: string | null;
  pix_qr_image: string | null;
  ticket_token: string | null;
  checked_in: number;
  checked_in_at: string | null;
  created_at: string;
  paid_at: string | null;
};

function rowToOrder(row: Record<string, unknown>): Order {
  return row as unknown as Order;
}

export async function getOrder(id: string): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id],
  });
  return r.rows.length ? rowToOrder(r.rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByPaymentId(
  paymentId: string
): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE asaas_payment_id = ?",
    args: [paymentId],
  });
  return r.rows.length ? rowToOrder(r.rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE ticket_token = ?",
    args: [token],
  });
  return r.rows.length ? rowToOrder(r.rows[0] as Record<string, unknown>) : null;
}

export async function listOrders(): Promise<Order[]> {
  const r = await db().execute("SELECT * FROM orders ORDER BY created_at DESC");
  return r.rows.map((row) => rowToOrder(row as Record<string, unknown>));
}
