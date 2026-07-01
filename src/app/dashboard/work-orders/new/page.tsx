import Link from "next/link";
import { and, eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { properties, suppliers, tickets, ticketDiagnoses, pmTasks, pmSchedules } from "@/db/schema";
import { WorkOrderForm } from "./work-order-form";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ ticketId?: string; pmTaskId?: string }>;
}) {
  const { ticketId, pmTaskId } = await searchParams;
  const session = await requireSession();

  const propertyRows = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.orgId, session.orgId));

  const supplierRows = await db
    .select({ id: suppliers.id, name: suppliers.name, categories: suppliers.categories })
    .from(suppliers)
    .where(and(eq(suppliers.orgId, session.orgId), eq(suppliers.status, "approved")));

  let initial:
    | {
        ticketId?: string;
        pmTaskId?: string;
        propertyId: string;
        propertyName: string;
        title: string;
        description: string;
        priority: string;
        suggestedCategory: string | null;
      }
    | undefined;

  if (ticketId) {
    const ticket = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        priority: tickets.priority,
        category: tickets.category,
        propertyId: tickets.propertyId,
        propertyName: properties.name,
      })
      .from(tickets)
      .innerJoin(properties, eq(tickets.propertyId, properties.id))
      .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
      .then((rows) => rows[0]);

    if (ticket) {
      const diagnosis = await db
        .select()
        .from(ticketDiagnoses)
        .where(eq(ticketDiagnoses.ticketId, ticket.id))
        .orderBy(desc(ticketDiagnoses.createdAt))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      initial = {
        ticketId: ticket.id,
        propertyId: ticket.propertyId,
        propertyName: ticket.propertyName,
        title: ticket.title,
        description: diagnosis
          ? `${ticket.description}\n\n--- AI diagnosis ---\n${diagnosis.summary}\n${diagnosis.recommendedNextSteps}`
          : ticket.description,
        priority: ticket.priority,
        suggestedCategory: ticket.category,
      };
    }
  } else if (pmTaskId) {
    const task = await db
      .select({
        id: pmTasks.id,
        dueDate: pmTasks.dueDate,
        scheduleTitle: pmSchedules.title,
        scheduleDescription: pmSchedules.description,
        category: pmSchedules.category,
        propertyId: pmSchedules.propertyId,
        propertyName: properties.name,
      })
      .from(pmTasks)
      .innerJoin(pmSchedules, eq(pmTasks.scheduleId, pmSchedules.id))
      .innerJoin(properties, eq(pmSchedules.propertyId, properties.id))
      .where(and(eq(pmTasks.id, pmTaskId), eq(pmSchedules.orgId, session.orgId)))
      .then((rows) => rows[0]);

    if (task) {
      initial = {
        pmTaskId: task.id,
        propertyId: task.propertyId,
        propertyName: task.propertyName,
        title: task.scheduleTitle,
        description: task.scheduleDescription || `Preventative maintenance: ${task.scheduleTitle}`,
        priority: "medium",
        suggestedCategory: task.category,
      };
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">New work order</h1>

      {propertyRows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You need at least one property first.{" "}
          <Link href="/dashboard/properties/new" className="font-medium underline">
            Add a property
          </Link>
          .
        </p>
      ) : (
        <WorkOrderForm properties={propertyRows} suppliers={supplierRows} initial={initial} />
      )}
    </div>
  );
}
