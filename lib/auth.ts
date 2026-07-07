import crypto from "node:crypto";
import { cookies } from "next/headers";
import { config } from "./config";

const COOKIE_NAME = "cc_session";
const MAX_AGE = 60 * 60 * 12; // 12 horas

// Sessão: super-admin (plataforma) ou organizador (dono de um evento).
export type Session =
  | { role: "admin" }
  | { role: "org"; eventId: string };

function sign(value: string): string {
  return crypto
    .createHmac("sha256", config.admin.sessionSecret)
    .update(value)
    .digest("hex");
}

function payloadOf(s: Session, exp: number): string {
  return s.role === "admin" ? `admin:-:${exp}` : `org:${s.eventId}:${exp}`;
}

function makeToken(s: Session): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = payloadOf(s, exp);
  return `${payload}.${sign(payload)}`;
}

function parseToken(token: string | undefined): Session | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  const [role, eventId, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;
  if (role === "admin") return { role: "admin" };
  if (role === "org" && eventId) return { role: "org", eventId };
  return null;
}

// ---------- Credenciais ----------

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Super-admin (variáveis de ambiente).
export function checkAdminCredentials(user: string, password: string): boolean {
  return safeEqual(user, config.admin.user) && safeEqual(password, config.admin.password);
}

// Hash de senha do organizador (scrypt + salt).
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}$${hash}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const calc = crypto.scryptSync(pw, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(hash, "hex"));
}

// ---------- Sessão ----------

export async function createAdminSession(): Promise<void> {
  await setSessionCookie({ role: "admin" });
}

export async function createOrgSession(eventId: string): Promise<void> {
  await setSessionCookie({ role: "org", eventId });
}

async function setSessionCookie(s: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return parseToken(jar.get(COOKIE_NAME)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "admin";
}

// Pode acessar o painel deste evento? (super-admin sempre; organizador só o seu)
export async function canAccessEvent(eventId: string): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  return s.role === "admin" || s.eventId === eventId;
}
