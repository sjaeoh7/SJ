import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets, properties, units, ticketDiagnoses, workOrders, users } from "@/db/schema";
import { Badge } from "@/components/badge";
import { formatDateTime } from "@/lib/format";
import { DiagnosisPanel } from "./diagnosis-panel";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const ticket = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      priority: tickets.priority,
      category: tickets.category,
      createdAt: tickets.createdAt,
      propertyId: tickets.propertyId,
      propertyName: properties.name,
      unitName: units.name,
      createdByName: users.name,
    })
    .from(tickets)
    .innerJoin(properties, eq(tickets.propertyId, properties.id))
    .leftJoin(units, eq(tickets.unitId, units.id))
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, id), eq(tickets.orgId, session.orgId)))
    .then((rows) => rows[0]);

  if (!ticket) notFound();

  const diagnosis = await db
    .select()
    .from(ticketDiagnoses)
    .where(eq(ticketDiagnoses.ticketId, id))
    .orderBy(desc(ticketDiagnoses.createdAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const linkedWorkOrders = await db
    .select({ id: workOrders.id, title: workOrders.title, status: workOrders.status })
    .from(workOrders)
    .where(eq(workOrders.ticketId, id));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/tickets" className="text-sm text-slate-500 hover:underline">
          ← Back to tickets
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.propertyName}
              {ticket.unitName ? ` · Unit ${ticket.unitName}` : ""} · Submitted by {ticket.createdByName} on{" "}
              {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge value={ticket.priority} />
            {ticket.category && <Badge value={ticket.category} />}
            <Badge value={ticket.status} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
      </div>

      <DiagnosisPanel
        ticketId={ticket.id}
        diagnosis={
          diagnosis && {
            category: diagnosis.category,
            urgency: diagnosis.urgency,
            suggestedTrade: diagnosis.suggestedTrade,
            summary: diagnosis.summary,
            recommendedNextSteps: diagnosis.recommendedNextSteps,
            confidence: diagnosis.confidence,
            model: diagnosis.model,
            createdAt: diagnosis.createdAt,
          }
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Work orders</h2>
          <Link
            href={`/dashboard/work-orders/new?ticketId=${ticket.id}`}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Create work order
          </Link>
        </div>
        {linkedWorkOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No work orders created yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {linkedWorkOrders.map((wo) => (
              <li key={wo.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <Link href={`/dashboard/work-orders/${wo.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {wo.title}
                </Link>
                <Badge value={wo.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
