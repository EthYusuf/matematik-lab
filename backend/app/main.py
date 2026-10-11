"""
Matematik Lab API.

  /api/health          sağlık kontrolü
  /api/math/*          SymPy ile adım adım türev / integral / limit
  /api/quiz/*          20 konu için parametrik soru üretimi ve kontrolü
  /api/auth/*          hesaplar (Argon2 + JWT, yenileme belirteci httpOnly çerezde)
  /api/progress/*      ilerleme senkronu
  /api/me/*            panel özeti, rozetler, aralıklı tekrar kuyruğu (SM-2)
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import auth, health, math, me, progress, quiz
from app.core.config import get_settings
from app.core.ratelimit import limiter


def run_migrations() -> None:
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    from app.core.config import BACKEND_DIR

    cfg = Config(str(Path(BACKEND_DIR) / "alembic.ini"))
    cfg.set_main_option("script_location", str(Path(BACKEND_DIR) / "alembic"))
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if get_settings().auto_migrate:
        run_migrations()
    yield
    from app.services.symbolic.sandbox import get_sandbox

    get_sandbox().shutdown()


def create_app(*, migrate: bool = True) -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Lise ve üniversite için etkileşimli matematik simülasyonlarının backend'i.",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan if migrate else None,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for module in (health, math, quiz, auth, progress, me):
        app.include_router(module.router, prefix="/api")
    return app


app = create_app()
