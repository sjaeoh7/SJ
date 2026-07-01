import Link from "next/link";
import { eq, asc, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { pmTasks, pmSchedules, assets, properties } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatDate, titleCase } from "@/lib/format";
import { TaskActions } from "./task-actions";

export default async function MaintenancePage() {
  const session = await requireSession();

  const tasks = await db
    .select({
      id: pmTasks.id,
      dueDate: pmTasks.dueDate,
      status: pmTasks.status,
      workOrderId: pmTasks.workOrderId,
      scheduleTitle: pmSchedules.title,
      scheduleId: pmSchedules.id,
      category: pmSchedules.category,
      propertyName: properties.name,
    })
    .from(pmTasks)
    .innerJoin(pmSchedules, eq(pmTasks.scheduleId, pmSchedules.id))
    .innerJoin(properties, eq(pmSchedules.propertyId, properties.id))
    .where(eq(pmSchedules.orgId, session.orgId))
    .orderBy(asc(pmTasks.dueDate));

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const pastTasks = tasks.filter((t) => t.status === "complete" || t.status === "skipped").slice(0, 10);

  const schedules = await db
    .select({
      id: pmSchedules.id,
      title: pmSchedules.title,
      frequency: pmSchedules.frequency,
      nextDueAt: pmSchedules.nextDueAt,
      active: pmSchedules.active,
      propertyName: properties.name,
    })
    .from(pmSchedules)
    .innerJoin(properties, eq(pmSchedules.propertyId, properties.id))
    .where(eq(pmSchedules.orgId, session.orgId))
    .orderBy(desc(pmSchedules.createdAt));

  const assetRows = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      manufacturer: assets.manufacturer,
      propertyName: properties.name,
    })
    .from(assets)
    .innerJoin(properties, eq(assets.propertyId, properties.id))
    .where(eq(assets.orgId, session.orgId))
    .orderBy(desc(assets.createdAt));

  const today = new Date();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Preventative Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">Recurring upkeep for equipment and property assets.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/maintenance/assets/new"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Add asset
          </Link>
          <Link
            href="/dashboard/maintenance/schedules/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New PM schedule
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Upcoming &amp; overdue tasks</h2>
        {pendingTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing scheduled. Create a PM schedule to start generating tasks.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {pendingTasks.map((t) => {
              const overdue = new Date(t.dueDate) < today;
              return (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.scheduleTitle}</p>
                    <p className="text-xs text-slate-500">
                      {t.propertyName} · {titleCase(t.category)} · Due {formatDate(t.dueDate)}
                      {overdue && <span className="ml-2 font-medium text-red-600">Overdue</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.workOrderId ? (
                      <Link href={`/dashboard/work-orders/${t.workOrderId}`} className="text-xs font-medium text-slate-700 underline">
                        View work order
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/work-orders/new?pmTaskId=${t.id}`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Create work order
                      </Link>
                    )}
                    <TaskActions taskId={t.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">PM schedules</h2>
          {schedules.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No schedules yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {schedules.map((s) => (
                <li key={s.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {s.propertyName} · {titleCase(s.frequency)} · next {formatDate(s.nextDueAt)}
                    {!s.active && " · paused"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Assets</h2>
          {assetRows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No assets logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {assetRows.map((a) => (
                <li key={a.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.propertyName} · <Badge value={a.category} />
                    {a.manufacturer && ` · ${a.manufacturer}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pastTasks.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Recent history</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {pastTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {t.scheduleTitle} · {t.propertyName}
                </span>
                <Badge value={t.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
