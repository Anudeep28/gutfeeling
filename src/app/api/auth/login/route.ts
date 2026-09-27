import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { findUserByEmail, toPublicUser } from "@/lib/db/users";
import { ensureInitialized } from "@/lib/db/init";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Invalid email or password." } },
        { status: 401 },
      );
    }

    const token = createSession({ id: user.id, email: user.email, role: user.role });
    await setSessionCookie(token);

    return NextResponse.json({ data: { user: toPublicUser(user) } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "validation_error", message: error.issues[0]?.message || "Invalid request." } },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: { code: "login_failed", message } }, { status: 500 });
  }
}
