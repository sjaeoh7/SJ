"use client";

import { useActionState } from "react";
import { createWorkOrderAction } from "../actions";
import { titleCase } from "@/lib/format";

type Property = { id: string; name: string };
type Supplier = { id: string; name: string; categories: string[] };

export function WorkOrderForm({
  properties,
  suppliers,
  initial,
}: {
  properties: Property[];
  suppliers: Supplier[];
  initial?: {
    ticketId?: string;
    pmTaskId?: string;
    propertyId: string;
    propertyName: string;
    title: string;
    description: string;
    priority: string;
    suggestedCategory: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createWorkOrderAction(formData),
    {},
  );

  const recommendedSupplierIds = initial?.suggestedCategory
    ? suppliers.filter((s) => s.categories.includes(initial.suggestedCategory!)).map((s) => s.id)
    : [];

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {initial?.ticketId && <input type="hidden" name="ticketId" value={initial.ticketId} />}
      {initial?.pmTaskId && <input type="hidden" name="pmTaskId" value={initial.pmTaskId} />}

      <div>
        <label className="block text-sm font-medium text-slate-700">Property</label>
        {initial ? (
          <>
            <input type="hidden" name="propertyId" value={initial.propertyId} />
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {initial.propertyName}
            </p>
          </>
        ) : (
          <select name="propertyId" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a property...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          name="title"
          required
          defaultValue={initial?.title}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description / scope of work</label>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={initial?.description}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Priority</label>
          <select
            name="priority"
            defaultValue={initial?.priority ?? "medium"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Cost type</label>
          <select name="costType" defaultValue="opex" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="opex">OpEx (operating expense)</option>
            <option value="capex">CapEx (capital expenditure)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Assign supplier (optional — sends the work order)</label>
        <select name="supplierId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Leave unassigned for now</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.categories.map(titleCase).join(", ")}
              {recommendedSupplierIds.includes(s.id) ? " (recommended)" : ""}
            </option>
          ))}
        </select>
        {suppliers.length === 0 && (
          <p className="mt-1 text-xs text-amber-700">No approved suppliers yet — add and approve one first.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Estimated cost</label>
          <input
            type="number"
            step="0.01"
            name="estimatedCost"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Scheduled date/time</label>
          <input type="datetime-local" name="scheduledAt" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Create work order"}
      </button>
    </form>
  );
}
