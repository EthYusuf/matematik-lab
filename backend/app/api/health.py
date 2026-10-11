from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["sistem"])


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse, summary="Servis ayakta mı?")
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", version=settings.version, environment=settings.environment)
