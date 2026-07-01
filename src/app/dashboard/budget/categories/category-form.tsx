"use client";

import { useActionState } from "react";
import { createBudgetCategoryAction } from "../actions";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createBudgetCategoryAction(formData),
    {},
  );

  return (
    <form action={formAction} className="mt-6 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">Category name</label>
        <input name="name" required placeholder="Routine plumbing repairs" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Type</label>
        <select name="type" defaultValue="opex" className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="opex">OpEx</option>
          <option value="capex">CapEx</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add category"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
