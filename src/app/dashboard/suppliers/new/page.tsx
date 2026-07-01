"use client";

import { useActionState } from "react";
import { createSupplierAction } from "../actions";
import { TRADE_CATEGORIES } from "@/db/schema";
import { titleCase } from "@/lib/format";

export default function NewSupplierPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createSupplierAction(formData),
    {},
  );

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Add a supplier</h1>

      <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Supplier / company name</label>
          <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Contact name</label>
            <input name="contactName" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input type="email" name="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Trade categories covered</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TRADE_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="categories" value={category} className="rounded border-slate-300" />
                {titleCase(category)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea name="notes" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save supplier"}
        </button>
      </form>
    </div>
  );
}
