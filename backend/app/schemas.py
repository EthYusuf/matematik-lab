from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

USERNAME_PATTERN = r"^[a-z0-9_.-]{3,32}$"


# ---------------- Hesaplar ----------------


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=48)
    consent: bool = Field(description="KVKK aydınlatma metni onayı")

    @field_validator("username")
    @classmethod
    def _username(cls, v: str) -> str:
        import re

        v = v.strip().lower()
        if not re.match(USERNAME_PATTERN, v):
            raise ValueError("Kullanıcı adı 3–32 karakter olmalı; yalnızca küçük harf, rakam, nokta, tire ve alt çizgi.")
        return v


class LoginIn(BaseModel):
    username: str = Field(max_length=32)
    password: str = Field(max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: UserOut


# ---------------- İlerleme ----------------


class Totals(BaseModel):
    steps: int = Field(default=0, ge=0, le=100)
    challenges: int = Field(default=0, ge=0, le=100)


class SimProgressIn(BaseModel):
    completed_steps: list[int] = Field(default_factory=list, max_length=100)
    predictions: dict[str, bool] = Field(default_factory=dict)
    solved_challenges: list[str] = Field(default_factory=list, max_length=100)
    hints_used: dict[str, int] = Field(default_factory=dict)
    totals: Totals = Field(default_factory=Totals)


class SimProgressOut(SimProgressIn):
    mastery: float
    updated_at: datetime


class SyncIn(BaseModel):
    sims: dict[str, SimProgressIn] = Field(default_factory=dict, max_length=64)


class SyncOut(BaseModel):
    sims: dict[str, SimProgressOut]
    new_badges: list[str]


# ---------------- Quiz ----------------


class QuestionOut(BaseModel):
    topic: str
    seed: int
    prompt: str
    kind: Literal["number", "choice"]
    options: list[str] | None = None


class CheckIn(BaseModel):
    seed: int = Field(ge=0, le=2**31)
    answer: str = Field(max_length=40)
    review: bool = False


class CheckOut(BaseModel):
    correct: bool
    expected: str
    explanation: str
    parsed: bool = True
    new_badges: list[str] = Field(default_factory=list)
    next_review_days: int | None = None


# ---------------- Panel ----------------


class BadgeOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    earned: bool
    awarded_at: datetime | None = None


class ReviewItemOut(BaseModel):
    topic: str
    due_at: datetime
    interval_days: int
    repetitions: int
    ease: float
    due: bool


class SummaryOut(BaseModel):
    user: UserOut
    mastery: dict[str, float]
    stats: dict[str, int]
    badges: list[BadgeOut]
    review_due: int


# ---------------- Matematik ----------------


class DerivativeIn(BaseModel):
    expression: str = Field(min_length=1, max_length=120)


class IntegralIn(BaseModel):
    expression: str = Field(min_length=1, max_length=120)
    lower: str | None = Field(default=None, max_length=20)
    upper: str | None = Field(default=None, max_length=20)


class LimitIn(BaseModel):
    expression: str = Field(min_length=1, max_length=120)
    point: str = Field(default="0", max_length=20)
    direction: Literal["both", "left", "right"] = "both"
