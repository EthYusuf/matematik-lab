"""
SM-2 aralıklı tekrar algoritması (SuperMemo 2, Wozniak 1987).

Doğru cevaplanan konu giderek daha uzun aralıklarla (1 → 3 → ~8 → ~20 gün…) yeniden sorulur;
yanlış cevaplanan konu ertesi gün tekrar gelir. "Kafaya kazınma" bu mekanizmayla sağlanır.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

CORRECT_QUALITY = 4
WRONG_QUALITY = 2
MIN_EASE = 1.3


@dataclass(frozen=True)
class ReviewState:
    ease: float = 2.5
    interval_days: int = 0
    repetitions: int = 0


def sm2(state: ReviewState, quality: int) -> ReviewState:
    """quality: 0–5 (5 = kusursuz hatırlama, <3 = unutulmuş)."""
    if not 0 <= quality <= 5:
        raise ValueError("quality 0 ile 5 arasında olmalı")
    if quality < 3:
        repetitions, interval = 0, 1
    else:
        repetitions = state.repetitions + 1
        if repetitions == 1:
            interval = 1
        elif repetitions == 2:
            interval = 3
        else:
            interval = round(state.interval_days * state.ease)
    ease = state.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return ReviewState(ease=max(MIN_EASE, ease), interval_days=interval, repetitions=repetitions)


def next_due(now: datetime, state: ReviewState) -> datetime:
    return now + timedelta(days=state.interval_days)
