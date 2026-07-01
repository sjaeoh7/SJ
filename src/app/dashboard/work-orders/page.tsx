import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { workOrders, properties, suppliers } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function WorkOrdersPage() {
  const session = await requireSession();

  const rows = await db
    .select({
      id: workOrders.id,
      title: workOrders.title,
      status: workOrders.status,
      priority: workOrders.priority,
      costType: workOrders.costType,
      estimatedCost: workOrders.estimatedCost,
      createdAt: workOrders.createdAt,
      propertyName: properties.name,
      supplierName: suppliers.name,
    })
    .from(workOrders)
    .innerJoin(properties, eq(workOrders.propertyId, properties.id))
    .leftJoin(suppliers, eq(workOrders.supplierId, suppliers.id))
    .where(eq(workOrders.orgId, session.orgId))
    .orderBy(desc(workOrders.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Work Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Dispatch and track work with preapproved suppliers.</p>
        </div>
        <Link
          href="/dashboard/work-orders/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New work order
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No work orders yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Work order</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Cost type</th>
                <th className="px-4 py-3">Est. cost</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/work-orders/${wo.id}`} className="font-medium text-slate-900 hover:underline">
                      {wo.title}
                    </Link>
                    <p className="text-xs text-slate-400">{formatDate(wo.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{wo.propertyName}</td>
                  <td className="px-4 py-3 text-slate-600">{wo.supplierName || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge value={wo.costType} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(wo.estimatedCost)}</td>
                  <td className="px-4 py-3">
                    <Badge value={wo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
