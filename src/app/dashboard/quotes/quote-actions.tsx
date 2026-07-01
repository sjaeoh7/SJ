"use client";

import { useState, useTransition } from "react";
import { requestQuoteAction, submitQuoteAction, decideQuoteAction } from "./actions";

export function RequestQuoteForm({ workOrderId, suppliers }: { workOrderId: string; suppliers: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await requestQuoteAction(formData);
          setError(res?.error ?? null);
        })
      }
      className="flex items-center gap-2"
    >
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <select name="supplierId" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" required>
        <option value="">Request quote from...</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Request
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

export function SubmitQuoteForm({ quoteId, supplierName }: { quoteId: string; supplierName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Record {supplierName}&apos;s quote
      </button>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await submitQuoteAction(formData);
          setError(res?.error ?? null);
          if (!res?.error) setOpen(false);
        })
      }
      className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
    >
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="grid grid-cols-3 gap-2">
        <input name="amount" type="number" step="0.01" placeholder="Total amount" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="laborCost" type="number" step="0.01" placeholder="Labor (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="materialsCost" type="number" step="0.01" placeholder="Materials (optional)" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <input name="notes" placeholder="Notes (optional)" className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Valid until</label>
        <input name="validUntil" type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Save quote
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DecideQuoteButtons({ quoteId }: { quoteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(async () => void (await decideQuoteAction(quoteId, "approved")))}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => void (await decideQuoteAction(quoteId, "rejected")))}
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
