import Link from "next/link";
import { eq, desc, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { budgets, budgetLines, expenses, properties } from "@/db/schema";
import { formatCurrency } from "@/lib/format";

export default async function BudgetPage() {
  const session = await requireSession();

  const budgetRows = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      fiscalYear: budgets.fiscalYear,
      propertyName: properties.name,
    })
    .from(budgets)
    .innerJoin(properties, eq(budgets.propertyId, properties.id))
    .where(eq(budgets.orgId, session.orgId))
    .orderBy(desc(budgets.fiscalYear));

  const plannedByBudget = await db
    .select({ budgetId: budgetLines.budgetId, planned: sql<string>`coalesce(sum(${budgetLines.plannedAmount}), 0)` })
    .from(budgetLines)
    .groupBy(budgetLines.budgetId);
  const plannedMap = new Map(plannedByBudget.map((r) => [r.budgetId, Number(r.planned)]));

  const actualByBudget = await db
    .select({ budgetId: budgetLines.budgetId, actual: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .innerJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
    .groupBy(budgetLines.budgetId);
  const actualMap = new Map(actualByBudget.map((r) => [r.budgetId, Number(r.actual)]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Budget (OpEx / CapEx)</h1>
          <p className="mt-1 text-sm text-slate-500">Annual budgets by property, tracked planned vs. actual.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/budget/categories"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/budget/expenses"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Expense ledger
          </Link>
          <Link
            href="/dashboard/budget/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New budget
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {budgetRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No budgets yet.{" "}
            <Link href="/dashboard/budget/categories" className="font-medium underline">
              Set up categories
            </Link>{" "}
            first, then create a budget.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Fiscal year</th>
                <th className="px-4 py-3">Planned</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgetRows.map((b) => {
                const planned = plannedMap.get(b.id) ?? 0;
                const actual = actualMap.get(b.id) ?? 0;
                const remaining = planned - actual;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/budget/${b.id}`} className="font-medium text-slate-900 hover:underline">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.propertyName}</td>
                    <td className="px-4 py-3 text-slate-600">{b.fiscalYear}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(planned)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(actual)}</td>
                    <td className={`px-4 py-3 font-medium ${remaining < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {formatCurrency(remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
