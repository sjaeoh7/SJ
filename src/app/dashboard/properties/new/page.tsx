"use client";

import { useActionState } from "react";
import { createPropertyAction } from "../actions";

export default function NewPropertyPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createPropertyAction(formData),
    {},
  );

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Add a property</h1>

      <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Property name</label>
          <input
            name="name"
            required
            placeholder="123 Maple St Duplex"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Street address</label>
          <input name="address" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">City</label>
            <input name="city" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">State</label>
            <input name="state" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">ZIP</label>
            <input name="zip" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select name="type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="residential">Residential</option>
            <option value="retail">Retail</option>
            <option value="commercial">Commercial</option>
            <option value="mixed_use">Mixed use</option>
          </select>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save property"}
        </button>
      </form>
    </div>
  );
}
