"use client";

import { useActionState, useState } from "react";
import { createExpenseAction } from "../actions";

type Property = { id: string; name: string };
type Category = { id: string; name: string; type: string };
type BudgetLine = { id: string; propertyId: string; label: string; fiscalYear: number };

export function ExpenseForm({
  properties,
  categories,
  budgetLines,
}: {
  properties: Property[];
  categories: Category[];
  budgetLines: BudgetLine[];
}) {
  const [propertyId, setPropertyId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createExpenseAction(formData),
    {},
  );

  const filteredLines = budgetLines.filter((l) => l.propertyId === propertyId);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">Log a manual expense</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Property</label>
          <select
            name="propertyId"
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select name="type" defaultValue="opex" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="opex">OpEx</option>
            <option value="capex">CapEx</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <input name="description" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Amount</label>
          <input type="number" step="0.01" name="amount" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Date incurred</label>
          <input type="date" name="incurredAt" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Category (optional)</label>
        <select name="categoryId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {filteredLines.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Apply to budget line (optional)</label>
          <select name="budgetLineId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No budget line</option>
            {filteredLines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} (FY{l.fiscalYear})
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Log expense"}
      </button>
    </form>
  );
}
