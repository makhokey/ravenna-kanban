# Ravenna Kanban

A modern Kanban board application built with TanStack Start and deployed on Cloudflare Workers.

**Live Demo:** https://ravenna-kanban.paperslab.workers.dev/

## Requirements Checklist

### Frontend Requirements

- [x] Create, edit, delete cards
- [x] Move cards between columns (drag-and-drop)
- [x] Reorder cards within column
- [x] Filter by attribute (priority, tags)
- [x] Group by attribute (status, priority)
- [x] TypeScript with strict mode
- [x] Tests for core logic

### Backend Requirements

- [x] Type-safe with TypeScript
- [x] Input validation (Zod schemas)
- [x] Basic logging (Pino)
- [x] Basic tests (API validation)
- [x] CRUD operations for cards
- [x] Move cards between columns
- [x] Reorder cards with position updates
- [x] List cards with filters
- [x] Persistent storage (D1 SQLite)

### Extended Features

- [x] Card details side panel
- [x] Dark mode support
- [x] Mobile responsive (touch DnD)
- [x] Soft delete (deletedAt timestamp)
- [x] Database migrations (Drizzle)
- [x] Multi-board support with URL slugs
- [x] Per-board card ID prefixes (MYP-1, BUG-2)
- [x] Virtual scrolling for large boards

## Design Notes

- Uses **TanStack Start** with TanStack Router and TanStack Query
- All mutations managed via **TanStack Query with optimistic updates**
- Server-side rendering with TanStack Start for optimal performance
- **TanStack Router preloading** prefetches data and components
- When deployed, pages are served from **Cloudflare's edge network**
- Uses **Drizzle ORM** on top of Cloudflare D1
- **Jotai atoms** for UI state (filters, dialogs, drag state)
- **dnd-kit** for accessible drag-and-drop with touch support
- **Fractional indexing** for O(1) position updates
- **Cookie-based settings** persistence (no auth required)
- **Virtualized card lists** (virtua) for performance

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start/latest) + [Router](https://tanstack.com/router/latest) + [Query](https://tanstack.com/query/latest)
- **Runtime:** [Bun](https://bun.sh/) + [Turborepo](https://turborepo.com/)
- **UI:** [React 19](https://react.dev) + [React Compiler](https://react.dev/learn/react-compiler)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) + [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **State:** [Jotai](https://jotai.org/) + [TanStack Query](https://tanstack.com/query/latest)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/)

## Features

- Drag and drop cards between columns
- Create, edit, and delete cards
- Priority levels (none, low, medium, high, urgent)
- Tag support (bug, feature, enhancement, documentation, refactor, testing)
- Filter by priority or tag
- Group by status or priority
- Sort by manual order, created date, or updated date
- Show/hide columns
- Dark mode support
- Settings persisted in cookies

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Cloudflare account](https://dash.cloudflare.com/) (for D1 and deployment)

### Fork Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/makhokey/ravenna-kanban.git
   cd ravenna-kanban
   bun install
   ```

2. **Login to Cloudflare**
   ```bash
   bunx wrangler login
   ```

3. **Create a D1 database**
   ```bash
   bunx wrangler d1 create ravenna-kanban-db
   ```
   This outputs a `database_id` - copy it for the next step.

4. **Update `apps/web/wrangler.jsonc`**
   Replace the `database_id` with your own:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "ravenna-kanban-db",
       "database_id": "YOUR_DATABASE_ID_HERE",
       "migrations_dir": "../../packages/db/drizzle"
     }
   ]
   ```

   Optionally remove the `kv_namespaces` section if you don't need caching:
   ```jsonc
   // Remove or comment out if not using KV
   "kv_namespaces": [...]
   ```

5. **Run database migrations (local)**
   ```bash
   bun d1:migrate
   ```

6. **Start development server**
   ```bash
   bun dev
   ```
   Open http://localhost:3000

### Environment Variables (for production migrations)

Create `packages/db/.env` for Drizzle migrations to production:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_ID=your_database_id
CLOUDFLARE_API_TOKEN=your_api_token
```

You can find these values:
- **Account ID**: Cloudflare dashboard URL `dash.cloudflare.com/{ACCOUNT_ID}/...`
- **D1 ID**: Same as `database_id` from step 3
- **API Token**: Create at https://dash.cloudflare.com/profile/api-tokens with D1 edit permissions

### Development

```bash
# Start all packages in dev mode
bun dev

# Run with Cloudflare Workers locally
bunx wrangler dev

# Run tests
bun --filter @repo/web test

# Run code quality checks
bun run check
```

### Deployment

```bash
# Run production migrations
bun d1:migrate:prod

# Deploy to Cloudflare Workers
bun run deploy
```

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  React Components                                                │
│  ├── BoardView (renders columns/cards)                          │
│  ├── Jotai Atoms (UI state: filters, grouping, dialogs)         │
│  └── TanStack Query (server state cache)                        │
├─────────────────────────────────────────────────────────────────┤
│  TanStack Router                                                 │
│  ├── Route loaders (prefetch data)                              │
│  └── beforeLoad (read cookies for settings)                     │
├─────────────────────────────────────────────────────────────────┤
│                    Network Boundary                              │
├─────────────────────────────────────────────────────────────────┤
│  TanStack Start Server Functions                                 │
│  ├── board-api.ts (getBoard, getFirstBoard, getBoardSettings)   │
│  └── card-api.ts (createCard, updateCard, deleteCard, moveCard) │
├─────────────────────────────────────────────────────────────────┤
│  Drizzle ORM                                                     │
│  └── packages/db/src/schema/board.ts                            │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare D1 (SQLite)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### TanStack Start Request Flow

1. **Route Load**: Router triggers `beforeLoad` to read cookies for settings, then `loader` to prefetch board data
2. **Component Render**: React components consume data via `useLoaderData()` and `useSuspenseQuery()`
3. **Mutations**: User actions trigger `useMutation()` hooks that call server functions
4. **Cache Invalidation**: Mutations invalidate relevant queries, triggering refetch

## State Management

### Server State (TanStack Query)

- **Board data**: Fetched via `getBoard()` server function
- **Card mutations**: `createCard`, `updateCard`, `deleteCard`, `moveCard`
- **Cache**: Query cache with optimistic updates for drag-and-drop

### UI State (Jotai)

Located in `apps/web/src/atoms/board-atoms.ts`:

| Atom                        | Purpose                               |
| --------------------------- | ------------------------------------- |
| `viewModeAtom`              | Toggle between kanban and table views |
| `groupByAtom`               | Group cards by status or priority     |
| `priorityFiltersAtom`       | Filter cards by priority              |
| `tagFiltersAtom`            | Filter cards by tags                  |
| `sortFieldAtom`             | Sort by manual, created, or updated   |
| `sortDirectionAtom`         | Ascending or descending sort          |
| `hiddenStatusColumnsAtom`   | Hide specific status columns          |
| `hiddenPriorityColumnsAtom` | Hide specific priority columns        |
| `dialogAtom`                | Card create/edit modal state          |
| `panelAtom`                 | Side panel card editor state          |
| `activeCardAtom`            | Currently dragged card                |
| `tempCardOrderAtom`         | Optimistic card ordering during drag  |

### Settings Persistence

User preferences are persisted in a `board-settings` cookie:

- Settings synced to cookies on change via `SettingsSyncer` component
- Settings hydrated from cookies on page load via `SettingsHydrator` component
- Cookie parsing with validation and fallback to defaults

## Database Schema

### Tables

**boards**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| name | TEXT | Board name |
| slug | TEXT | URL-friendly identifier |
| display_id_prefix | TEXT | Card ID prefix (e.g., "MYP") |
| next_card_number | INTEGER | Auto-increment for card IDs |
| created_at | INTEGER | Creation timestamp |
| updated_at | INTEGER | Last update timestamp |

**cards**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| display_id | TEXT | Human-readable ID (MYP-1, BUG-2) |
| title | TEXT | Card title |
| description | TEXT | Card description (optional) |
| position | TEXT | Fractional index for ordering |
| priority | TEXT | none, low, medium, high, urgent |
| status | TEXT | backlog, todo, in_progress, review, done |
| tags | TEXT | JSON array of tag strings |
| board_id | TEXT | Foreign key to boards |
| created_at | INTEGER | Creation timestamp |
| updated_at | INTEGER | Last update timestamp |
| deleted_at | INTEGER | Soft delete timestamp |

**sequences**
| Column | Type | Description |
|--------|------|-------------|
| name | TEXT | Sequence name (e.g., "card") |
| next_id | INTEGER | Next ID to assign |

### Card Ordering

Cards use [fractional indexing](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/) for position values. This allows inserting cards between any two existing cards without renumbering, making drag-and-drop operations O(1) for position updates.

## API Overview

### Board API (`apps/web/src/api/board-api.ts`)

| Function             | Method | Description                                             |
| -------------------- | ------ | ------------------------------------------------------- |
| `getBoard`           | GET    | Fetch board with all cards, normalized for O(1) lookups |
| `getFirstBoard`      | GET    | Fetch first board (cached)                              |
| `createDefaultBoard` | POST   | Create initial board on first visit                     |
| `getBoardSettings`   | GET    | Read settings from request cookies                      |

### Card API (`apps/web/src/api/card-api.ts`)

| Function     | Method | Description                                                     |
| ------------ | ------ | --------------------------------------------------------------- |
| `getCards`   | GET    | List cards with optional filters                                |
| `createCard` | POST   | Create new card with auto-generated display ID                  |
| `updateCard` | POST   | Update card fields (title, description, priority, status, tags) |
| `moveCard`   | POST   | Update card position and/or status (drag-and-drop)              |
| `deleteCard` | POST   | Soft delete card (sets deletedAt)                               |

## Project Structure

```
ravenna-kanban/
├── apps/
│   └── web/                      # TanStack Start application (React 19 + Cloudflare Workers)
│       ├── src/
│       │   ├── api/              # Server functions (board-api, card-api, admin-api)
│       │   ├── atoms/            # Jotai atoms for UI state
│       │   ├── components/
│       │   │   ├── board/        # Board management (create, settings)
│       │   │   ├── card-editor/  # Card dialog and side panel
│       │   │   ├── kanban/       # Kanban view components
│       │   │   ├── layout/       # App layout, filters, navigation
│       │   │   └── table/        # Table view components
│       │   ├── contexts/         # React contexts (board, theme)
│       │   ├── hooks/            # Custom hooks + tests
│       │   ├── lib/              # Utilities (cookies, dnd, logger, prefix, slugify)
│       │   ├── routes/           # File-based routes (/b/:slug)
│       │   └── types/            # TypeScript type definitions
│       └── wrangler.jsonc        # Cloudflare Workers config
├── packages/
│   ├── db/                       # Drizzle ORM schema + D1 migrations
│   │   ├── src/schema/           # Table definitions
│   │   └── drizzle/              # SQL migration files
│   └── ui/                       # Shared UI components (shadcn/ui + Base UI)
└── tooling/                      # Shared ESLint + TypeScript configs
```

## Performance

- **Virtual scrolling** (virtua) for rendering large boards efficiently
- **Optimistic updates** for instant UI feedback on mutations
- **Normalized data structures** for O(1) card lookups
- **Edge deployment** on Cloudflare Workers for global low-latency
- **Router preloading** for instant navigation between boards
- **Query caching** with intelligent background refetching

## Test Coverage

| Test File                    | Coverage                             |
| ---------------------------- | ------------------------------------ |
| `card-api.test.ts`           | API validation, card CRUD operations |
| `dnd-utils.test.ts`          | Drag-and-drop position calculations  |
| `cookies.test.ts`            | Settings parsing and persistence     |
| `card-config.test.ts`        | Config helpers and form validation   |
| `use-filtered-cards.test.ts` | Filter and sort logic                |

Run tests with:

```bash
bun --filter @repo/web test
```

## Key UX Decisions

### Drag and Drop

- **dnd-kit** chosen for accessibility, touch support, and smooth animations
- Optimistic updates prevent UI flicker during drag operations
- Temporary card order stored in Jotai atom during drag, applied on drop

### Atomic Filters

- Priority and tag filters use OR logic within each filter type
- Combined filters (priority AND tags) use AND logic between types
- Empty filter = show all (no filter applied)

### Cookie-Based Settings

- Settings persist across sessions without authentication
- Minimal server roundtrip (read from request headers)
- Graceful fallback to defaults for invalid/missing cookies

### Fractional Indexing

- Enables O(1) position updates for drag-and-drop
- No need to renumber all cards when inserting/moving
- Supports infinite insertions between any two positions

## Trade-offs and Future Improvements

### Current Limitations

- **No authentication**: All users share the same boards
- **Local persistence only**: Each Cloudflare edge location has its own D1 replica

### Potential Improvements

- **User authentication**: Add Cloudflare Access or custom auth
- **Real-time sync**: Add WebSocket support for multi-user collaboration
- **Card comments**: Add comment thread on cards
- **Due dates**: Add date picker and calendar view
- **Search**: Full-text search across card titles and descriptions
- **Keyboard shortcuts**: Add vim-style navigation and quick actions
- **Undo/redo**: Add action history with undo support

## License

MIT
