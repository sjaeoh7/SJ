"use client";

import { useActionState, useState } from "react";
import { createPmScheduleAction } from "../../actions";
import { TRADE_CATEGORIES, PM_FREQUENCIES } from "@/db/schema";
import { titleCase } from "@/lib/format";

type Property = { id: string; name: string };
type Asset = { id: string; name: string; propertyId: string };

export function ScheduleForm({ properties, assets }: { properties: Property[]; assets: Asset[] }) {
  const [propertyId, setPropertyId] = useState("");
  const [frequency, setFrequency] = useState("monthly");

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createPmScheduleAction(formData),
    {},
  );

  const filteredAssets = assets.filter((a) => a.propertyId === propertyId);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Property</label>
        <select
          name="propertyId"
          required
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select a property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {filteredAssets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Asset (optional)</label>
          <select name="assetId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No specific asset</option>
            {filteredAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input name="title" required placeholder="Quarterly HVAC filter change" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Trade category</label>
        <select name="category" defaultValue="hvac" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          {TRADE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {titleCase(c)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Frequency</label>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PM_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {titleCase(f)}
              </option>
            ))}
          </select>
        </div>
        {frequency === "custom_days" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Interval (days)</label>
            <input type="number" name="customIntervalDays" min={1} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">First due date</label>
        <input type="date" name="startDate" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Create schedule"}
      </button>
    </form>
  );
}
