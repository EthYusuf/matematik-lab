"""Öğrencinin yazdığı sayısal cevabı ayrıştırır (frontend'deki parseAnswer ile aynı kurallar)."""

from __future__ import annotations

import math
import re

_PI = re.compile(r"^(-?)(\d*\.?\d*)π(?:/(\d*\.?\d+))?$")
_FRAC = re.compile(r"^(-?\d*\.?\d+)/(\d*\.?\d+)$")
_NUM = re.compile(r"^-?\d*\.?\d+$")


def parse_answer(raw: str) -> float | None:
    s = re.sub(r"\s+", "", raw.strip().lower()).replace("pi", "π").replace("−", "-").replace("–", "-").replace(",", ".")
    if not s or len(s) > 40:
        return None
    m = _PI.match(s)
    if m:
        sign, coef, den = m.groups()
        c = 1.0 if coef == "" else float(coef)
        d = 1.0 if den is None else float(den)
        if d == 0:
            return None
        return (-1 if sign == "-" else 1) * c * math.pi / d
    m = _FRAC.match(s)
    if m:
        d = float(m.group(2))
        return None if d == 0 else float(m.group(1)) / d
    if _NUM.match(s):
        return float(s)
    return None
