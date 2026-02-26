# Solvix ERP

**Solvix ERP** is a modern, multi-tenant ERP web application built for high-velocity operations teams that need finance, inventory, procurement, sales, HR, and project visibility in one command center.

Designed with a futuristic **Quantum template** interface, Solvix ERP combines HUD-inspired visuals, glass-like surfaces, responsive workflows, and production-focused architecture for real-world business execution.

## Product Positioning

Solvix ERP is for organizations that outgrow disconnected tools and need:
- One operational backbone across branches and departments
- Fast approvals and execution from mobile devices
- Strong governance, traceability, and role-based control
- Premium UI/UX without sacrificing performance and maintainability

## What Makes It Different

- **Multi-tenant by design**: Organization and branch-level boundaries are first-class in the data model and API layer.
- **Operationally realistic workflows**: Purchase Request -> Approval -> Purchase Order -> Stock Receive, plus Invoice Draft -> Issued -> Paid.
- **Built-in governance**: RBAC, audit logs for critical actions, scoped queries to prevent IDOR-style access leaks.
- **Command-first usability**: Global command palette (`Ctrl/Cmd+K`), global search, touch-friendly approval inbox, and table tooling for day-to-day operations.
- **Production-ready stack**: Modern Next.js architecture, strict validation with Zod, Prisma/PostgreSQL, tested UI and workflows, containerized delivery.

## Core Capabilities

### Executive Overview
- KPI cards (revenue, expenses, net profit, AR/AP, low stock, pending approvals)
- Net profit presentation with sign-aware formatting and tone (positive/negative/neutral)
- Trend and breakdown analytics (Recharts)
- Recent activity feed from transactional modules

### Sales
- Customer management
- Invoice lifecycle (draft, issue, payment)
- Payment recording and print-ready invoice view
- Search, filtering, and CSV export

### Inventory
- Product catalog with pricing and thresholds
- Branch-level stock levels
- Stock movement journal (IN / OUT / TRANSFER)
- Automatic stock impact from sales and procurement events

### Procurement & Approvals
- Supplier management
- Purchase Requests with submission flow
- Manager approval inbox (approve/reject with notes)
- Purchase Orders created from approved PRs
- Stock receiving from PO

### Finance (Lite but Practical)
- Expense tracking and approval integration
- Journal entries with debit/credit balance validation
- P&L signal from sales and expense data
- CSV export for reporting workflows

### HR (Simplified)
- Employee records
- Attendance summary
- Payroll summary placeholder based on base salary data

### Projects
- Project CRUD
- Lightweight Kanban board (Backlog / In Progress / Done)
- Task assignment to employees

## Experience & Design Language

- Quantum visual system with grid atmosphere, soft neon accents, and translucent panel surfaces
- Responsive by default:
  - **Mobile**: approval-first navigation and bottom action flow
  - **Tablet**: operational touch-friendly layout
  - **Desktop**: full command center with fixed sidebar and scrollable workspace
- Accessibility-aware behavior including high-contrast mode and reduced-motion support

## Security & Compliance-Oriented Foundations

- NextAuth credentials-based authentication
- Role tiers: `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGER`, `STAFF`, `VIEWER`
- Scoped server-side authorization for protected application routes
- Tenant-safe query scoping by org/branch
- Audit logging for create/update/delete, approvals, status transitions, and postings

## Technical Foundation

- **Frontend**: Next.js App Router, TypeScript, TailwindCSS, Radix-based UI, lucide-react
- **State**: TanStack Query (server state), Zustand (UI state)
- **Data & Auth**: Prisma, PostgreSQL, NextAuth
- **Validation**: Zod on API payloads
- **Data Grids**: TanStack Table
- **Visualization**: Recharts
- **Quality**: Vitest + Playwright
- **Delivery**: Dockerfile + docker-compose

## Repository Planning

Architecture map and responsive wireframes are documented in:
- [docs/PLAN.md](docs/PLAN.md)

## Vercel Runtime Checklist

For stable production behavior on Vercel, the deployment environment must include:
- `DATABASE_URL` pointing to your production PostgreSQL instance
- `NEXTAUTH_SECRET` (strong random string)
- `NEXTAUTH_URL` set to your exact deployed URL (for example: `https://dashboarderp.vercel.app`)

Database schema and demo identity must exist in the production database:
- Run Prisma migrations (`prisma migrate deploy`)
- Seed production/demo data when needed (`prisma db seed`)
