import os
from contextlib import contextmanager

from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import connection as Connection
from psycopg2.extras import RealDictCursor

load_dotenv()

def _get_env_value(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None

def _get_connection_kwargs() -> dict[str, str]:
    db_url = _get_env_value("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is required")
    return {"dsn": db_url}
    
# The context manager yields a database connection and ensures it is closed after use
@contextmanager
def get_conn() -> Connection:
    conn = None
    try:
        conn = psycopg2.connect(
            cursor_factory=RealDictCursor,
            **_get_connection_kwargs(),
        )
        yield conn
    finally:
        if conn is not None:
            conn.close()
