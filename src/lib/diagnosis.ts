import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, DIAGNOSIS_MODEL } from "@/lib/anthropic";
import { TRADE_CATEGORIES, PRIORITIES } from "@/db/schema";

const DiagnosisSchema = z.object({
  category: z.enum(TRADE_CATEGORIES).describe("Best-matching trade/vendor category for this issue."),
  urgency: z.enum(PRIORITIES).describe(
    "How urgently this needs attention. 'emergency' = safety, security, or property-damage risk requiring same-day dispatch.",
  ),
  suggestedTrade: z
    .string()
    .describe("Short human-readable label for the type of vendor to dispatch, e.g. 'Licensed plumber'."),
  summary: z.string().describe("One or two sentence plain-language summary of the likely issue."),
  recommendedNextSteps: z
    .string()
    .describe("Concrete next steps for the property manager, including any immediate safety actions."),
  confidence: z.number().min(0).max(1).describe("Model's confidence in this categorization, 0 to 1."),
});

export type TicketDiagnosisResult = z.infer<typeof DiagnosisSchema>;

export class DiagnosisNotConfiguredError extends Error {
  constructor() {
    super("AI diagnosis is not configured (missing ANTHROPIC_API_KEY).");
    this.name = "DiagnosisNotConfiguredError";
  }
}

export async function diagnoseTicket(input: {
  title: string;
  description: string;
  propertyType: string;
}): Promise<TicketDiagnosisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new DiagnosisNotConfiguredError();
  }

  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: DIAGNOSIS_MODEL,
    max_tokens: 1024,
    // Balanced effort: this is a structured classification call, not an
    // open-ended agentic task, so we don't need the highest reasoning depth.
    output_config: { effort: "medium", format: zodOutputFormat(DiagnosisSchema) },
    system:
      "You are a triage assistant for a facilities maintenance platform used by small " +
      "residential, retail, and commercial properties that have no on-site facilities " +
      "manager. Given a maintenance ticket description, classify the issue so it can be " +
      "routed to the correct preapproved supplier automatically. Err on the side of a " +
      "higher urgency when there is any indication of water leaks, gas smell, electrical " +
      "sparking/burning smell, no heat in cold weather, security/lock failures, or " +
      "structural hazards.",
    messages: [
      {
        role: "user",
        content:
          `Property type: ${input.propertyType}\n` +
          `Ticket title: ${input.title}\n` +
          `Ticket description: ${input.description}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Model did not return a parseable diagnosis.");
  }
  return response.parsed_output;
}
