import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets, properties } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatDate } from "@/lib/format";

export default async function TicketsPage() {
  const session = await requireSession();

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      status: tickets.status,
      priority: tickets.priority,
      category: tickets.category,
      createdAt: tickets.createdAt,
      propertyName: properties.name,
    })
    .from(tickets)
    .innerJoin(properties, eq(tickets.propertyId, properties.id))
    .where(eq(tickets.orgId, session.orgId))
    .orderBy(desc(tickets.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            Maintenance requests submitted for your properties.
          </p>
        </div>
        <Link
          href="/dashboard/tickets/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New ticket
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No tickets yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/tickets/${t.id}`} className="font-medium text-slate-900 hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.propertyName}</td>
                  <td className="px-4 py-3">{t.category ? <Badge value={t.category} /> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <Badge value={t.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={t.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
