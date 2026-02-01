# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `bun dev` - Start all packages in parallel (web app on port 3000)
- `bun dev:web` - Start only the web app
- `bun --filter @repo/web preview` - Preview with Cloudflare Workers locally

**Code Quality:**
- `bun run check` - Run format, lint, and type-check (use before committing)
- `bun run lint` - ESLint only
- `bun run check-types` - TypeScript type checking only
- `bun run format` - Prettier formatting

**Database (Drizzle + D1):**
- `bun db generate` - Generate migrations from schema changes
- `bun db push` - Push schema directly (dev only)
- `bun db studio` - Open Drizzle Studio
- `bun d1:create` - Create D1 database
- `bun d1:migrate` - Run migrations locally
- `bun d1:migrate:prod` - Run migrations on production

**UI Components:**
- `bun ui:web` - Run shadcn CLI to add components to web app

**Build & Production:**
- `bun run build` - Build all packages
- `bun run deploy` - Build and deploy to Cloudflare Workers

## Architecture

**Monorepo Structure (Turborepo + Bun workspaces):**
- `apps/web` - TanStack Start application (React 19 + React Compiler)
- `packages/db` - Drizzle ORM + D1 SQLite schema
- `packages/ui` - Shared UI components (shadcn/ui)
- `tooling/` - Shared ESLint and TypeScript configs

**Tech Stack:**
- TanStack Start/Router/Query for full-stack React
- Vite + @cloudflare/vite-plugin for bundling
- Cloudflare Workers + D1 for deployment
- Tailwind CSS v4 + shadcn/ui for styling
- Drizzle ORM with D1 (SQLite)
- Jotai for client state management
- dnd-kit for drag and drop

**Key Patterns:**

*File-based routing:* Routes live in `apps/web/src/routes/`. The file `routeTree.gen.ts` is auto-generated - never edit it.

*Server functions:* Server-side logic lives in `apps/web/src/server/`. Uses TanStack Start `createServerFn()` with `inputValidator()` for type-safe validation.

*D1 Database access:* Use `getDb()` from `~/lib/db` in server functions to access the D1 binding. Uses `import { env } from "cloudflare:workers"` to access Cloudflare bindings.

*Database schema:* Define tables in `packages/db/src/schema/`. Uses SQLite (D1) with snake_case convention.

*Import aliases:* Use `~/` to reference `src/` within each package (e.g., `import { foo } from "~/components/foo"`).

*State management:*
- Server state: TanStack Query
- UI state: Jotai atoms in `apps/web/src/stores/`

## Kanban Components

**Board Components (`apps/web/src/components/kanban/`):**
- `board.tsx` - Main board with DndContext and column layout
- `column.tsx` - Sortable column with cards
- `card.tsx` - Draggable card component
- `card-dialog.tsx` - Create/edit card modal
- `filter-bar.tsx` - Priority and tag filters
- `grouped-column.tsx` - Column for grouped views (by priority/tag)

**Server Functions (`apps/web/src/server/`):**
- `boards.ts` - Board and column CRUD operations
- `cards.ts` - Card CRUD and move operations

**Hooks (`apps/web/src/hooks/`):**
- `use-board.ts` - Board data query
- `use-cards.ts` - Card mutations
- `use-columns.ts` - Column mutations

**State (`apps/web/src/stores/`):**
- `kanban.ts` - Jotai atoms for filters, grouping, dialog state, drag state

## Environment Variables

For Drizzle migrations (in `packages/db/.env`):
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_D1_ID` - D1 database ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token

Update `apps/web/wrangler.jsonc` with your D1 database_id after running `bun d1:create`.

**Cloudflare Type Generation:**
- `bun --filter @repo/web cf-typegen` - Generate TypeScript types for Cloudflare bindings
