import logging
import socket
from urllib.parse import urlparse
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from backend.app.core.config import settings

logger = logging.getLogger("bloodconnect.database")

class Base(DeclarativeBase):
    pass

def is_db_host_available(db_url: str) -> bool:
    try:
        parsed = urlparse(db_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.0)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

active_db_url = settings.DATABASE_URL

if "postgresql" in active_db_url:
    if not is_db_host_available(active_db_url):
        logger.warning(
            f"PostgreSQL target ({active_db_url}) is not reachable on localhost:5432. "
            f"Using local development fallback: {settings.FALLBACK_SQLITE_URL}"
        )
        active_db_url = settings.FALLBACK_SQLITE_URL

connect_args = {}
if "sqlite" in active_db_url:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    active_db_url,
    echo=False,
    future=True,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
