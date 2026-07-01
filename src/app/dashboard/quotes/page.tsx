import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { quotes, workOrders, suppliers } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function QuotesOverviewPage() {
  const session = await requireSession();

  const rows = await db
    .select({
      id: quotes.id,
      amount: quotes.amount,
      status: quotes.status,
      createdAt: quotes.createdAt,
      workOrderId: quotes.workOrderId,
      workOrderTitle: workOrders.title,
      supplierName: suppliers.name,
    })
    .from(quotes)
    .innerJoin(workOrders, eq(quotes.workOrderId, workOrders.id))
    .innerJoin(suppliers, eq(quotes.supplierId, suppliers.id))
    .where(eq(workOrders.orgId, session.orgId))
    .orderBy(desc(quotes.createdAt));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Quotes</h1>
        <p className="mt-1 text-sm text-slate-500">All supplier quotes across every work order.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No quotes yet. Request one from a work order&apos;s detail page.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Work order</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/work-orders/${q.workOrderId}`} className="font-medium text-slate-900 hover:underline">
                      {q.workOrderTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{q.supplierName}</td>
                  <td className="px-4 py-3 text-slate-600">{q.status === "requested" ? "—" : formatCurrency(q.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge value={q.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
