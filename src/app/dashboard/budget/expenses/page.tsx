import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { expenses, properties, budgetCategories, workOrders, budgetLines, budgets } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { ExpenseForm } from "./expense-form";
import Link from "next/link";

export default async function ExpensesPage() {
  const session = await requireSession();

  const rows = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      type: expenses.type,
      description: expenses.description,
      incurredAt: expenses.incurredAt,
      propertyName: properties.name,
      categoryName: budgetCategories.name,
      workOrderId: expenses.workOrderId,
      workOrderTitle: workOrders.title,
    })
    .from(expenses)
    .innerJoin(properties, eq(expenses.propertyId, properties.id))
    .leftJoin(budgetCategories, eq(expenses.categoryId, budgetCategories.id))
    .leftJoin(workOrders, eq(expenses.workOrderId, workOrders.id))
    .where(eq(expenses.orgId, session.orgId))
    .orderBy(desc(expenses.incurredAt));

  const propertyRows = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.orgId, session.orgId));

  const categoryRows = await db
    .select({ id: budgetCategories.id, name: budgetCategories.name, type: budgetCategories.type })
    .from(budgetCategories)
    .where(eq(budgetCategories.orgId, session.orgId));

  const budgetLineRows = await db
    .select({
      id: budgetLines.id,
      propertyId: budgets.propertyId,
      label: budgetCategories.name,
      fiscalYear: budgets.fiscalYear,
    })
    .from(budgetLines)
    .innerJoin(budgets, eq(budgetLines.budgetId, budgets.id))
    .innerJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
    .where(eq(budgets.orgId, session.orgId));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Expense ledger</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every dollar spent, whether logged manually or automatically from a completed work order.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No expenses recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {e.workOrderId ? (
                      <Link href={`/dashboard/work-orders/${e.workOrderId}`} className="font-medium hover:underline">
                        {e.description}
                      </Link>
                    ) : (
                      <span className="font-medium">{e.description}</span>
                    )}
                    {e.workOrderTitle && <p className="text-xs text-slate-400">From work order</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.propertyName}</td>
                  <td className="px-4 py-3 text-slate-600">{e.categoryName || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge value={e.type} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(e.incurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6">
        <ExpenseForm properties={propertyRows} categories={categoryRows} budgetLines={budgetLineRows} />
      </div>
    </div>
  );
}
