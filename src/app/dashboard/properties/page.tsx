import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { Badge } from "@/components/badge";

export default async function PropertiesPage() {
  const session = await requireSession();

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.orgId, session.orgId))
    .orderBy(desc(properties.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">Portfolio of properties under management.</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add property
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No properties yet.{" "}
            <Link href="/dashboard/properties/new" className="font-medium underline">
              Add your first property
            </Link>{" "}
            to start creating tickets.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.address}, {p.city}, {p.state} {p.zip}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={p.type} />
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
