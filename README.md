# RCC Dashboard and Engagement Tool

## Project Overview 📊
The RCC Engagement Analytics Dashboard is a full-stack analytics platform designed to help the **Responsible Computing Club (RCC)** understand community growth, engagement, diversity, and retention over time.
The system ingests member registration data and event attendance data, normalizes and reconciles them across multiple sources, and exposes chart-ready analytics APIs used by a dashboard interface.
The goal is to provide clear, decision-ready insights for RCC leadership without manual spreadsheet analysis.

### Key Questions Answered 🤔
- *How many members does RCC have? How many members are active?*
- *Who makes up the RCC community (academics, year levels)?*
- *Are events attracting a diverse audience?*
- *How well does RCC retain attendees across multiple events?*

### Analytics 📊
- KPI cards (official members, semester active members and active rate, registration growth, 30-day new-member activation, first-time attendee second-event rate)
- Active Members by Semester table when All Semesters is selected
- Line charts (cumulative membership growth over time)
- Pie charts (major category distribution, class year distribution)
- Event-level stacked charts (attendance diversity by major category)
- Attendance Frequency bar chart (how many registered members and known attendees, including non-members, attended 0, 1, 2, 3, or 4+ events)
- Grouped / stacked views by major category

## User Flow (High-Level) 🔀
1. Members register through a standardized form → stored in members
2. Admin uploads event attendance CSVs → parsed and normalized
3. Attendance is linked to members when possible
4. Dashboard active membership is calculated from attendance within each semester
5. Dashboard fetches analytics via read-only endpoints
6. Charts render using pre-aggregated backend data

## Tech Stack 🛠️
- Next.js 16 (App Router) and React 19
- Tailwind CSS v4, shadcn/ui, Base UI
- next-themes, sonner, motion
- FastAPI + Uvicorn backend (Python 3.10+)
- TypeScript and Zod-based env validation
- Bun and Turborepo
- Supabase auth & Supabase (PostgreSQL)

## Repository Layout 📁
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
## Architecture (High-Level) 🏛️
- Frontend fetches analytics via GET endpoints
- Admin actions (event imports) use POST multipart/form-data
- Backend returns fully computed JSON

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
## API Endpoints 🔗
### Overview Analytics
```GET /analytics/overview```
Returns:
- `overview.kpis.official_members`: distinct official members on the roster by the reporting cutoff
- `overview.kpis.active_members` and `active_members_pct`: active members and active rate for the selected semester; both are null for All Semesters because activity is semester-specific
- `overview.active_members_by_semester`: rows with `value` (semester identifier), `label`, `official_members`, `active_members`, and `active_rate` (null when the semester has no official members)
- `overview.kpis.registered_growth_last_30d_pct`: rolling 30-day registration growth; null when the preceding period has no registrations
- Monthly cumulative registration time series
- `overview.kpis.new_member_activation_30d`: 30-Day New-Member Activation Rate
- `overview.kpis.first_time_attendee_second_event`: First-Time Attendee Second-Event Rate, with no fixed follow-up deadline
- Engagement rates include `percentage` (null when nobody is eligible), `successful`, and `eligible`; counts accompany every displayed rate
- `meta.as_of`: database snapshot time used for eligibility and observed attendance

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

## Data Assumptions & Logic 📝
### Membership definitions
- **Active member:** An official RCC member who attended at least one social event and at least one non-social event during the same semester.
- **Member:** Person submitted the RCC membership form.
- **Non-member:** Person appears in attendance data but is not in the membership roster.
- **Not-yet-active member:** A registered member who has not met the engagement requirement yet.
- **Eligible non-member:** A non-member who has enough engagement to qualify, but has not officially joined.

### Active Member Logic
- Active status is calculated separately for each semester. Social attendance in one semester and non-social attendance in another do not combine to qualify someone.
- Event classifications come from `events.event_kind`: `social` and `nonsocial`. Duplicate attendance does not add another qualifying event; unclassified events do not satisfy either requirement.
- The denominator is the distinct official roster with `joined_at` before the semester's exclusive end and at or before the database snapshot. Members who joined in earlier semesters are included. Undated registrations are excluded from semester counts because membership by that cutoff cannot be established; the All Semesters official roster count can include them.
- Qualifying attendance may precede registration, but the person must have officially joined by the semester reporting cutoff to count as active. Eligible non-members remain excluded from the active count and active rate until they join.
- Active rate = active members in that semester ÷ official members by that semester's cutoff × 100. No official members produces N/A.
- Selecting one semester shows **Active Members — [semester]**, the active count, and the percentage of official members. **All Semesters** shows an **Active Members by Semester** table, with no pooled all-time active count or rate.
- These dashboard analytics derive status directly from recorded attendance. The existing import flow still invokes `recompute_active_members`; this change does not deploy or change that stored database function. Reconciliation of its stored flags with semester analytics is tracked in [the project backlog](BUG_TODO.md#engagement-definitions).

### Engagement metric populations and periods
- **30-Day New-Member Activation Rate** (short card title: **30-Day Activation**): Of registered members whose full 30-day window has elapsed and who had at least one recorded event opportunity during that window, the percentage who attended an event from registration through 30 days afterward (inclusive). Attendance before registration does not activate a member. A recorded event is an opportunity even if it has no attendance records; members with no event opportunity are excluded from both the denominator and numerator.
- **First-Time Attendee Second-Event Rate:** Of all first-time attendees in the cohort (members and non-members), the percentage who attended a later distinct event by the current database snapshot. There is no fixed 60-day deadline or minimum waiting period. Recent first-time attendees and people with no later event opportunity remain in the denominator, so follow-up duration varies.
- The journey is **registers → attends first event → attends a second event**. Activation starts at registration; the second-event metric starts at the first recorded event. These clocks can overlap, and someone may attend before registering.
- Only activation requires a completed 30-day measurement window, even when the person already attended. Both rates show successful and eligible counts. Zero eligible people produces **N/A · 0 of 0 eligible**, not 0%.
- Selecting a semester selects the **registration cohort** for activation and the **first-event cohort** for second-event attendance. First events are determined from all recorded history before filtering. Follow-up attendance can fall outside the selected semester; the second event can occur in any later semester. Eligibility and outcomes are evaluated at the current database snapshot, including for historical cohorts.
- Engagement KPIs identify people by normalized email (trimmed and lowercased); attendance uses linked `member_email` when present, otherwise `attendee_email`. Duplicate attendance for the same event does not count as a second event. Event time is `events.starts_at`, independent of missing or malformed check-in timestamps. Blank identities and missing anchor dates are excluded; future events cannot count.
- First-time attendance means first **recorded** attendance. Missing historical imports can affect cohort membership and results; the metrics do not assume unrecorded events occurred.
- **Attendance Frequency:** Preserves the existing population of every registered member plus non-member attendees in the selected event period, deduplicated by normalized email. The 0-event bucket includes registered members without attendance in that period; it is not a retention rate. `/analytics/retention` remains the API path for compatibility and now returns date-range metadata.
- **Registration Growth:** Compares registrations in the rolling last 30 days ending at the snapshot with registrations in the preceding 30 days, clipping both periods to the selected registration semester when filtered. The recent interval includes both the 30-day boundary and the snapshot; the previous interval includes the 60-day boundary and excludes the 30-day boundary. Growth = (recent − previous) ÷ previous × 100. A zero previous count produces N/A.
- **Member Growth:** Shows cumulative registrations only. A selected semester accumulates registrations made within that semester; All Semesters accumulates all dated registrations. Semester active history appears in the active-members table.
- **Mission demographics:** All Semesters includes the registered roster. A selected semester includes registered members who attended at least one event in that semester. **Event diversity** includes all attendees at up to 10 events with the highest attendance in the selected period.
- Semester boundaries are Spring **January 15–May 15** and Fall **August 20–December 24**, inclusive. SQL uses exclusive ends of May 16 and December 25. Semester comparisons use the database timezone; snapshot timestamps are returned in UTC.

### Metric presentation and methodology
- Dashboard cards show a short title, population/period, the result, counts, and a brief decision-focused description.
- **View definition** opens an info panel with the definition and eligibility rules.
- The authenticated **[methodology page](apps/web/src/app/(dashboard)/methodology/page.tsx)** at `/methodology` explains the full calculations, date boundaries, cohort selection, and data limitations. Definition panels link to the relevant section.

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
Lowercased, whitespace removed, used as global unique identifier
#### Major
Free-text majors are normalized into major_normalized & major_category (Technical, Business, Humanities & Arts, Health Sciences, Other/Unknown)
#### Degree Program
Derived using:
- Explicit class year (Freshman → Undergraduate)
- Major tokens (e.g., “M.S.” → Graduate)
- Member record fallback

## Data Schema 📑
- **members**: Stores registered RCC members and normalized demographic data.
- **events**: Stores event metadata (no attendance).
- **event_attendance**: Stores attendee engagement, supports members + non-members.
- **profiles**: Controls platform access (admin vs member).

## Getting Started (monorepo) ⚙️

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
SERVER_URL=http://localhost:8000
```

Shared env schemas live in `packages/env/src/*.ts`.

## Scripts

- `bun run dev`: Start all apps in dev mode
- `bun run dev:web`: Start the web app only
- `bun run build`: Build all apps
- `bun run check-types`: Typecheck across the repo
- `bun run server:install`: Create the server venv in `apps/server` (no pip)

## Future Improvements 🚀
- Improved major data collection and analytics
- Event cohort analysis (first-time vs. returning)
- Attendance trend forecasting

## Contributors & Roles 🤝
| Name              | Role / Title                          | Key Contributions                                                      |
|-------------------|---------------------------------------|------------------------------------------------------------------------|
| Julia Husainzada  |                                       |                                                                        |
| Asmita Dulla      |                                       |                                                                        |
| Izabella          | Backend / Data Developer              | Did a little bit of everything related to analytics and data           |
| Samriddhi Matharu |                                       |                                                                        |
| Emily Thach       |  Frontend developer                   | Dashboard design & ui/ux, data schema, customized ui charts/components |
| Pouya Anvari      |  Full-Stack developer                 | Figma design, UI wiring, API & Endpoint Aggregation                    |
| Om Shah           |  Builder.                             | Can write Code and owns a computer                                     |
