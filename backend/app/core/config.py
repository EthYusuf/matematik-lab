from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

# Yalnızca geliştirme içindir; üretimde MATLAB_SECRET_KEY mutlaka ayarlanmalı.
DEV_SECRET = "dev-only-insecure-secret-change-me-in-production-0000"


class Settings(BaseSettings):
    """Ortam değişkenlerinden (MATLAB_ önekiyle) veya .env dosyasından okunan ayarlar."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="MATLAB_", extra="ignore")

    app_name: str = "Matematik Lab API"
    version: str = "1.0.0"
    environment: str = "development"
    # Vite geliştirme sunucusu varsayılan olarak 5173'te çalışır.
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    database_url: str = f"sqlite:///{(BACKEND_DIR / 'matematik_lab.db').as_posix()}"
    auto_migrate: bool = True

    secret_key: str = DEV_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    cookie_secure: bool = False

    sympy_workers: int = 2
    sympy_timeout: float = 6.0

    rate_limit_auth: str = "10/minute"
    rate_limit_math: str = "30/minute"
    rate_limit_enabled: bool = True

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.is_production and settings.secret_key == DEV_SECRET:
        raise RuntimeError("Üretim ortamında MATLAB_SECRET_KEY ayarlanmalı.")
    return settings
