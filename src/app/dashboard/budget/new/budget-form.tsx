"use client";

import { useActionState } from "react";
import { createBudgetAction } from "../actions";

export function BudgetForm({ properties }: { properties: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createBudgetAction(formData),
    {},
  );

  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Property</label>
        <select name="propertyId" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select a property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Budget name</label>
        <input name="name" required placeholder={`FY${currentYear} Operating Budget`} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Fiscal year</label>
        <input type="number" name="fiscalYear" required defaultValue={currentYear} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Create budget"}
      </button>
    </form>
  );
}
