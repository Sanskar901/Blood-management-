import sys
from pathlib import Path

# Ensure project root is on sys.path
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.v1.router import api_router
from backend.app.seed import seed_initial_demo_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bloodconnect")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BloodConnect database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized.")

    # Run seed script to ensure test products and demo accounts exist
    try:
        await seed_initial_demo_data()
    except Exception as e:
        logger.warning(f"Demo data seeding note: {e}")
        
    yield
    logger.info("Shutting down BloodConnect service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    db_status = "healthy"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "regulatory_compliance": "Regulated under National Blood Transfusion Council (NBTC) & CDSCO standards"
    }
