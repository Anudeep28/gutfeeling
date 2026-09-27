import { NextResponse } from "next/server";
import { ensureInitialized } from "@/lib/db/init";
import { getAllSearches, getSearchesByUser } from "@/lib/db/searches";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    await ensureInitialized();
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: { code: "forbidden", message: "Admin access required." } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const searches = userId ? await getSearchesByUser(Number(userId)) : await getAllSearches();
    return NextResponse.json({ data: { searches } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load searches.";
    return NextResponse.json({ error: { code: "admin_error", message } }, { status: 500 });
  }
}
