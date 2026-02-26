# Solvix ERP - Repo Plan

## Architecture Notes
- Framework: Next.js App Router + TypeScript.
- UI: TailwindCSS + shadcn-style components (Radix primitives) + lucide-react.
- Data: PostgreSQL + Prisma with multi-tenant scoping (`orgId`, `branchId`).
- Auth: NextAuth credentials with JWT session enrichment (`role`, `orgId`, `branchId`).
- State: TanStack Query for server state and Zustand for UI states (sidebar, command palette, contrast).
- Validation: Zod for all create/update payloads on API routes.
- Data Grid: TanStack Table with sorting/filtering/pagination.

## File Tree (High Level)
```text
app/
  page.tsx                        # Landing page
  (auth)/login/page.tsx           # Login
  (erp)/app/
    layout.tsx                    # Protected app shell
    page.tsx                      # Overview
    analytics/page.tsx
    sales/page.tsx
    inventory/page.tsx
    procurement/page.tsx
    finance/page.tsx
    hr/page.tsx
    projects/page.tsx
    settings/page.tsx
    approvals/page.tsx
    audit-logs/page.tsx
  api/
    auth/[...nextauth]/route.ts
    overview/route.ts
    search/route.ts
    approvals/route.ts
    sales/{customers,invoices,payments}/route.ts
    inventory/{products,movements}/route.ts
    procurement/{suppliers,purchase-requests,purchase-orders}/route.ts
    finance/{expenses,journal-entries}/route.ts
    hr/{employees,attendance}/route.ts
    projects/projects/route.ts
    settings/branches/route.ts
    audit-logs/route.ts
    export/{invoices,products,expenses}/route.ts
components/
  layout/*                        # Sidebar/topbar/mobile nav/command palette
  modules/*                       # Module pages (overview, sales, etc.)
  tables/data-table.tsx           # TanStack table wrapper
  charts/*                        # Recharts widgets
  ui/*                            # shadcn-style UI primitives
lib/
  auth.ts, session.ts, permissions.ts, prisma.ts
  schemas/index.ts, audit.ts, csv.ts, format.ts
stores/
  ui-store.ts
prisma/
  schema.prisma
  migrations/0001_init/migration.sql
  seed.ts
tests/
  unit/*
  e2e/*
```

## Wireframe Notes
### Mobile
- Top compact command bar + quick controls.
- Scroll cards for KPI and approval inbox.
- Bottom nav: Overview, Approvals, Sales, Inventory, More.

### Tablet
- Sidebar collapsed by default.
- Touch-friendly controls and larger tap targets.
- 2-column data surfaces for KPI/charts and list panels.

### Desktop
- Full left sidebar (collapsible), top command bar, main content grid.
- Glass-like cards with subtle HUD grid background.
- Keyboard-first workflow with command palette (`Ctrl/Cmd + K`).
```
