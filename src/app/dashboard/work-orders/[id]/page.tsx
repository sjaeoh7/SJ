import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import {
  workOrders,
  properties,
  suppliers,
  budgets,
  budgetLines,
  budgetCategories,
} from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { SupplierAssign, StatusAdvanceButton, CancelButton, CompleteWorkOrderForm } from "./status-actions";
import { QuotesSection } from "@/app/dashboard/quotes/quotes-section";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const wo = await db
    .select({
      id: workOrders.id,
      title: workOrders.title,
      description: workOrders.description,
      status: workOrders.status,
      priority: workOrders.priority,
      costType: workOrders.costType,
      estimatedCost: workOrders.estimatedCost,
      actualCost: workOrders.actualCost,
      scheduledAt: workOrders.scheduledAt,
      completedAt: workOrders.completedAt,
      createdAt: workOrders.createdAt,
      propertyId: workOrders.propertyId,
      propertyName: properties.name,
      supplierId: workOrders.supplierId,
      supplierName: suppliers.name,
      ticketId: workOrders.ticketId,
    })
    .from(workOrders)
    .innerJoin(properties, eq(workOrders.propertyId, properties.id))
    .leftJoin(suppliers, eq(workOrders.supplierId, suppliers.id))
    .where(and(eq(workOrders.id, id), eq(workOrders.orgId, session.orgId)))
    .then((rows) => rows[0]);

  if (!wo) notFound();

  const approvedSuppliers = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(and(eq(suppliers.orgId, session.orgId), eq(suppliers.status, "approved")));

  const availableBudgetLines = await db
    .select({
      id: budgetLines.id,
      budgetName: budgets.name,
      fiscalYear: budgets.fiscalYear,
      categoryName: budgetCategories.name,
      plannedAmount: budgetLines.plannedAmount,
    })
    .from(budgetLines)
    .innerJoin(budgets, eq(budgetLines.budgetId, budgets.id))
    .innerJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
    .where(and(eq(budgets.propertyId, wo.propertyId), eq(budgets.orgId, session.orgId)));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/work-orders" className="text-sm text-slate-500 hover:underline">
          ← Back to work orders
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{wo.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {wo.propertyName} · Created {formatDateTime(wo.createdAt)}
              {wo.ticketId && (
                <>
                  {" · "}
                  <Link href={`/dashboard/tickets/${wo.ticketId}`} className="underline">
                    View source ticket
                  </Link>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge value={wo.priority} />
            <Badge value={wo.costType} />
            <Badge value={wo.status} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Scope of work</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{wo.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Estimated cost</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(wo.estimatedCost)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Actual cost</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(wo.actualCost)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Scheduled</dt>
            <dd className="font-medium text-slate-900">{formatDateTime(wo.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Completed</dt>
            <dd className="font-medium text-slate-900">{formatDateTime(wo.completedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Supplier</h2>
        <div className="mt-2">
          <SupplierAssign workOrderId={wo.id} currentSupplierId={wo.supplierId} suppliers={approvedSuppliers} />
        </div>
      </div>

      {wo.status !== "completed" && wo.status !== "cancelled" && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusAdvanceButton workOrderId={wo.id} status={wo.status} />
            <CancelButton workOrderId={wo.id} />
          </div>
          <div className="mt-4">
            <CompleteWorkOrderForm
              workOrderId={wo.id}
              budgetLines={availableBudgetLines.map((line) => ({
                id: line.id,
                label: `${line.budgetName} (FY${line.fiscalYear}) · ${line.categoryName} — planned ${formatCurrency(line.plannedAmount)}`,
              }))}
            />
          </div>
        </div>
      )}

      <QuotesSection workOrderId={wo.id} approvedSuppliers={approvedSuppliers} />
    </div>
  );
}
