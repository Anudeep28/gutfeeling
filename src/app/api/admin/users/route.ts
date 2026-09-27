import { NextResponse } from "next/server";
import { ensureInitialized } from "@/lib/db/init";
import { getAllUsers, PublicUser } from "@/lib/db/users";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    await ensureInitialized();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: { code: "forbidden", message: "Admin access required." } }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json({ data: { users } satisfies { users: PublicUser[] } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users.";
    return NextResponse.json({ error: { code: "admin_error", message } }, { status: 500 });
  }
}
