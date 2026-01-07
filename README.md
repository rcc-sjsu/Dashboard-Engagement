# RCC Dashboard and Engagement Tool

RCC Dashboard and Engagement Tool is a Turborepo monorepo for a dashboard web app and shared packages.

## Tech Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS v4, shadcn/ui, Base UI
- next-themes, sonner, motion
- TypeScript and Zod-based env validation
- Bun and Turborepo

## Repository Layout

```
Turborepo/
├── apps/
│   ├── web/           # Next.js web app
│   └── server/        # FastAPI backend
└── packages/
    ├── config/        # Shared TS config
    └── env/           # Shared env schemas (server/web/native)
```

## Getting Started

Prerequisites: Bun 1.2+ and Python 3.10+

Install dependencies:

```bash
bun install
# (optional) Create a venv inside apps/server
pip install -r apps/server/requirements.txt
```

Run all apps (web + server):

```bash
bun run dev
```

Run only one app:

```bash
bun run dev:web
bun run dev:server
```

Open:

- Web: http://localhost:3000
- Server: http://localhost:8000 (docs at /docs)

## Environment Variables

Edit `apps/web/.env` as needed:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

Shared env schemas live in `packages/env/src/*.ts`.

## Scripts

- `bun run dev`: Start all apps in dev mode
- `bun run dev:web`: Start the web app only
- `bun run build`: Build all apps
- `bun run check-types`: Typecheck across the repo
