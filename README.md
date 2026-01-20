# RCC Dashboard and Engagement Tool

## Project Overview
The RCC Engagement Analytics Dashboard is a full-stack analytics platform designed to help the **Responsible Computing Club (RCC)** understand community growth, engagement, diversity, and retention over time.
The system ingests member registration data and event attendance data, normalizes and reconciles them across multiple sources, and exposes chart-ready analytics APIs used by a dashboard interface.
The goal is to provide clear, decision-ready insights for RCC leadership without manual spreadsheet analysis.

## Key Questions Answered
- *How many members does RCC have?*
- *How many members are active?*
- *How fast is the community growing?*
- *Who makes up the RCC community (academics, year levels)?*
- *Are events attracting a diverse audience?*
- *How well does RCC retain attendees across multiple events?*

## Key Features
- Dashboard Analytics
- CSV-based event attendance import
- Automatic data normalization & cleaning
- Admin-only import & analytics access
- Chart-ready API responses

### Analytics
- KPI cards (total members, active %, growth rate)
- Line charts (cumulative membership growth over time)
- Pie charts (major category distribution, class year distribution)
- Event-level stacked charts (attendance diversity by major category)
- Bar charts ( explaining how many people attended 0, 1, 2, 3, or 4+ events)
- Grouped / stacked views by major category

## User Flow (High-Level)
1. Members register through a standardized form → stored in members
2. Admin uploads event attendance CSVs → parsed and normalized
3. Attendance is linked to members when possible
4. Active membership is recalculated automatically
5. Dashboard fetches analytics via read-only endpoints
6. Charts render using pre-aggregated backend data

## Tech Stack
- Next.js 16 (App Router) and React 19
- Tailwind CSS v4, shadcn/ui, Base UI
- next-themes, sonner, motion
- FastAPI + Uvicorn backend (Python 3.10+)
- TypeScript and Zod-based env validation
- Bun and Turborepo
- Supabase auth & Supabase (PostgreSQL)

## Repository Layout
RCC Dashboard and Engagement Tool is a Turborepo monorepo for a dashboard web app and shared packages.
```
Turborepo/
├── apps/
│   ├── web/           # Next.js web app
│   └── server/        # FastAPI backend
└── packages/
    ├── config/        # Shared TS config
    └── env/           # Shared env schemas (server/web/native)
```
## Architecture (High-Level)
- Frontend fetches analytics via GET endpoints
- Admin actions (event imports) use POST multipart/form-data
- Backend returns fully computed JSON (no frontend aggregation)

### 1️⃣ Member Registration
```
Google Form Submission
        ↓
Google Apps Script (onFormSubmit / onEdit)
        ↓
Supabase (members table)
```
### 2️⃣ Event Attendance 
```
CSV & Event Form Upload
          ↓
FastAPI Import Layer
          ↓
Supabase (PostgreSQL)
          ↓
Analytics SQL / RPC Functions
          ↓
REST Analytics Endpoints
          ↓
Next.js Dashboard UI
```
## API Endpoints
### Overview Analytics
```GET /analytics/overview```
Returns:
- Total members
- Active members + percentage
- 30-day growth rate
- Monthly cumulative growth time series

```GET /analytics/mission```
Returns:
- Member distribution by major category
- Member distribution by class year
- Top events with attendance diversity breakdown

```GET /analytics/retention```
Returns:
- Attendance frequency buckets (0, 1, 2, 3, 4+)
- Overall distribution
- Distribution by major category

```POST /api/import/event-attendance```
- Content-Type: multipart/form-data
- Required fields:
    - import_type = "event_attendance"
    - title
    - starts_at
    - event_kind
    - file (CSV)
- Optional:
    - event_type
    - location
    - committee

Returns:
- Event ID
- Validation summary
- Success summary
- Skipped rows with reasons
- Warnings

## Data Assumptions & Logic
### Members vs Non-Members
- Members are identified by email match with members.email
- Non-members are still included in:
   - Event diversity analytics
   - Retention analytics

### Active Member Logic
- Only members can become active
- A member becomes active if they attend qualifying events
- is_active_member and active_member_start_date are updated automatically

### Missing Data Handling
| Field            | Behavior                                              |
|------------------|-------------------------------------------------------|
| Major            | Falls back to member record or `Other/Unknown`        |
| Program          | Inferred from class year, major tokens, or member record |
| Class Year       | Normalized or set to `Unknown`                        |
| Check-in time    | Stored as `NULL` if malformed                         |
| Duplicate emails | Skipped during import                                 |

### Normalization Rules
#### Email
- Lowercased, whitespace removed, used as global unique identifier
#### Major
- Free-text majors are normalized into:
    - major_normalized
    - major_category (Technical, Business, Humanities & Arts, Health Sciences, Other/Unknown)
#### Degree Program
- Derived using:
    - Explicit class year (Freshman → Undergraduate)
    - Major tokens (e.g., “M.S.” → Graduate)
    - Member record fallback

## Data Schema
- **members**: Stores registered RCC members and normalized demographic data.
- **events**: Stores event metadata (no attendance).
- **event_attendance**: Stores attendee engagement, supports members + non-members.
- **profiles**: Controls platform access (admin vs member).

## Getting Started (monorepo)

Prerequisites: Bun 1.2+, Python 3.10+, Node.js (for Turbo)

Install dependencies:

```bash
bun install
bun run server:install               # creates .venv in apps/server (no pip yet)
cd apps/server
source .venv/bin/activate            # Windows: .venv\Scripts\Activate
pip install -r requirements.txt
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

## Backend (apps/server)

### Requirements
- Python 3.10+
- bun (or npm/pnpm) for repo scripts
- Node.js (for Turbo)

### Quick start
From repo root:
```bash
bun install                  # JS deps
bun run server:install       # makes .venv in apps/server
```

Install Python deps (once the venv exists):
```bash
cd apps/server
source .venv/bin/activate         # Windows: .venv\Scripts\Activate
pip install -r requirements.txt
```

### Run the API
```bash
# via Turbo (recommended, repo root)
bun run dev

# or directly (backend only)
cd apps/server
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Endpoints (default)
- API base: http://localhost:8000
- Swagger: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

### Notes
- `server:install` only creates the venv; it does not `pip install`.
- Turbo assumes `python` resolves inside the venv; activate it before `bun run dev`.
- For fresh shells, re-run the venv activation step.

### Troubleshooting
- `python: command not found`: use `python3 -m venv .venv` then activate.
- `No module named uvicorn`: `pip install -r requirements.txt` inside the venv.
- Turbo exits 127: ensure the venv is active so `python` is on PATH.

### Fallback
| OS            | Command                     |
| ------------- | --------------------------- |
| macOS / Linux | `source .venv/bin/activate` |
| Windows       | `.venv\\Scripts\\activate`  |

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
- `bun run server:install`: Create the server venv in `apps/server` (no pip)

## Future Improvements
- Improved major data collection and analytics
- Event cohort analysis (first-time vs. returning)
- Attendance trend forecasting

## Contributors & Roles
| Name              | Role / Title                          | Key Contributions |
|-------------------|---------------------------------------|-------------------|
| Julia Husainzada  |                                       |                   |
| [Name]            |                                       |                   |
| [Name]            |                                       |                   |
| [Name]            |                                       |                   |
| [Name]            |                                       |                   |
| [Name]            |                                       |                   |
| [Name]            |                                       |                   |
