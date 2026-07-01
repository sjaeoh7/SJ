"use client";

import { useState, useTransition } from "react";
import { assignSupplierAction, advanceWorkOrderStatusAction, completeWorkOrderAction } from "../actions";
import type { WorkOrderStatus } from "@/db/schema";
import { titleCase } from "@/lib/format";

type Supplier = { id: string; name: string };
type BudgetLine = { id: string; label: string };

const NEXT_STATUS: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
  draft: "sent",
  sent: "acknowledged",
  acknowledged: "scheduled",
  scheduled: "in_progress",
};

export function SupplierAssign({
  workOrderId,
  currentSupplierId,
  suppliers,
}: {
  workOrderId: string;
  currentSupplierId: string | null;
  suppliers: Supplier[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentSupplierId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const supplierId = e.target.value;
          if (!supplierId) return;
          startTransition(async () => {
            const res = await assignSupplierAction(workOrderId, supplierId);
            setError(res?.error ?? null);
          });
        }}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        <option value="">Unassigned</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function StatusAdvanceButton({ workOrderId, status }: { workOrderId: string; status: WorkOrderStatus }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[status];
  if (!next) return null;

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => advanceWorkOrderStatusAction(workOrderId, next))}
      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      Mark {titleCase(next)}
    </button>
  );
}

export function CancelButton({ workOrderId }: { workOrderId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => advanceWorkOrderStatusAction(workOrderId, "cancelled"))}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      Cancel
    </button>
  );
}

export function CompleteWorkOrderForm({ workOrderId, budgetLines }: { workOrderId: string; budgetLines: BudgetLine[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await completeWorkOrderAction(formData);
          setError(res?.error ?? null);
        })
      }
      className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <h3 className="text-sm font-semibold text-emerald-900">Complete work order</h3>
      <div>
        <label className="block text-xs font-medium text-slate-700">Actual cost</label>
        <input
          type="number"
          step="0.01"
          name="actualCost"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {budgetLines.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700">Record against budget line (optional)</label>
          <select name="budgetLineId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No budget line</option>
            {budgetLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Mark completed & log expense"}
      </button>
    </form>
  );
}
