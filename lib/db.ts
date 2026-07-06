import { createClient, type Client } from "@libsql/client";
import { config, brand } from "./config";

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

// Cria as tabelas se ainda não existirem. Idempotente.
let _inited = false;
export async function initDb(): Promise<void> {
  if (_inited) return;
  await db().execute(`
    CREATE TABLE IF NOT EXISTS events (
      id              TEXT PRIMARY KEY,
      slug            TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      description     TEXT,
      event_date      TEXT,
      location        TEXT,
      price           REAL NOT NULL,
      color_bg        TEXT NOT NULL DEFAULT '#000000',
      color_primary   TEXT NOT NULL DEFAULT '#7D39EB',
      color_accent    TEXT NOT NULL DEFAULT '#C6FF33',
      color_text      TEXT NOT NULL DEFAULT '#FFFFFF',
      logo            TEXT,
      asaas_api_key   TEXT,
      asaas_env       TEXT NOT NULL DEFAULT 'sandbox',
      published       INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL
    );
  `);
  await db().execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id                TEXT PRIMARY KEY,
      event_id          TEXT NOT NULL,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      phone             TEXT,
      cpf               TEXT NOT NULL,
      amount            REAL NOT NULL,
      status            TEXT NOT NULL DEFAULT 'PENDING',
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
  await db().execute(
    `CREATE INDEX IF NOT EXISTS idx_orders_event ON orders (event_id);`
  );
  _inited = true;
}

// ---------- Tipos ----------

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  price: number;
  color_bg: string;
  color_primary: string;
  color_accent: string;
  color_text: string;
  logo: string | null;
  asaas_api_key: string | null;
  asaas_env: "sandbox" | "production";
  published: number;
  created_at: string;
};

export type Order = {
  id: string;
  event_id: string;
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

function cast<T>(row: Record<string, unknown>): T {
  return row as unknown as T;
}

// ---------- Eventos ----------

export type EventInput = {
  slug: string;
  name: string;
  description?: string | null;
  event_date?: string | null;
  location?: string | null;
  price: number;
  color_bg?: string;
  color_primary?: string;
  color_accent?: string;
  color_text?: string;
  logo?: string | null;
  asaas_api_key?: string | null;
  asaas_env?: "sandbox" | "production";
  published?: boolean;
};

export async function createEvent(id: string, e: EventInput): Promise<void> {
  await db().execute({
    sql: `INSERT INTO events
            (id, slug, name, description, event_date, location, price,
             color_bg, color_primary, color_accent, color_text, logo,
             asaas_api_key, asaas_env, published, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      e.slug,
      e.name,
      e.description ?? null,
      e.event_date ?? null,
      e.location ?? null,
      e.price,
      e.color_bg ?? brand.black,
      e.color_primary ?? brand.violet,
      e.color_accent ?? brand.lime,
      e.color_text ?? brand.white,
      e.logo ?? null,
      e.asaas_api_key ?? null,
      e.asaas_env ?? "sandbox",
      e.published ? 1 : 0,
      new Date().toISOString(),
    ],
  });
}

export async function updateEvent(id: string, e: EventInput): Promise<void> {
  await db().execute({
    sql: `UPDATE events SET
            slug = ?, name = ?, description = ?, event_date = ?, location = ?,
            price = ?, color_bg = ?, color_primary = ?, color_accent = ?,
            color_text = ?, logo = ?, asaas_api_key = ?, asaas_env = ?, published = ?
          WHERE id = ?`,
    args: [
      e.slug,
      e.name,
      e.description ?? null,
      e.event_date ?? null,
      e.location ?? null,
      e.price,
      e.color_bg ?? brand.black,
      e.color_primary ?? brand.violet,
      e.color_accent ?? brand.lime,
      e.color_text ?? brand.white,
      e.logo ?? null,
      e.asaas_api_key ?? null,
      e.asaas_env ?? "sandbox",
      e.published ? 1 : 0,
      id,
    ],
  });
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const r = await db().execute({
    sql: "SELECT * FROM events WHERE slug = ?",
    args: [slug],
  });
  return r.rows.length ? cast<EventRow>(r.rows[0] as Record<string, unknown>) : null;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const r = await db().execute({
    sql: "SELECT * FROM events WHERE id = ?",
    args: [id],
  });
  return r.rows.length ? cast<EventRow>(r.rows[0] as Record<string, unknown>) : null;
}

export async function listEvents(): Promise<EventRow[]> {
  const r = await db().execute("SELECT * FROM events ORDER BY created_at DESC");
  return r.rows.map((row) => cast<EventRow>(row as Record<string, unknown>));
}

export async function deleteEvent(id: string): Promise<void> {
  await db().execute({ sql: "DELETE FROM events WHERE id = ?", args: [id] });
}

// Estatísticas de um evento (pedidos pagos, entradas, arrecadação).
export async function eventStats(eventId: string): Promise<{
  total: number;
  paid: number;
  checkedIn: number;
  revenue: number;
}> {
  const r = await db().execute({
    sql: `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='PAID' THEN 1 ELSE 0 END) AS paid,
            SUM(CASE WHEN status='PAID' AND checked_in=1 THEN 1 ELSE 0 END) AS checkedIn,
            SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) AS revenue
          FROM orders WHERE event_id = ?`,
    args: [eventId],
  });
  const row = r.rows[0] as Record<string, unknown>;
  return {
    total: Number(row.total ?? 0),
    paid: Number(row.paid ?? 0),
    checkedIn: Number(row.checkedIn ?? 0),
    revenue: Number(row.revenue ?? 0),
  };
}

// ---------- Pedidos ----------

export async function getOrder(id: string): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id],
  });
  return r.rows.length ? cast<Order>(r.rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByPaymentId(paymentId: string): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE asaas_payment_id = ?",
    args: [paymentId],
  });
  return r.rows.length ? cast<Order>(r.rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE ticket_token = ?",
    args: [token],
  });
  return r.rows.length ? cast<Order>(r.rows[0] as Record<string, unknown>) : null;
}

export async function listOrdersByEvent(eventId: string): Promise<Order[]> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE event_id = ? ORDER BY created_at DESC",
    args: [eventId],
  });
  return r.rows.map((row) => cast<Order>(row as Record<string, unknown>));
}
