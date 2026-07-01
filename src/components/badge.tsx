import { titleCase } from "@/lib/format";

const COLOR_MAP: Record<string, string> = {
  // priority / urgency
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  emergency: "bg-red-100 text-red-700",
  // ticket / work order status
  new: "bg-blue-100 text-blue-700",
  diagnosed: "bg-purple-100 text-purple-700",
  work_order_created: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
  cancelled: "bg-slate-200 text-slate-500",
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  acknowledged: "bg-indigo-100 text-indigo-700",
  scheduled: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  // supplier / quote status
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
  requested: "bg-blue-100 text-blue-700",
  submitted: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
  // opex/capex
  opex: "bg-teal-100 text-teal-700",
  capex: "bg-fuchsia-100 text-fuchsia-700",
};

export function Badge({ value }: { value: string }) {
  const color = COLOR_MAP[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {titleCase(value)}
    </span>
  );
}
