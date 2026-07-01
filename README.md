# Upkeep — Facilities Management SaaS

A multi-tenant facilities management platform for small residential, retail, and
commercial properties that don't have an on-site facilities manager. Tenants and
staff submit maintenance tickets, an AI diagnosis step classifies the issue and
urgency, and work orders are dispatched to preapproved suppliers — with quotes,
preventative maintenance schedules, and OpEx/CapEx budget tracking built in.

## Stack

- **Next.js 16** (App Router, Server Actions)
- **PostgreSQL** with **Drizzle ORM** (`drizzle-orm` + `pg`, no native binary engine)
- **Auth**: custom signed-cookie sessions (`jose` + `bcryptjs`) — no third-party auth service
- **AI ticket diagnosis**: `@anthropic-ai/sdk` calling Claude with structured output (Zod schema)
- **Tailwind CSS v4**

## Modules

| Module | What it does |
| --- | --- |
| Properties | Portfolio of managed properties (residential/retail/commercial/mixed-use) |
| Tickets | Tenant/staff-submitted maintenance requests, with AI diagnosis (trade category, urgency, next steps) |
| Suppliers | Preapproved vendor directory with trade categories and approval status |
| Work Orders | Dispatch work to a supplier, track status through completion, tied to OpEx/CapEx |
| Quotes | Request, record, and approve/reject supplier quotes per work order |
| Preventative Maintenance | Assets + recurring PM schedules that auto-generate upcoming tasks |
| Budget (OpEx/CapEx) | Per-property annual budgets, budget lines by category, and an expense ledger with planned-vs-actual tracking (auto-populated when a work order is completed) |
| Reports | Portfolio-wide rollups: spend by category/type, budget vs. actual, ticket/work-order/supplier breakdowns |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — a Postgres connection string.
- `SESSION_SECRET` — random 32-byte secret (`openssl rand -base64 32`).
- `ANTHROPIC_API_KEY` — required for the AI ticket diagnosis feature. Get one at
  [console.anthropic.com](https://console.anthropic.com/). Without it, everything
  else in the app works — the "Run AI diagnosis" button will show a clear error
  instead of crashing.
- `ANTHROPIC_DIAGNOSIS_MODEL` — defaults to `claude-opus-4-8` (most accurate). For
  high ticket volume where cost matters more than squeezing out the last bit of
  accuracy, set this to `claude-haiku-4-5`.

### 3. Set up the database

Push the schema to your Postgres instance (no migration files needed for local dev):

```bash
npm run db:push
```

Seed demo data (an organization, login, two properties, four suppliers, a budget,
an asset, and a PM schedule):

```bash
npm run db:seed
```

This prints a login you can use immediately: `demo@upkeep.test` / `password123`.

Alternatively, visit `/signup` to create your own organization from scratch.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Golden path to try

1. Log in (or sign up).
2. **Properties** → confirm/add a property.
3. **Tickets** → New ticket → describe an issue (e.g. "Kitchen sink is leaking under the cabinet, water pooling on the floor").
4. Open the ticket → **Run AI diagnosis** → see trade category, urgency, and recommended next steps.
5. **Create work order** from the ticket (prefilled from the diagnosis) → assign an approved supplier.
6. On the work order, **request a quote** from the supplier, record the quote amount, then **approve** it.
7. Advance the work order status through to **Mark completed** — enter the actual cost and (optionally) apply it to a budget line. This automatically logs an expense.
8. **Budget** → see planned vs. actual update for that line. **Reports** → see portfolio-wide rollups.
9. **Maintenance** → add an asset and a recurring PM schedule; mark a generated task complete to see the next occurrence auto-generate.

## Notes on infrastructure choices

- **Drizzle instead of Prisma**: Prisma's engine-binary postinstall download was
  unreliable in this environment (consistent `ECONNRESET` through the sandboxed
  network proxy, even though the same binary downloaded fine via `curl`). Drizzle
  + `pg` has no native binary to fetch, so it was substituted to keep the build
  reproducible. Functionally equivalent for this app's needs.
- **Custom auth instead of NextAuth/Auth.js**: kept dependency-light and avoids
  any compatibility uncertainty with the very new Next.js major version pinned
  in this project (16.2.9). Sessions are HMAC-signed JWTs in an httpOnly cookie.
- Multi-tenancy is enforced by scoping every query to `orgId` from the signed
  session — there is no shared/public data between organizations.
