import crypto from "node:crypto";
import { cookies } from "next/headers";
import { config } from "./config";

const COOKIE_NAME = "gestor_session";
const MAX_AGE = 60 * 60 * 8; // 8 horas

function sign(value: string): string {
  return crypto
    .createHmac("sha256", config.admin.sessionSecret)
    .update(value)
    .digest("hex");
}

// Constrói o valor assinado do cookie de sessão.
function makeToken(): string {
  const payload = `admin:${Date.now() + MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  const [, expStr] = payload.split(":");
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() < exp;
}

// Compara credenciais de forma resistente a timing.
export function checkCredentials(user: string, password: string): boolean {
  const uOk = safeEqual(user, config.admin.user);
  const pOk = safeEqual(password, config.admin.password);
  return uOk && pOk;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(), {
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

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME, verifyToken };
