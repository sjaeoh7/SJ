"use client";

import { useActionState } from "react";
import { createBudgetLineAction } from "../actions";

type Category = { id: string; name: string; type: string };

export function LineForm({ budgetId, categories }: { budgetId: string; categories: Category[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createBudgetLineAction(formData),
    {},
  );

  return (
    <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-100 bg-slate-50 p-4">
      <input type="hidden" name="budgetId" value={budgetId} />
      <div>
        <label className="block text-xs font-medium text-slate-700">Category</label>
        <select name="categoryId" required className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Planned amount</label>
        <input type="number" step="0.01" name="plannedAmount" required className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-700">Notes</label>
        <input name="notes" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add line"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
