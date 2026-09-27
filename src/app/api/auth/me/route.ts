import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { countSuccessfulSearchesToday } from "@/lib/db/searches";
import { ensureInitialized } from "@/lib/db/init";

const DAILY_SEARCH_LIMIT = 15;

export async function GET() {
  try {
    await ensureInitialized();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Not authenticated." } }, { status: 401 });
    }
    const used = await countSuccessfulSearchesToday(session.id);
    return NextResponse.json({
      data: {
        user: session,
        remaining: Math.max(0, DAILY_SEARCH_LIMIT - used),
        limit: DAILY_SEARCH_LIMIT,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session.";
    return NextResponse.json({ error: { code: "session_error", message } }, { status: 500 });
  }
}
