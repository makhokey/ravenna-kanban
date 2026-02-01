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
- Priority levels (low, medium, high)
- Tag support
- Filter by priority or tag
- Group by column, priority, or tag
- Dark mode support

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

# Update wrangler.toml with your database_id

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
```

### Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy
```

## Project Structure

```
ravenna-kanban/
├── apps/
│   └── web/                 # TanStack Start application
│       ├── src/
│       │   ├── components/  # React components
│       │   │   └── kanban/  # Kanban board components
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # Utilities
│       │   ├── routes/      # File-based routes
│       │   ├── server/      # Server functions
│       │   └── stores/      # Jotai atoms
│       └── wrangler.toml    # Cloudflare config
├── packages/
│   ├── db/                  # Drizzle ORM + D1 schema
│   └── ui/                  # Shared UI components
└── tooling/                 # Shared ESLint/TypeScript configs
```

## License

MIT
