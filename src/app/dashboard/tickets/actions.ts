"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets, ticketDiagnoses, properties, PRIORITIES } from "@/db/schema";
import { diagnoseTicket, DiagnosisNotConfiguredError } from "@/lib/diagnosis";

export async function createTicketAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");

  if (!propertyId || !title || !description) {
    return { error: "Property, title, and description are required." };
  }
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
    return { error: "Invalid priority." };
  }

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) {
    return { error: "Property not found." };
  }

  const [ticket] = await db
    .insert(tickets)
    .values({
      orgId: session.orgId,
      propertyId,
      title,
      description,
      priority: priority as (typeof PRIORITIES)[number],
      createdById: session.userId,
    })
    .returning();

  revalidatePath("/dashboard/tickets");
  redirect(`/dashboard/tickets/${ticket.id}`);
}

export async function runDiagnosisAction(ticketId: string): Promise<{ error?: string }> {
  const session = await requireSession();

  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)),
    with: { property: true },
  });
  if (!ticket) return { error: "Ticket not found." };

  try {
    const result = await diagnoseTicket({
      title: ticket.title,
      description: ticket.description,
      propertyType: ticket.property.type,
    });

    await db.insert(ticketDiagnoses).values({
      ticketId: ticket.id,
      category: result.category,
      urgency: result.urgency,
      suggestedTrade: result.suggestedTrade,
      summary: result.summary,
      recommendedNextSteps: result.recommendedNextSteps,
      confidence: result.confidence,
      model: process.env.ANTHROPIC_DIAGNOSIS_MODEL || "claude-opus-4-8",
    });

    await db
      .update(tickets)
      .set({ category: result.category, priority: result.urgency, status: "diagnosed", updatedAt: new Date() })
      .where(eq(tickets.id, ticket.id));
  } catch (err) {
    if (err instanceof DiagnosisNotConfiguredError) {
      return { error: err.message };
    }
    console.error("Ticket diagnosis failed", err);
    return { error: "Diagnosis failed. Please try again in a moment." };
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return {};
}

export async function cancelTicketAction(ticketId: string): Promise<void> {
  const session = await requireSession();
  await db
    .update(tickets)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)));
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}
