import { z } from "zod";

const chemicalQuerySchema = z.object({
  chemical: z.string().trim().min(1, "Enter a food or chemical name.").max(120, "Food or chemical name is too long."),
  nutrient: z.string().trim().min(1).max(120).optional(),
  direct: z.boolean().optional(),
});

export function parseChemicalQuery(input: unknown) {
  return chemicalQuerySchema.parse(input);
}

const reportSectionSchema = z.object({
  heading: z.string(),
  summary: z.string(),
  details: z.array(z.string()),
  citations: z.array(z.string()),
});

const reactionEntrySchema = z.object({
  summary: z.string(),
  reactants: z.array(z.string()),
  products: z.array(z.string()),
  enzymes: z.array(z.string()).optional(),
  citations: z.array(z.string()),
});

export const chemicalReportSchema = z.object({
  title: z.string(),
  plainLanguageSummary: z.string(),
  evidenceVerdict: z.enum(["well-established", "moderate", "limited", "conflicting"]),
  intakeTimeline: z.array(reportSectionSchema),
  shortTermEffects: reportSectionSchema,
  longTermEffects: reportSectionSchema,
  reactions: z.array(reactionEntrySchema),
  sections: z.array(reportSectionSchema),
  keyUncertainties: z.array(z.string()),
  practicalContext: z.array(z.string()),
  disclaimer: z.string(),
});
