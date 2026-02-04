# Ravenna Kanban

A modern Kanban board application built with TanStack Start and deployed on Cloudflare Workers.

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

### Installation

```bash
# Install dependencies
bun install

# Create D1 database
bun d1:create

# Update wrangler.jsonc with your database_id

# Run migrations
bun d1:migrate

# Start development server
bun dev
```

### Development

```bash
# Start all packages in dev mode
bun dev

# Run with Cloudflare Workers locally
bunx wrangler dev

# Run tests
bun --filter @repo/web test
```

### Deployment

```bash
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

| Atom | Purpose |
|------|---------|
| `viewModeAtom` | Toggle between kanban and table views |
| `groupByAtom` | Group cards by status or priority |
| `priorityFiltersAtom` | Filter cards by priority |
| `tagFiltersAtom` | Filter cards by tags |
| `sortFieldAtom` | Sort by manual, created, or updated |
| `sortDirectionAtom` | Ascending or descending sort |
| `hiddenStatusColumnsAtom` | Hide specific status columns |
| `hiddenPriorityColumnsAtom` | Hide specific priority columns |
| `dialogAtom` | Card create/edit modal state |
| `panelAtom` | Side panel card editor state |
| `activeCardAtom` | Currently dragged card |
| `tempCardOrderAtom` | Optimistic card ordering during drag |

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
| created_at | INTEGER | Creation timestamp |
| updated_at | INTEGER | Last update timestamp |

**cards**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| display_id | TEXT | Human-readable ID (RAV-1, RAV-2) |
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

| Function | Method | Description |
|----------|--------|-------------|
| `getBoard` | GET | Fetch board with all cards, normalized for O(1) lookups |
| `getFirstBoard` | GET | Fetch first board (cached) |
| `createDefaultBoard` | POST | Create initial board on first visit |
| `getBoardSettings` | GET | Read settings from request cookies |

### Card API (`apps/web/src/api/card-api.ts`)

| Function | Method | Description |
|----------|--------|-------------|
| `getCards` | GET | List cards with optional filters |
| `createCard` | POST | Create new card with auto-generated display ID |
| `updateCard` | POST | Update card fields (title, description, priority, status, tags) |
| `moveCard` | POST | Update card position and/or status (drag-and-drop) |
| `deleteCard` | POST | Soft delete card (sets deletedAt) |

## Project Structure

```
ravenna-kanban/
├── apps/
│   └── web/                 # TanStack Start application
│       ├── src/
│       │   ├── api/         # Server functions
│       │   ├── atoms/       # Jotai atoms
│       │   ├── components/  # React components
│       │   │   ├── kanban/  # Board, Column, Card components
│       │   │   ├── card-editor/  # Card dialog and panel
│       │   │   └── layout/  # Filter bar, board view
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # Utilities (cookies, dnd, db)
│       │   ├── routes/      # File-based routes
│       │   └── types/       # TypeScript types
│       └── wrangler.jsonc   # Cloudflare config
├── packages/
│   ├── db/                  # Drizzle ORM + D1 schema
│   └── ui/                  # Shared UI components (shadcn)
└── tooling/                 # Shared ESLint/TypeScript configs
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

- **Single board**: Currently supports one board per deployment
- **No authentication**: All users share the same board
- **Local persistence only**: Each Cloudflare edge location has its own D1 replica

### Potential Improvements

- **Multi-board support**: Add board CRUD and board selector
- **User authentication**: Add Cloudflare Access or custom auth
- **Real-time sync**: Add WebSocket support for multi-user collaboration
- **Card comments**: Add comment thread on cards
- **Due dates**: Add date picker and calendar view
- **Search**: Full-text search across card titles and descriptions
- **Keyboard shortcuts**: Add vim-style navigation and quick actions
- **Undo/redo**: Add action history with undo support

## License

MIT
