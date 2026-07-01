"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import {
  assets,
  pmSchedules,
  pmTasks,
  properties,
  TRADE_CATEGORIES,
  PM_FREQUENCIES,
  type TradeCategory,
  type PmFrequency,
} from "@/db/schema";
import { nextDueDate } from "@/lib/pm";

export async function createAssetAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const propertyId = String(formData.get("propertyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general_handyman");
  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim();
  const installedAtRaw = String(formData.get("installedAt") ?? "").trim();
  const warrantyExpiresAtRaw = String(formData.get("warrantyExpiresAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!propertyId || !name) return { error: "Property and asset name are required." };
  if (!TRADE_CATEGORIES.includes(category as TradeCategory)) return { error: "Invalid category." };

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) return { error: "Property not found." };

  await db.insert(assets).values({
    orgId: session.orgId,
    propertyId,
    name,
    category: category as TradeCategory,
    manufacturer: manufacturer || null,
    model: model || null,
    serialNumber: serialNumber || null,
    installedAt: installedAtRaw ? new Date(installedAtRaw) : null,
    warrantyExpiresAt: warrantyExpiresAtRaw ? new Date(warrantyExpiresAtRaw) : null,
    notes: notes || null,
  });

  revalidatePath("/dashboard/maintenance");
  redirect("/dashboard/maintenance");
}

export async function createPmScheduleAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const propertyId = String(formData.get("propertyId") ?? "");
  const assetId = String(formData.get("assetId") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "general_handyman");
  const frequency = String(formData.get("frequency") ?? "monthly");
  const customIntervalDaysRaw = String(formData.get("customIntervalDays") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();

  if (!propertyId || !title || !startDateRaw) return { error: "Property, title, and start date are required." };
  if (!TRADE_CATEGORIES.includes(category as TradeCategory)) return { error: "Invalid category." };
  if (!PM_FREQUENCIES.includes(frequency as PmFrequency)) return { error: "Invalid frequency." };

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) return { error: "Property not found." };

  const customIntervalDays = customIntervalDaysRaw ? Number(customIntervalDaysRaw) : null;
  const nextDueAt = new Date(startDateRaw);

  const [schedule] = await db
    .insert(pmSchedules)
    .values({
      orgId: session.orgId,
      propertyId,
      assetId,
      title,
      description: description || null,
      category: category as TradeCategory,
      frequency: frequency as PmFrequency,
      customIntervalDays,
      nextDueAt,
    })
    .returning();

  await db.insert(pmTasks).values({ scheduleId: schedule.id, dueDate: nextDueAt, status: "pending" });

  revalidatePath("/dashboard/maintenance");
  redirect("/dashboard/maintenance");
}

export async function completePmTaskAction(taskId: string): Promise<void> {
  const session = await requireSession();

  const task = await db.query.pmTasks.findFirst({
    where: eq(pmTasks.id, taskId),
    with: { schedule: true },
  });
  if (!task || task.schedule.orgId !== session.orgId) return;

  const now = new Date();

  await db
    .update(pmTasks)
    .set({ status: "complete", completedAt: now })
    .where(eq(pmTasks.id, taskId));

  const nextDue = nextDueDate(task.schedule.frequency, task.schedule.customIntervalDays, now);

  await db
    .update(pmSchedules)
    .set({ lastCompletedAt: now, nextDueAt: nextDue })
    .where(eq(pmSchedules.id, task.scheduleId));

  if (task.schedule.active) {
    await db.insert(pmTasks).values({ scheduleId: task.scheduleId, dueDate: nextDue, status: "pending" });
  }

  revalidatePath("/dashboard/maintenance");
}

export async function skipPmTaskAction(taskId: string): Promise<void> {
  const session = await requireSession();
  const task = await db.query.pmTasks.findFirst({ where: eq(pmTasks.id, taskId), with: { schedule: true } });
  if (!task || task.schedule.orgId !== session.orgId) return;

  await db.update(pmTasks).set({ status: "skipped" }).where(eq(pmTasks.id, taskId));
  revalidatePath("/dashboard/maintenance");
}
