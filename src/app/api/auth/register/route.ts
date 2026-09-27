import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { ensureInitialized } from "@/lib/db/init";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: { code: "conflict", message: "An account with this email already exists." } },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, "user");
    const token = createSession({ id: user.id, email: user.email, role: user.role });
    await setSessionCookie(token);

    return NextResponse.json({ data: { user } }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "validation_error", message: error.issues[0]?.message || "Invalid request." } },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: { code: "registration_failed", message } }, { status: 500 });
  }
}
