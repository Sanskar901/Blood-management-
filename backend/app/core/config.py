import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"
    )

    PROJECT_NAME: str = "BloodConnect"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "bloodconnect_super_secret_dev_key_change_in_production_32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for development ease
    
    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bloodconnect"
    FALLBACK_SQLITE_URL: str = "sqlite+aiosqlite:///./bloodconnect.db"
    USE_SQLITE_FALLBACK: bool = True
    
    # Super Admin Bootstrap
    FIRST_SUPERUSER_EMAIL: str = "admin@bloodconnect.local"
    FIRST_SUPERUSER_PASSWORD: str = "Admin@BloodConnect2026!"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Reservation TTL in minutes
    DEFAULT_RESERVATION_TIMEOUT_MINUTES: int = 30

settings = Settings()
