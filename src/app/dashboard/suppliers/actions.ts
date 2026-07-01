"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { suppliers, TRADE_CATEGORIES, type SupplierStatus } from "@/db/schema";

export async function createSupplierAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const categories = formData.getAll("categories").map(String);

  if (!name) return { error: "Supplier name is required." };
  const validCategories = categories.filter((c) => (TRADE_CATEGORIES as readonly string[]).includes(c));
  if (validCategories.length === 0) return { error: "Select at least one trade category." };

  const [supplier] = await db
    .insert(suppliers)
    .values({
      orgId: session.orgId,
      name,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      categories: validCategories as (typeof TRADE_CATEGORIES)[number][],
    })
    .returning();

  revalidatePath("/dashboard/suppliers");
  redirect(`/dashboard/suppliers/${supplier.id}`);
}

export async function setSupplierStatusAction(supplierId: string, status: SupplierStatus): Promise<void> {
  const session = await requireSession();
  await db
    .update(suppliers)
    .set({ status })
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.orgId, session.orgId)));
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
  revalidatePath("/dashboard/suppliers");
}
