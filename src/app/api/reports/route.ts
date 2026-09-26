import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateReport } from "@/lib/research/deepseek";
import { parseChemicalQuery } from "@/lib/research/schema";
import { gatherEvidence } from "@/lib/research/sources";
import { discoverUsdaFood, getUsdaDiscoverySource } from "@/lib/research/usda";

export async function POST(request: Request) {
  try {
    const { chemical, nutrient, direct } = parseChemicalQuery(await request.json());
    const food = await discoverUsdaFood(chemical);
    if (food && !nutrient && !direct) return NextResponse.json({ data: { selection: food } });

    if (food && nutrient) {
      const selected = food.nutrients.find((item) => item.name.toLowerCase() === nutrient.toLowerCase());
      if (!selected) return NextResponse.json({ error: { code: "validation_error", message: "Select a nutrient returned by USDA." } }, { status: 422 });
      const evidence = await gatherEvidence(selected.name.split(",")[0], getUsdaDiscoverySource(food), chemical);
      const report = await generateReport(evidence);
      return NextResponse.json({ data: { evidence, report } });
    }

    const evidence = await gatherEvidence(chemical);
    const report = await generateReport(evidence);
    return NextResponse.json({ data: { evidence, report } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: { code: "validation_error", message: error.issues[0]?.message || "Invalid request." } }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Report generation failed.";
    const status = message.includes("not found") ? 404 : message.includes("not configured") ? 503 : 502;
    return NextResponse.json({ error: { code: "research_failed", message } }, { status });
  }
}
