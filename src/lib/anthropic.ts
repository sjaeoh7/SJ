import "server-only";
import Anthropic from "@anthropic-ai/sdk";

declare global {
  var __anthropicClient: Anthropic | undefined;
}

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!global.__anthropicClient) {
    global.__anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return global.__anthropicClient;
}

// Claude Opus 4.8 by default — most capable, best for turning a free-text
// tenant/tenant-facing description into an accurate trade category + urgency
// call (mis-routing a ticket sends the wrong trade on a truck roll).
// Set ANTHROPIC_DIAGNOSIS_MODEL=claude-haiku-4-5 in .env to trade accuracy
// for lower per-ticket cost on high-volume portfolios.
export const DIAGNOSIS_MODEL = process.env.ANTHROPIC_DIAGNOSIS_MODEL || "claude-opus-4-8";
