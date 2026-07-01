"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { properties, PROPERTY_TYPES } from "@/db/schema";

export async function createPropertyAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const type = String(formData.get("type") ?? "residential");

  if (!name || !address || !city || !state || !zip) {
    return { error: "All fields are required." };
  }
  if (!PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number])) {
    return { error: "Invalid property type." };
  }

  const [property] = await db
    .insert(properties)
    .values({
      orgId: session.orgId,
      name,
      address,
      city,
      state,
      zip,
      type: type as (typeof PROPERTY_TYPES)[number],
    })
    .returning();

  revalidatePath("/dashboard/properties");
  redirect(`/dashboard/properties?created=${property.id}`);
}
