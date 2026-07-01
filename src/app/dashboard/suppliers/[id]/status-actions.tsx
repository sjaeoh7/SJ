"use client";

import { useTransition } from "react";
import { setSupplierStatusAction } from "../actions";
import type { SupplierStatus } from "@/db/schema";

export function SupplierStatusActions({ supplierId, status }: { supplierId: string; status: SupplierStatus }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: SupplierStatus) {
    startTransition(() => setSupplierStatusAction(supplierId, next));
  }

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <button
          onClick={() => setStatus("approved")}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {status !== "suspended" && (
        <button
          onClick={() => setStatus("suspended")}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Suspend
        </button>
      )}
      {status === "suspended" && (
        <button
          onClick={() => setStatus("pending")}
          disabled={pending}
          className="rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Reinstate as pending
        </button>
      )}
    </div>
  );
}
