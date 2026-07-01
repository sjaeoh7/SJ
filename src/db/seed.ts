/**
 * Demo data seed script. Run with: npm run db:seed
 * Creates one demo organization with a login you can use immediately.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const DEMO_EMAIL = "demo@upkeep.test";
const DEMO_PASSWORD = "password123";

async function main() {
  console.log("Seeding demo data...");

  const [org] = await db
    .insert(schema.organizations)
    .values({ name: "Maple Street Holdings" })
    .returning();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.insert(schema.users).values({
    orgId: org.id,
    name: "Jordan Lee",
    email: DEMO_EMAIL,
    passwordHash,
    role: "admin",
  });

  const [duplex, retailStrip] = await db
    .insert(schema.properties)
    .values([
      {
        orgId: org.id,
        name: "123 Maple St Duplex",
        address: "123 Maple St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        type: "residential",
      },
      {
        orgId: org.id,
        name: "Downtown Retail Strip",
        address: "45 Commerce Ave",
        city: "Springfield",
        state: "IL",
        zip: "62704",
        type: "retail",
      },
    ])
    .returning();

  const suppliersData = await db
    .insert(schema.suppliers)
    .values([
      {
        orgId: org.id,
        name: "Reliable Plumbing Co.",
        contactName: "Sam Rivera",
        email: "sam@reliableplumbing.test",
        phone: "555-0101",
        categories: ["plumbing"],
        status: "approved",
      },
      {
        orgId: org.id,
        name: "Bright Spark Electrical",
        contactName: "Dana Kim",
        email: "dana@brightspark.test",
        phone: "555-0102",
        categories: ["electrical"],
        status: "approved",
      },
      {
        orgId: org.id,
        name: "All-Season HVAC",
        contactName: "Pat Nguyen",
        email: "pat@allseasonhvac.test",
        phone: "555-0103",
        categories: ["hvac"],
        status: "approved",
      },
      {
        orgId: org.id,
        name: "Greenway Landscaping",
        contactName: "Alex Chen",
        email: "alex@greenway.test",
        phone: "555-0104",
        categories: ["landscaping"],
        status: "pending",
      },
    ])
    .returning();

  const [budgetCategoryPlumbing, budgetCategoryHvac, budgetCategoryRoof] = await db
    .insert(schema.budgetCategories)
    .values([
      { orgId: org.id, name: "Routine plumbing repairs", type: "opex" },
      { orgId: org.id, name: "HVAC servicing", type: "opex" },
      { orgId: org.id, name: "Roof replacement reserve", type: "capex" },
    ])
    .returning();

  const fiscalYear = new Date().getFullYear();
  const [budget] = await db
    .insert(schema.budgets)
    .values({
      orgId: org.id,
      propertyId: duplex.id,
      fiscalYear,
      name: `FY${fiscalYear} Operating Budget`,
    })
    .returning();

  await db.insert(schema.budgetLines).values([
    { budgetId: budget.id, categoryId: budgetCategoryPlumbing.id, type: "opex", plannedAmount: "2000.00" },
    { budgetId: budget.id, categoryId: budgetCategoryHvac.id, type: "opex", plannedAmount: "3000.00" },
    { budgetId: budget.id, categoryId: budgetCategoryRoof.id, type: "capex", plannedAmount: "15000.00" },
  ]);

  await db.insert(schema.assets).values({
    orgId: org.id,
    propertyId: duplex.id,
    name: "Rooftop HVAC unit",
    category: "hvac",
    manufacturer: "Carrier",
    model: "24ABC636A003",
  });

  const pmNextDueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [pmSchedule] = await db
    .insert(schema.pmSchedules)
    .values({
      orgId: org.id,
      propertyId: duplex.id,
      title: "Quarterly HVAC filter change",
      category: "hvac",
      frequency: "quarterly",
      nextDueAt: pmNextDueAt,
    })
    .returning();

  await db.insert(schema.pmTasks).values({ scheduleId: pmSchedule.id, dueDate: pmNextDueAt, status: "pending" });

  console.log("\nSeed complete.");
  console.log(`Organization: ${org.name}`);
  console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Properties: ${duplex.name}, ${retailStrip.name}`);
  console.log(`Suppliers: ${suppliersData.map((s) => s.name).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
