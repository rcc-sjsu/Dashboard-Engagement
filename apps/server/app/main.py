"""
FastAPI application entry point for the Dashboard Engagement analytics server.

This module initializes the FastAPI app, configures CORS middleware, and registers
route handlers for analytics and event import functionality.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables before importing local modules that depend on them
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"  # -> apps/server/.env
if load_dotenv is not None:
    load_dotenv(dotenv_path=ENV_PATH, override=True)

# Local application imports (after env is loaded)
from app.api.import_event_info import router as import_router 
from app.routes.analytics import router as analytics_router

# Initialize FastAPI application
app = FastAPI()

# Register route handlers
app.include_router(import_router)
app.include_router(analytics_router)

# Configure CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
