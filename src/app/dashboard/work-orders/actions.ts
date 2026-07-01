"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import {
  workOrders,
  tickets,
  properties,
  suppliers,
  expenses,
  budgetLines,
  pmTasks,
  PRIORITIES,
  COST_TYPES,
  WORK_ORDER_STATUSES,
  type WorkOrderStatus,
} from "@/db/schema";

export async function createWorkOrderAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const ticketId = String(formData.get("ticketId") ?? "") || null;
  const pmTaskId = String(formData.get("pmTaskId") ?? "") || null;
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const costType = String(formData.get("costType") ?? "opex");
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const estimatedCostRaw = String(formData.get("estimatedCost") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();

  if (!propertyId || !title || !description) {
    return { error: "Property, title, and description are required." };
  }
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) return { error: "Invalid priority." };
  if (!COST_TYPES.includes(costType as (typeof COST_TYPES)[number])) return { error: "Invalid cost type." };

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) return { error: "Property not found." };

  if (supplierId) {
    const supplier = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.orgId, session.orgId)),
    });
    if (!supplier || supplier.status !== "approved") {
      return { error: "Selected supplier is not an approved supplier." };
    }
  }

  const [workOrder] = await db
    .insert(workOrders)
    .values({
      orgId: session.orgId,
      ticketId,
      propertyId,
      supplierId,
      title,
      description,
      priority: priority as (typeof PRIORITIES)[number],
      costType: costType as (typeof COST_TYPES)[number],
      status: supplierId ? "sent" : "draft",
      estimatedCost: estimatedCostRaw || null,
      scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
      createdById: session.userId,
    })
    .returning();

  if (ticketId) {
    await db
      .update(tickets)
      .set({ status: "work_order_created", updatedAt: new Date() })
      .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)));
  }

  if (pmTaskId) {
    await db
      .update(pmTasks)
      .set({ workOrderId: workOrder.id, status: "in_progress" })
      .where(eq(pmTasks.id, pmTaskId));
  }

  revalidatePath("/dashboard/work-orders");
  revalidatePath("/dashboard/maintenance");
  redirect(`/dashboard/work-orders/${workOrder.id}`);
}

async function assertWorkOrderInOrg(workOrderId: string, orgId: string) {
  const wo = await db.query.workOrders.findFirst({
    where: and(eq(workOrders.id, workOrderId), eq(workOrders.orgId, orgId)),
  });
  if (!wo) throw new Error("Work order not found");
  return wo;
}

export async function assignSupplierAction(workOrderId: string, supplierId: string): Promise<{ error?: string }> {
  const session = await requireSession();
  const wo = await assertWorkOrderInOrg(workOrderId, session.orgId);

  const supplier = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, supplierId), eq(suppliers.orgId, session.orgId)),
  });
  if (!supplier || supplier.status !== "approved") {
    return { error: "Selected supplier is not an approved supplier." };
  }

  await db
    .update(workOrders)
    .set({ supplierId, status: wo.status === "draft" ? "sent" : wo.status, updatedAt: new Date() })
    .where(eq(workOrders.id, workOrderId));

  revalidatePath(`/dashboard/work-orders/${workOrderId}`);
  return {};
}

const ADVANCEABLE_STATUSES = WORK_ORDER_STATUSES.filter(
  (s) => s !== "completed" && s !== "cancelled",
) as WorkOrderStatus[];

export async function advanceWorkOrderStatusAction(workOrderId: string, status: WorkOrderStatus): Promise<void> {
  const session = await requireSession();
  if (!ADVANCEABLE_STATUSES.includes(status) && status !== "cancelled") return;
  await assertWorkOrderInOrg(workOrderId, session.orgId);

  await db
    .update(workOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(workOrders.id, workOrderId));

  revalidatePath(`/dashboard/work-orders/${workOrderId}`);
  revalidatePath("/dashboard/work-orders");
}

export async function completeWorkOrderAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const workOrderId = String(formData.get("workOrderId") ?? "");
  const actualCost = String(formData.get("actualCost") ?? "").trim();
  const budgetLineId = String(formData.get("budgetLineId") ?? "") || null;

  if (!actualCost || Number.isNaN(Number(actualCost))) {
    return { error: "Enter the actual cost to complete this work order." };
  }

  const wo = await assertWorkOrderInOrg(workOrderId, session.orgId);

  let categoryId: string | null = null;
  if (budgetLineId) {
    const line = await db.query.budgetLines.findFirst({ where: eq(budgetLines.id, budgetLineId) });
    if (!line) return { error: "Budget line not found." };
    categoryId = line.categoryId;
  }

  await db
    .update(workOrders)
    .set({
      status: "completed",
      actualCost,
      completedAt: new Date(),
      budgetLineId,
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, workOrderId));

  await db.insert(expenses).values({
    orgId: session.orgId,
    propertyId: wo.propertyId,
    budgetLineId,
    categoryId,
    workOrderId: wo.id,
    type: wo.costType,
    amount: actualCost,
    description: wo.title,
  });

  revalidatePath(`/dashboard/work-orders/${workOrderId}`);
  revalidatePath("/dashboard/work-orders");
  revalidatePath("/dashboard/budget");
  return {};
}
