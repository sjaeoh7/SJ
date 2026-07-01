import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { BudgetForm } from "./budget-form";

export default async function NewBudgetPage() {
  const session = await requireSession();
  const propertyRows = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.orgId, session.orgId));

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">New budget</h1>
      {propertyRows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add a property first.{" "}
          <Link href="/dashboard/properties/new" className="font-medium underline">
            Add a property
          </Link>
        </p>
      ) : (
        <BudgetForm properties={propertyRows} />
      )}
    </div>
  );
}
