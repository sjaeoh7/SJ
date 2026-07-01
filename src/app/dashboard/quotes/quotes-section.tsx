import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { RequestQuoteForm, SubmitQuoteForm, DecideQuoteButtons } from "./quote-actions";

export async function QuotesSection({
  workOrderId,
  approvedSuppliers,
}: {
  workOrderId: string;
  approvedSuppliers: { id: string; name: string }[];
}) {
  const rows = await db
    .select({
      id: quotes.id,
      amount: quotes.amount,
      status: quotes.status,
      validUntil: quotes.validUntil,
      submittedAt: quotes.submittedAt,
      supplierId: quotes.supplierId,
    })
    .from(quotes)
    .where(eq(quotes.workOrderId, workOrderId));

  const supplierNameById = new Map(approvedSuppliers.map((s) => [s.id, s.name]));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Quotes</h2>
      </div>

      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No quotes requested yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((q) => {
            const supplierName = supplierNameById.get(q.supplierId) ?? "Supplier";
            return (
              <li key={q.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{supplierName}</p>
                    <p className="text-xs text-slate-500">
                      {q.status === "requested" ? "Awaiting quote" : formatCurrency(q.amount)}
                      {q.validUntil && ` · valid until ${formatDate(q.validUntil)}`}
                    </p>
                  </div>
                  <Badge value={q.status} />
                </div>
                <div className="mt-2">
                  {q.status === "requested" && <SubmitQuoteForm quoteId={q.id} supplierName={supplierName} />}
                  {q.status === "submitted" && <DecideQuoteButtons quoteId={q.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <RequestQuoteForm workOrderId={workOrderId} suppliers={approvedSuppliers} />
      </div>
    </div>
  );
}
