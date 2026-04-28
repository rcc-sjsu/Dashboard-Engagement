import logging

from fastapi import APIRouter, HTTPException, Query
from app.db import get_conn
from app.services.retention import build_retention_payload
from app.services.overview import build_overview_payload
from app.services.mission import build_mission_payload
from app.services.semester import list_semester_options, resolve_semester_window

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

@router.get("/retention")
def retention(semester: str | None = Query(default=None)):
    try:
        with get_conn() as conn:
            semester_start, semester_end, _ = resolve_semester_window(conn, semester)
            return build_retention_payload(
                conn,
                semester_start=semester_start,
                semester_end=semester_end,
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /analytics/retention: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch retention analytics")

@router.get("/overview") 
def overview(semester: str | None = Query(default=None)):
    try:
        with get_conn() as conn:
            semester_start, semester_end, options = resolve_semester_window(conn, semester)
            payload = build_overview_payload(
                conn,
                semester_start=semester_start,
                semester_end=semester_end,
            )
            payload["meta"]["selected_semester"] = semester or "all"
            payload["meta"]["semester_options"] = options
            return payload
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /analytics/overview: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch overview analytics")

@router.get("/mission") 
def mission(semester: str | None = Query(default=None)):
    try:
        with get_conn() as conn:
            semester_start, semester_end, _ = resolve_semester_window(conn, semester)
            return build_mission_payload(
                conn,
                semester_start=semester_start,
                semester_end=semester_end,
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /analytics/mission: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch mission analytics")

@router.get("/")
def analytics(semester: str | None = Query(default=None)):
    try:
        with get_conn() as conn:
            semester_start, semester_end, options = resolve_semester_window(conn, semester)
            return {
                "overview": build_overview_payload(
                    conn,
                    semester_start=semester_start,
                    semester_end=semester_end,
                ),
                "retention": build_retention_payload(
                    conn,
                    semester_start=semester_start,
                    semester_end=semester_end,
                ),
                "mission": build_mission_payload(
                    conn,
                    semester_start=semester_start,
                    semester_end=semester_end,
                ),
                "meta": {
                    "selected_semester": semester or "all",
                    "semester_options": options,
                },
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /analytics: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


@router.get("/semesters")
def semesters():
    try:
        with get_conn() as conn:
            return {
                "semester_options": list_semester_options(conn),
            }
    except Exception as e:
        logger.exception("Unexpected error in /analytics/semesters: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch semester options")
