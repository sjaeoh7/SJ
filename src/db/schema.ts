import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
// Value lists are exported as plain arrays too, so Zod schemas (AI diagnosis)
// and UI <select> options can share the exact same source of truth as the DB.

export const USER_ROLES = ["admin", "manager", "staff"] as const;
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const PROPERTY_TYPES = ["residential", "retail", "commercial", "mixed_use"] as const;
export const propertyTypeEnum = pgEnum("property_type", PROPERTY_TYPES);

export const TRADE_CATEGORIES = [
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "roofing",
  "pest_control",
  "landscaping",
  "cleaning",
  "security",
  "general_handyman",
  "other",
] as const;
export const tradeCategoryEnum = pgEnum("trade_category", TRADE_CATEGORIES);

export const PRIORITIES = ["low", "medium", "high", "emergency"] as const;
export const priorityEnum = pgEnum("priority", PRIORITIES);

export const TICKET_STATUSES = [
  "new",
  "diagnosed",
  "work_order_created",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
] as const;
export const ticketStatusEnum = pgEnum("ticket_status", TICKET_STATUSES);

export const SUPPLIER_STATUSES = ["pending", "approved", "suspended"] as const;
export const supplierStatusEnum = pgEnum("supplier_status", SUPPLIER_STATUSES);

export const WORK_ORDER_STATUSES = [
  "draft",
  "sent",
  "acknowledged",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export const workOrderStatusEnum = pgEnum("work_order_status", WORK_ORDER_STATUSES);

export const COST_TYPES = ["opex", "capex"] as const;
export const costTypeEnum = pgEnum("cost_type", COST_TYPES);

export const QUOTE_STATUSES = [
  "requested",
  "submitted",
  "approved",
  "rejected",
  "expired",
] as const;
export const quoteStatusEnum = pgEnum("quote_status", QUOTE_STATUSES);

export const PM_FREQUENCIES = [
  "weekly",
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "custom_days",
] as const;
export const pmFrequencyEnum = pgEnum("pm_frequency", PM_FREQUENCIES);

export const PM_TASK_STATUSES = ["pending", "in_progress", "complete", "skipped"] as const;
export const pmTaskStatusEnum = pgEnum("pm_task_status", PM_TASK_STATUSES);

export type UserRole = (typeof USER_ROLES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type TradeCategory = (typeof TRADE_CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];
export type CostType = (typeof COST_TYPES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type PmFrequency = (typeof PM_FREQUENCIES)[number];
export type PmTaskStatus = (typeof PM_TASK_STATUSES)[number];

// ---------- Core / tenancy ----------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("manager"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  address: varchar("address", { length: 300 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 60 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  type: propertyTypeEnum("type").notNull().default("residential"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Tickets & AI diagnosis ----------

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("new"),
  priority: priorityEnum("priority").notNull().default("medium"),
  category: tradeCategoryEnum("category"),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ticketDiagnoses = pgTable("ticket_diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  category: tradeCategoryEnum("category").notNull(),
  urgency: priorityEnum("urgency").notNull(),
  suggestedTrade: varchar("suggested_trade", { length: 200 }).notNull(),
  summary: text("summary").notNull(),
  recommendedNextSteps: text("recommended_next_steps").notNull(),
  confidence: real("confidence").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Suppliers ----------

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  categories: tradeCategoryEnum("categories").array().notNull().default([]),
  status: supplierStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Work orders & quotes ----------

export const workOrders = pgTable("work_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  status: workOrderStatusEnum("status").notNull().default("draft"),
  priority: priorityEnum("priority").notNull().default("medium"),
  costType: costTypeEnum("cost_type").notNull().default("opex"),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 12, scale: 2 }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  budgetLineId: uuid("budget_line_id"),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  laborCost: numeric("labor_cost", { precision: 12, scale: 2 }),
  materialsCost: numeric("materials_cost", { precision: 12, scale: 2 }),
  notes: text("notes"),
  status: quoteStatusEnum("status").notNull().default("requested"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedById: uuid("decided_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Preventative maintenance ----------

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  category: tradeCategoryEnum("category").notNull().default("general_handyman"),
  manufacturer: varchar("manufacturer", { length: 200 }),
  model: varchar("model", { length: 200 }),
  serialNumber: varchar("serial_number", { length: 200 }),
  installedAt: timestamp("installed_at", { withTimezone: true }),
  warrantyExpiresAt: timestamp("warranty_expires_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmSchedules = pgTable("pm_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: tradeCategoryEnum("category").notNull().default("general_handyman"),
  frequency: pmFrequencyEnum("frequency").notNull().default("monthly"),
  customIntervalDays: integer("custom_interval_days"),
  nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmTasks = pgTable("pm_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  scheduleId: uuid("schedule_id").notNull().references(() => pmSchedules.id, { onDelete: "cascade" }),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: pmTaskStatusEnum("status").notNull().default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- OpEx / CapEx budgeting ----------

export const budgetCategories = pgTable("budget_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  type: costTypeEnum("type").notNull().default("opex"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fiscalYear: integer("fiscal_year").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgetLines = pgTable("budget_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  budgetId: uuid("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => budgetCategories.id),
  type: costTypeEnum("type").notNull().default("opex"),
  plannedAmount: numeric("planned_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  budgetLineId: uuid("budget_line_id").references(() => budgetLines.id, { onDelete: "set null" }),
  workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => budgetCategories.id),
  type: costTypeEnum("type").notNull().default("opex"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 300 }).notNull(),
  incurredAt: timestamp("incurred_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Relations (for query API convenience) ----------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  properties: many(properties),
  suppliers: many(suppliers),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  org: one(organizations, { fields: [properties.orgId], references: [organizations.id] }),
  units: many(units),
  tickets: many(tickets),
  workOrders: many(workOrders),
  assets: many(assets),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  property: one(properties, { fields: [units.propertyId], references: [properties.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  property: one(properties, { fields: [tickets.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [tickets.unitId], references: [units.id] }),
  createdBy: one(users, { fields: [tickets.createdById], references: [users.id] }),
  diagnoses: many(ticketDiagnoses),
  workOrders: many(workOrders),
}));

export const ticketDiagnosesRelations = relations(ticketDiagnoses, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketDiagnoses.ticketId], references: [tickets.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  workOrders: many(workOrders),
  quotes: many(quotes),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  ticket: one(tickets, { fields: [workOrders.ticketId], references: [tickets.id] }),
  property: one(properties, { fields: [workOrders.propertyId], references: [properties.id] }),
  supplier: one(suppliers, { fields: [workOrders.supplierId], references: [suppliers.id] }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  workOrder: one(workOrders, { fields: [quotes.workOrderId], references: [workOrders.id] }),
  supplier: one(suppliers, { fields: [quotes.supplierId], references: [suppliers.id] }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  property: one(properties, { fields: [assets.propertyId], references: [properties.id] }),
  schedules: many(pmSchedules),
}));

export const pmSchedulesRelations = relations(pmSchedules, ({ one, many }) => ({
  property: one(properties, { fields: [pmSchedules.propertyId], references: [properties.id] }),
  asset: one(assets, { fields: [pmSchedules.assetId], references: [assets.id] }),
  tasks: many(pmTasks),
}));

export const pmTasksRelations = relations(pmTasks, ({ one }) => ({
  schedule: one(pmSchedules, { fields: [pmTasks.scheduleId], references: [pmSchedules.id] }),
  workOrder: one(workOrders, { fields: [pmTasks.workOrderId], references: [workOrders.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  property: one(properties, { fields: [budgets.propertyId], references: [properties.id] }),
  lines: many(budgetLines),
}));

export const budgetLinesRelations = relations(budgetLines, ({ one, many }) => ({
  budget: one(budgets, { fields: [budgetLines.budgetId], references: [budgets.id] }),
  category: one(budgetCategories, { fields: [budgetLines.categoryId], references: [budgetCategories.id] }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, { fields: [expenses.propertyId], references: [properties.id] }),
  budgetLine: one(budgetLines, { fields: [expenses.budgetLineId], references: [budgetLines.id] }),
  workOrder: one(workOrders, { fields: [expenses.workOrderId], references: [workOrders.id] }),
  category: one(budgetCategories, { fields: [expenses.categoryId], references: [budgetCategories.id] }),
}));
