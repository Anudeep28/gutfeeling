import { hashPassword } from "./password";
import { query } from "@/lib/db/client";

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existing.rows.length > 0) return;

  const passwordHash = await hashPassword(password);
  await query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')",
    [email.toLowerCase(), passwordHash],
  );
}
