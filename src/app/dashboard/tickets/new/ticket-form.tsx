"use client";

import { useActionState } from "react";
import { createTicketAction } from "../actions";

type Property = { id: string; name: string };

export function TicketForm({ properties }: { properties: Property[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createTicketAction(formData),
    {},
  );

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
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          name="title"
          required
          placeholder="Kitchen sink leaking"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Describe the issue in as much detail as possible — this is what the AI diagnosis will read."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Priority (you can let AI diagnosis adjust this)</label>
        <select name="priority" defaultValue="medium" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit ticket"}
      </button>
    </form>
  );
}
