import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authUsers } from "@/db/schema";

const SESSION_COOKIE = "auditx-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function getSecret(): string {
  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error("AUTH_SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  }
  return SESSION_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [userId, expiresAt, signature] = token.split(".");
  if (!userId || !expiresAt || !signature) return null;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;
  if (!safeEqual(signature, sign(`${userId}.${expiresAt}`))) return null;

  const [user] = await db
    .select({ id: authUsers.id, email: authUsers.email })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);
  return user ?? null;
}

export async function createSession(user: { id: string }): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `${user.id}.${expiresAt}.${sign(`${user.id}.${expiresAt}`)}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
