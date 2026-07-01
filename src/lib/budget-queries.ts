import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgetLines, expenses } from "@/db/schema";

// Sum of expenses recorded against a given budget line (regardless of
// whether the expense was logged manually or auto-created when a work
// order was marked completed).
export async function actualSpendByBudgetLine(budgetId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({
      budgetLineId: expenses.budgetLineId,
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .innerJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
    .where(and(eq(budgetLines.budgetId, budgetId)))
    .groupBy(expenses.budgetLineId);

  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.budgetLineId) map.set(row.budgetLineId, Number(row.total));
  }
  return map;
}
