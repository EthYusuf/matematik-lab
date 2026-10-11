"""Adım adım çözüm uç noktaları. Hesaplama ayrı süreçte, zaman aşımıyla yapılır."""

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.core.ratelimit import limiter
from app.schemas import DerivativeIn, IntegralIn, LimitIn
from app.services.symbolic.sandbox import ComputationTimeout, get_sandbox
from app.services.symbolic.tasks import run_task

router = APIRouter(prefix="/math", tags=["matematik"])


def _solve(task: str, payload: dict) -> dict:
    try:
        result = get_sandbox().run(run_task, task, payload)
    except ComputationTimeout as exc:
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, "Hesaplama çok uzun sürdü; ifadeyi sadeleştirip tekrar dene.") from exc
    if not result["ok"]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, result["error"])
    return result["data"]


@router.post("/derivative", summary="Adım adım türev")
@limiter.limit(get_settings().rate_limit_math)
def derivative(request: Request, body: DerivativeIn) -> dict:
    return _solve("derivative", body.model_dump())


@router.post("/integral", summary="Adım adım integral (belirli/belirsiz)")
@limiter.limit(get_settings().rate_limit_math)
def integral(request: Request, body: IntegralIn) -> dict:
    return _solve("integral", body.model_dump())


@router.post("/limit", summary="Adım adım limit")
@limiter.limit(get_settings().rate_limit_math)
def limit(request: Request, body: LimitIn) -> dict:
    return _solve("limit", body.model_dump())
