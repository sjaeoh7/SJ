import { eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets, workOrders, expenses, budgetLines, budgets, suppliers, budgetCategories } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/lib/format";

export default async function ReportsPage() {
  const session = await requireSession();
  const orgId = session.orgId;

  const ticketsByStatus = await db
    .select({ value: tickets.status, count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.orgId, orgId))
    .groupBy(tickets.status);

  const ticketsByPriority = await db
    .select({ value: tickets.priority, count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.orgId, orgId))
    .groupBy(tickets.priority);

  const workOrdersByStatus = await db
    .select({ value: workOrders.status, count: sql<number>`count(*)::int` })
    .from(workOrders)
    .where(eq(workOrders.orgId, orgId))
    .groupBy(workOrders.status);

  const suppliersByStatus = await db
    .select({ value: suppliers.status, count: sql<number>`count(*)::int` })
    .from(suppliers)
    .where(eq(suppliers.orgId, orgId))
    .groupBy(suppliers.status);

  const spendByType = await db
    .select({ type: expenses.type, total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.orgId, orgId))
    .groupBy(expenses.type);

  const spendByCategory = await db
    .select({
      categoryName: budgetCategories.name,
      type: budgetCategories.type,
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .innerJoin(budgetCategories, eq(expenses.categoryId, budgetCategories.id))
    .where(eq(expenses.orgId, orgId))
    .groupBy(budgetCategories.name, budgetCategories.type)
    .orderBy(sql`3 desc`);

  const [plannedTotal] = await db
    .select({ total: sql<string>`coalesce(sum(${budgetLines.plannedAmount}), 0)` })
    .from(budgetLines)
    .innerJoin(budgets, eq(budgetLines.budgetId, budgets.id))
    .where(eq(budgets.orgId, orgId));

  const [actualTotal] = await db
    .select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .innerJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
    .innerJoin(budgets, eq(budgetLines.budgetId, budgets.id))
    .where(eq(budgets.orgId, orgId));

  const planned = Number(plannedTotal?.total ?? 0);
  const actual = Number(actualTotal?.total ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Portfolio-wide operational and financial summary.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Budget vs. actual (all budgets)</h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Planned</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(planned)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Actual</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(actual)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Remaining</p>
            <p className={`mt-1 text-xl font-semibold ${planned - actual < 0 ? "text-red-600" : "text-emerald-700"}`}>
              {formatCurrency(planned - actual)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Spend by OpEx / CapEx</h2>
          <ul className="mt-3 space-y-2">
            {spendByType.length === 0 && <p className="text-sm text-slate-500">No expenses recorded yet.</p>}
            {spendByType.map((row) => (
              <li key={row.type} className="flex items-center justify-between text-sm">
                <Badge value={row.type} />
                <span className="font-medium text-slate-900">{formatCurrency(row.total)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Spend by category</h2>
          <ul className="mt-3 space-y-2">
            {spendByCategory.length === 0 && <p className="text-sm text-slate-500">No categorized expenses yet.</p>}
            {spendByCategory.map((row) => (
              <li key={row.categoryName} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{row.categoryName}</span>
                <span className="font-medium text-slate-900">{formatCurrency(row.total)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tickets by status</h2>
          <ul className="mt-3 space-y-2">
            {ticketsByStatus.map((row) => (
              <li key={row.value} className="flex items-center justify-between text-sm">
                <Badge value={row.value} />
                <span className="font-medium text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Tickets by priority</h2>
          <ul className="mt-3 space-y-2">
            {ticketsByPriority.map((row) => (
              <li key={row.value} className="flex items-center justify-between text-sm">
                <Badge value={row.value} />
                <span className="font-medium text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Work orders by status</h2>
          <ul className="mt-3 space-y-2">
            {workOrdersByStatus.map((row) => (
              <li key={row.value} className="flex items-center justify-between text-sm">
                <Badge value={row.value} />
                <span className="font-medium text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Suppliers by status</h2>
          <ul className="mt-3 space-y-2">
            {suppliersByStatus.map((row) => (
              <li key={row.value} className="flex items-center justify-between text-sm">
                <Badge value={row.value} />
                <span className="font-medium text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
