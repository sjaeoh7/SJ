"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { quotes, workOrders, suppliers } from "@/db/schema";

export async function requestQuoteAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const workOrderId = String(formData.get("workOrderId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "");

  if (!workOrderId || !supplierId) return { error: "Select a supplier to request a quote from." };

  const wo = await db.query.workOrders.findFirst({
    where: and(eq(workOrders.id, workOrderId), eq(workOrders.orgId, session.orgId)),
  });
  if (!wo) return { error: "Work order not found." };

  const supplier = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, supplierId), eq(suppliers.orgId, session.orgId)),
  });
  if (!supplier || supplier.status !== "approved") return { error: "Supplier is not approved." };

  await db.insert(quotes).values({ workOrderId, supplierId, amount: "0", status: "requested" });

  revalidatePath(`/dashboard/work-orders/${workOrderId}`);
  return {};
}

export async function submitQuoteAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const quoteId = String(formData.get("quoteId") ?? "");
  const amount = String(formData.get("amount") ?? "").trim();
  const laborCost = String(formData.get("laborCost") ?? "").trim();
  const materialsCost = String(formData.get("materialsCost") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();

  if (!amount || Number.isNaN(Number(amount))) return { error: "Enter a valid quote amount." };

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { workOrder: true },
  });
  if (!quote || quote.workOrder.orgId !== session.orgId) return { error: "Quote not found." };

  await db
    .update(quotes)
    .set({
      amount,
      laborCost: laborCost || null,
      materialsCost: materialsCost || null,
      notes: notes || null,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      status: "submitted",
      submittedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));

  revalidatePath(`/dashboard/work-orders/${quote.workOrderId}`);
  return {};
}

export async function decideQuoteAction(
  quoteId: string,
  decision: "approved" | "rejected",
): Promise<{ error?: string }> {
  const session = await requireSession();

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { workOrder: true },
  });
  if (!quote || quote.workOrder.orgId !== session.orgId) return { error: "Quote not found." };

  await db
    .update(quotes)
    .set({ status: decision, decidedAt: new Date(), decidedById: session.userId })
    .where(eq(quotes.id, quoteId));

  if (decision === "approved") {
    await db
      .update(workOrders)
      .set({
        supplierId: quote.supplierId,
        estimatedCost: quote.amount,
        status: quote.workOrder.status === "draft" || quote.workOrder.status === "sent" ? "acknowledged" : quote.workOrder.status,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, quote.workOrderId));
  }

  revalidatePath(`/dashboard/work-orders/${quote.workOrderId}`);
  return {};
}
