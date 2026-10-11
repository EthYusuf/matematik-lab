"""Süreç havuzunda çalışan giriş noktası (üst düzey ve pickle'lanabilir olmalı)."""

from __future__ import annotations

from .derivative import derivative_with_steps
from .integral import integral_with_steps
from .limit import DIRECTIONS, limit_with_steps
from .parsing import ExpressionError, parse, parse_point


def run_task(task: str, payload: dict) -> dict:
    try:
        expr = parse(payload["expression"])
        if task == "derivative":
            data = derivative_with_steps(expr)
        elif task == "integral":
            lower, upper = payload.get("lower"), payload.get("upper")
            bounds = (parse_point(lower), parse_point(upper)) if lower not in (None, "") and upper not in (None, "") else (None, None)
            data = integral_with_steps(expr, *bounds)
        elif task == "limit":
            direction = payload.get("direction", "both")
            if direction not in DIRECTIONS:
                raise ExpressionError("Yön 'both', 'left' ya da 'right' olmalı.")
            data = limit_with_steps(expr, parse_point(payload.get("point", "0")), direction)
        else:
            raise ExpressionError("Bilinmeyen işlem.")
        return {"ok": True, "data": data}
    except ExpressionError as exc:
        return {"ok": False, "error": str(exc)}
