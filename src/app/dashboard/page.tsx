import Link from "next/link";
import { eq, and, ne, asc, desc, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets, workOrders, properties, pmTasks, pmSchedules, suppliers } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatDate } from "@/lib/format";

export default async function DashboardOverviewPage() {
  const session = await requireSession();

  const [openTicketsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(and(eq(tickets.orgId, session.orgId), ne(tickets.status, "closed"), ne(tickets.status, "cancelled")));

  const [activeWorkOrdersCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workOrders)
    .where(
      and(eq(workOrders.orgId, session.orgId), ne(workOrders.status, "completed"), ne(workOrders.status, "cancelled")),
    );

  const [propertyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .where(eq(properties.orgId, session.orgId));

  const [approvedSupplierCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(suppliers)
    .where(and(eq(suppliers.orgId, session.orgId), eq(suppliers.status, "approved")));

  const recentTickets = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      status: tickets.status,
      priority: tickets.priority,
      propertyName: properties.name,
    })
    .from(tickets)
    .innerJoin(properties, eq(tickets.propertyId, properties.id))
    .where(eq(tickets.orgId, session.orgId))
    .orderBy(desc(tickets.createdAt))
    .limit(5);

  const upcomingPmTasks = await db
    .select({
      id: pmTasks.id,
      dueDate: pmTasks.dueDate,
      title: pmSchedules.title,
      propertyName: properties.name,
    })
    .from(pmTasks)
    .innerJoin(pmSchedules, eq(pmTasks.scheduleId, pmSchedules.id))
    .innerJoin(properties, eq(pmSchedules.propertyId, properties.id))
    .where(and(eq(pmSchedules.orgId, session.orgId), eq(pmTasks.status, "pending")))
    .orderBy(asc(pmTasks.dueDate))
    .limit(5);

  const stats = [
    { label: "Open tickets", value: openTicketsCount.count, href: "/dashboard/tickets" },
    { label: "Active work orders", value: activeWorkOrdersCount.count, href: "/dashboard/work-orders" },
    { label: "Properties", value: propertyCount.count, href: "/dashboard/properties" },
    { label: "Approved suppliers", value: approvedSupplierCount.count, href: "/dashboard/suppliers" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {session.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening across your portfolio.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent tickets</h2>
            <Link href="/dashboard/tickets/new" className="text-xs font-medium text-slate-600 hover:underline">
              New ticket
            </Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No tickets yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentTickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500">{t.propertyName}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge value={t.priority} />
                    <Badge value={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming maintenance</h2>
            <Link href="/dashboard/maintenance" className="text-xs font-medium text-slate-600 hover:underline">
              View all
            </Link>
          </div>
          {upcomingPmTasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing scheduled.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {upcomingPmTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.propertyName}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(t.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
