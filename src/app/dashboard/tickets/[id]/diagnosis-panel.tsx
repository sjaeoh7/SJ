"use client";

import { useActionState } from "react";
import { runDiagnosisAction } from "../actions";

type Diagnosis = {
  category: string;
  urgency: string;
  suggestedTrade: string;
  summary: string;
  recommendedNextSteps: string;
  confidence: number;
  model: string;
  createdAt: string | Date;
};

export function DiagnosisPanel({ ticketId, diagnosis }: { ticketId: string; diagnosis: Diagnosis | null }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, _formData: FormData) => runDiagnosisAction(ticketId),
    {},
  );

  if (diagnosis) {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-purple-900">AI Diagnosis</h2>
          <span className="text-xs text-purple-500">
            {Math.round(diagnosis.confidence * 100)}% confidence · {diagnosis.model}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-700">{diagnosis.summary}</p>
        <p className="mt-3 text-sm font-medium text-slate-900">Suggested trade: {diagnosis.suggestedTrade}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{diagnosis.recommendedNextSteps}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">AI Diagnosis</h2>
      <p className="mt-1 text-sm text-slate-500">
        Run an AI diagnosis to classify this ticket by trade category, assess urgency, and get
        recommended next steps before dispatching a work order.
      </p>
      <form action={formAction} className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
        >
          {pending ? "Diagnosing..." : "Run AI diagnosis"}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
