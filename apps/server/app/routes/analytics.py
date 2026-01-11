from fastapi import APIRouter, HTTPException
from app.db import get_conn
from app.services.retention import build_retention_payload

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/retention")
def retention():
    try:
        with get_conn() as conn:
            return build_retention_payload(conn)
    except Exception as e:
        return {"detail": str(e)}  # TEMP: guaranteed JSON output
