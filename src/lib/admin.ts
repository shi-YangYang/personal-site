import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = sha256(password);
  const b = sha256(expected);
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function sessionValue(): string {
  return sha256(`${process.env.ADMIN_PASSWORD}:${process.env.ADMIN_SESSION_SALT ?? "personal-site"}`);
}

export function createSession() {
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  return { value: sessionValue(), expires };
}

export async function hasValidSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = Buffer.from(sessionValue(), "hex");
  const actual = Buffer.from(token, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function sessionCookieName(): string {
  return COOKIE_NAME;
}
