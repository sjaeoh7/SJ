"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import {
  budgetCategories,
  budgets,
  budgetLines,
  expenses,
  properties,
  COST_TYPES,
  type CostType,
} from "@/db/schema";

export async function createBudgetCategoryAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "opex");

  if (!name) return { error: "Category name is required." };
  if (!COST_TYPES.includes(type as CostType)) return { error: "Invalid cost type." };

  await db.insert(budgetCategories).values({ orgId: session.orgId, name, type: type as CostType });

  revalidatePath("/dashboard/budget/categories");
  redirect("/dashboard/budget/categories");
}

export async function createBudgetAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const fiscalYear = Number(formData.get("fiscalYear"));
  const name = String(formData.get("name") ?? "").trim();

  if (!propertyId || !name || !fiscalYear) return { error: "Property, name, and fiscal year are required." };

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) return { error: "Property not found." };

  const [budget] = await db.insert(budgets).values({ orgId: session.orgId, propertyId, fiscalYear, name }).returning();

  revalidatePath("/dashboard/budget");
  redirect(`/dashboard/budget/${budget.id}`);
}

export async function createBudgetLineAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const budgetId = String(formData.get("budgetId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const plannedAmount = String(formData.get("plannedAmount") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!budgetId || !categoryId || !plannedAmount) return { error: "Category and planned amount are required." };

  const budget = await db.query.budgets.findFirst({
    where: and(eq(budgets.id, budgetId), eq(budgets.orgId, session.orgId)),
  });
  if (!budget) return { error: "Budget not found." };

  const category = await db.query.budgetCategories.findFirst({
    where: and(eq(budgetCategories.id, categoryId), eq(budgetCategories.orgId, session.orgId)),
  });
  if (!category) return { error: "Category not found." };

  await db.insert(budgetLines).values({
    budgetId,
    categoryId,
    type: category.type,
    plannedAmount,
    notes: notes || null,
  });

  revalidatePath(`/dashboard/budget/${budgetId}`);
  return {};
}

export async function createExpenseAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const propertyId = String(formData.get("propertyId") ?? "");
  const budgetLineId = String(formData.get("budgetLineId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const type = String(formData.get("type") ?? "opex");
  const amount = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const incurredAtRaw = String(formData.get("incurredAt") ?? "").trim();

  if (!propertyId || !amount || !description) return { error: "Property, amount, and description are required." };
  if (!COST_TYPES.includes(type as CostType)) return { error: "Invalid cost type." };

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.orgId, session.orgId)),
  });
  if (!property) return { error: "Property not found." };

  await db.insert(expenses).values({
    orgId: session.orgId,
    propertyId,
    budgetLineId,
    categoryId,
    type: type as CostType,
    amount,
    description,
    incurredAt: incurredAtRaw ? new Date(incurredAtRaw) : new Date(),
  });

  revalidatePath("/dashboard/budget/expenses");
  revalidatePath("/dashboard/budget");
  return {};
}
