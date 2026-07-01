"use client";

import { useTransition } from "react";
import { completePmTaskAction, skipPmTaskAction } from "./actions";

export function TaskActions({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => completePmTaskAction(taskId))}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Mark complete
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => skipPmTaskAction(taskId))}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
      >
        Skip
      </button>
    </div>
  );
}
