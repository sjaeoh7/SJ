import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { Badge } from "@/components/badge";

export default async function SuppliersPage() {
  const session = await requireSession();

  const rows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.orgId, session.orgId))
    .orderBy(desc(suppliers.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Preapproved vendors that work orders can be dispatched to.
          </p>
        </div>
        <Link
          href="/dashboard/suppliers/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add supplier
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No suppliers yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/suppliers/${s.id}`} className="font-medium text-slate-900 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.categories.map((c) => (
                        <Badge key={c} value={c} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.email || s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge value={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
