import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { budgets, budgetLines, budgetCategories, properties } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/lib/format";
import { actualSpendByBudgetLine } from "@/lib/budget-queries";
import { LineForm } from "./line-form";

export default async function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const budget = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      fiscalYear: budgets.fiscalYear,
      propertyName: properties.name,
    })
    .from(budgets)
    .innerJoin(properties, eq(budgets.propertyId, properties.id))
    .where(and(eq(budgets.id, id), eq(budgets.orgId, session.orgId)))
    .then((rows) => rows[0]);

  if (!budget) notFound();

  const lines = await db
    .select({
      id: budgetLines.id,
      type: budgetLines.type,
      plannedAmount: budgetLines.plannedAmount,
      notes: budgetLines.notes,
      categoryName: budgetCategories.name,
    })
    .from(budgetLines)
    .innerJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
    .where(eq(budgetLines.budgetId, id));

  const actualMap = await actualSpendByBudgetLine(id);

  const categories = await db
    .select({ id: budgetCategories.id, name: budgetCategories.name, type: budgetCategories.type })
    .from(budgetCategories)
    .where(eq(budgetCategories.orgId, session.orgId));

  const totalPlanned = lines.reduce((sum, l) => sum + Number(l.plannedAmount), 0);
  const totalActual = lines.reduce((sum, l) => sum + (actualMap.get(l.id) ?? 0), 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/budget" className="text-sm text-slate-500 hover:underline">
          ← Back to budgets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{budget.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {budget.propertyName} · FY{budget.fiscalYear}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Planned</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Actual</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(totalActual)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Remaining</p>
          <p className={`mt-1 text-xl font-semibold ${totalPlanned - totalActual < 0 ? "text-red-600" : "text-emerald-700"}`}>
            {formatCurrency(totalPlanned - totalActual)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Budget lines</h2>
        {lines.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No lines yet — add one below.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2">Type</th>
                <th className="py-2">Planned</th>
                <th className="py-2">Actual</th>
                <th className="py-2">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l) => {
                const actual = actualMap.get(l.id) ?? 0;
                const variance = Number(l.plannedAmount) - actual;
                return (
                  <tr key={l.id}>
                    <td className="py-2 font-medium text-slate-900">
                      {l.categoryName}
                      {l.notes && <p className="text-xs font-normal text-slate-500">{l.notes}</p>}
                    </td>
                    <td className="py-2">
                      <Badge value={l.type} />
                    </td>
                    <td className="py-2 text-slate-600">{formatCurrency(l.plannedAmount)}</td>
                    <td className="py-2 text-slate-600">{formatCurrency(actual)}</td>
                    <td className={`py-2 font-medium ${variance < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {formatCurrency(variance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <LineForm budgetId={budget.id} categories={categories} />
      </div>
    </div>
  );
}
