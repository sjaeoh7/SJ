import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logoutAction } from "../(auth)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/properties", label: "Properties" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/work-orders", label: "Work Orders" },
  { href: "/dashboard/quotes", label: "Quotes" },
  { href: "/dashboard/suppliers", label: "Suppliers" },
  { href: "/dashboard/maintenance", label: "Maintenance" },
  { href: "/dashboard/budget", label: "Budget (OpEx/CapEx)" },
  { href: "/dashboard/reports", label: "Reports" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">Upkeep</div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-3 py-4">
          <p className="truncate px-3 text-sm font-medium text-white">{session.name}</p>
          <p className="truncate px-3 text-xs text-slate-400">{session.email}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
