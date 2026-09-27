import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateReport } from "@/lib/research/deepseek";
import { parseChemicalQuery } from "@/lib/research/schema";
import { gatherEvidence } from "@/lib/research/sources";
import { discoverUsdaFood, getUsdaDiscoverySource } from "@/lib/research/usda";
import { ensureInitialized } from "@/lib/db/init";
import { getSession } from "@/lib/auth/session";
import { countSuccessfulSearchesToday, recordSearch } from "@/lib/db/searches";

const DAILY_SEARCH_LIMIT = 15;

export async function POST(request: Request) {
  let userId: number | null = null;
  let query: string | null = null;
  let nutrient: string | undefined;

  try {
    await ensureInitialized();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Sign in to run a search." } }, { status: 401 });
    }
    userId = session.id;

    const body = await request.json();
    const parsed = parseChemicalQuery(body);
    query = parsed.chemical;
    nutrient = parsed.nutrient;

    const food = await discoverUsdaFood(parsed.chemical);
    if (food && !nutrient && !parsed.direct) {
      return NextResponse.json({ data: { selection: food } });
    }

    const todayCount = await countSuccessfulSearchesToday(userId);
    if (todayCount >= DAILY_SEARCH_LIMIT) {
      return NextResponse.json(
        { error: { code: "daily_limit_exceeded", message: `You have reached your limit of ${DAILY_SEARCH_LIMIT} searches today.` } },
        { status: 429 },
      );
    }

    let evidence;
    if (food && nutrient) {
      const selected = food.nutrients.find((item) => item.name.toLowerCase() === nutrient!.toLowerCase());
      if (!selected) {
        return NextResponse.json(
          { error: { code: "validation_error", message: "Select a nutrient returned by USDA." } },
          { status: 422 },
        );
      }
      evidence = await gatherEvidence(selected.name.split(",")[0], getUsdaDiscoverySource(food), parsed.chemical);
    } else {
      evidence = await gatherEvidence(parsed.chemical);
    }

    const report = await generateReport(evidence);
    await recordSearch({
      userId,
      query: query || parsed.chemical,
      nutrient,
      status: "success",
      sourceCount: evidence.sources.length,
    });

    return NextResponse.json({ data: { evidence, report } });
  } catch (error) {
    if (userId && query) {
      const message = error instanceof Error ? error.message : "Report generation failed.";
      await recordSearch({
        userId,
        query,
        nutrient,
        status: "failed",
        sourceCount: 0,
        errorMessage: message,
      });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "validation_error", message: error.issues[0]?.message || "Invalid request." } },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Report generation failed.";
    const status = message.includes("not found") ? 404 : message.includes("not configured") ? 503 : 502;
    return NextResponse.json({ error: { code: "research_failed", message } }, { status });
  }
}
