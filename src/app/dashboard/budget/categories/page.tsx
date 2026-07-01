import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { budgetCategories } from "@/db/schema";
import { Badge } from "@/components/badge";
import { CategoryForm } from "./category-form";

export default async function BudgetCategoriesPage() {
  const session = await requireSession();

  const rows = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.orgId, session.orgId))
    .orderBy(desc(budgetCategories.createdAt));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Budget categories</h1>
      <p className="mt-1 text-sm text-slate-500">
        Categories classify budget lines and expenses as OpEx or CapEx, e.g. &quot;Routine plumbing repairs&quot;
        (OpEx) vs. &quot;Roof replacement&quot; (CapEx).
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-900">{c.name}</span>
                <Badge value={c.type} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <CategoryForm />
    </div>
  );
}
