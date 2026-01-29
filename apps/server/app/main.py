"""
FastAPI application entry point for the Dashboard Engagement analytics server.

This module initializes the FastAPI app, configures CORS middleware, and registers
route handlers for analytics and event import functionality.
"""
import os
from pathlib import Path
from typing import Dict, Any

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables before importing local modules that depend on them
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"  # -> apps/server/.env
if load_dotenv is not None:
    load_dotenv(dotenv_path=ENV_PATH, override=True)

# Local application imports (after env is loaded)
from app.api.import_event_info import router as import_router 
from app.routes.analytics import router as analytics_router

# API Key Configuration
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
if not INTERNAL_API_SECRET:
    raise ValueError("INTERNAL_API_SECRET environment variable is required")

async def verify_api_key(authorization: str = Header(None)) -> Dict[str, Any]:
    """Verify API key from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    if token != INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {"authenticated": True}

# Initialize FastAPI application
app = FastAPI()

# Register route handlers with API key protection
app.include_router(import_router, dependencies=[Depends(verify_api_key)])
app.include_router(analytics_router, dependencies=[Depends(verify_api_key)])

# Configure CORS middleware for cross-origin requests
cors_origins = os.getenv("CORS_ORIGIN", "http://localhost:3000").split(",")
cors_origins = [origin.strip() for origin in cors_origins]  # Clean up whitespace

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
