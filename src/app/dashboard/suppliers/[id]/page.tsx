import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { suppliers, workOrders, quotes } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { SupplierStatusActions } from "./status-actions";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const supplier = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.orgId, session.orgId)))
    .then((rows) => rows[0]);

  if (!supplier) notFound();

  const relatedWorkOrders = await db
    .select({ id: workOrders.id, title: workOrders.title, status: workOrders.status })
    .from(workOrders)
    .where(eq(workOrders.supplierId, id))
    .orderBy(desc(workOrders.createdAt));

  const relatedQuotes = await db
    .select({
      id: quotes.id,
      amount: quotes.amount,
      status: quotes.status,
      workOrderId: quotes.workOrderId,
      workOrderTitle: workOrders.title,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .innerJoin(workOrders, eq(quotes.workOrderId, workOrders.id))
    .where(eq(quotes.supplierId, id))
    .orderBy(desc(quotes.createdAt));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/suppliers" className="text-sm text-slate-500 hover:underline">
          ← Back to suppliers
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{supplier.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {supplier.contactName ? `${supplier.contactName} · ` : ""}
              {supplier.email || "no email"} · {supplier.phone || "no phone"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge value={supplier.status} />
            <SupplierStatusActions supplierId={supplier.id} status={supplier.status} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Trade categories</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {supplier.categories.map((c) => (
            <Badge key={c} value={c} />
          ))}
        </div>
        {supplier.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{supplier.notes}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Work orders</h2>
        {relatedWorkOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No work orders assigned yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {relatedWorkOrders.map((wo) => (
              <li key={wo.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <Link href={`/dashboard/work-orders/${wo.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {wo.title}
                </Link>
                <Badge value={wo.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quotes submitted</h2>
        {relatedQuotes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No quotes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {relatedQuotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <Link href={`/dashboard/work-orders/${q.workOrderId}`} className="font-medium text-slate-900 hover:underline">
                  {q.workOrderTitle}
                </Link>
                <span className="text-slate-600">{formatCurrency(q.amount)}</span>
                <span className="text-slate-400">{formatDate(q.createdAt)}</span>
                <Badge value={q.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
