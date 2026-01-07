# FastAPI Server

FastAPI backend for RCC-Dash.

## Local Development

```bash
cd apps/server
python -m venv .venv          # optional
source .venv/bin/activate     # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt

# from repo root, start with Turbo (uses .venv/bin/python if present)
bun run dev:server
# or run directly
./.venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Available at http://localhost:8000 (Swagger UI at /docs).

## API Surface

- `GET /api/data` - sample dataset
- `GET /api/items/{item_id}` - sample item lookup
- `GET /` - static landing page
