import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { UserRole } from "@/lib/db/users";

const SESSION_COOKIE = "session";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
}

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface SessionPayload extends SessionUser {
  exp: number;
  iat: number;
}

export function createSession(user: SessionUser): string {
  const secret = getJwtSecret();
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, {
    expiresIn: "7d",
    issuer: "molecular-table",
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret, { issuer: "molecular-table" }) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}
