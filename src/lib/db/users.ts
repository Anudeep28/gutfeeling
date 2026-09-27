import { query } from "./client";

export type UserRole = "user" | "admin";

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface PublicUser {
  id: number;
  email: string;
  role: UserRole;
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const result = await query<DbUser>("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return result.rows[0] || null;
}

export async function createUser(email: string, passwordHash: string, role: UserRole = "user"): Promise<PublicUser> {
  const result = await query<PublicUser>(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
    [email.toLowerCase(), passwordHash, role],
  );
  return result.rows[0];
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const result = await query<PublicUser>(
    "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
  );
  return result.rows;
}

export function toPublicUser(user: DbUser): PublicUser {
  return { id: user.id, email: user.email, role: user.role, created_at: user.created_at };
}
