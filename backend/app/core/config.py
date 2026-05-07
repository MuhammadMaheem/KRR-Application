from pydantic_settings import BaseSettings
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE_PATH = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Literature Review System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # JWT Configuration
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for testing

    # Groq API key (loaded from .env automatically)
    GROQ_API_KEY: str = ""

    # Database (defaults to SQLite — set POSTGRES_URL in .env for PostgreSQL)
    DATABASE_URL: str = "sqlite:///./krr.db"

    # Redis (for rate limiting)
    REDIS_URL: str = "redis://localhost:6379"

    # CORS (allow all for testing; restrict in production)
    CORS_ORIGINS: list[str] = ["*"]

    # Upload settings
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = str(ENV_FILE_PATH)
        extra = "ignore"


settings = Settings()
