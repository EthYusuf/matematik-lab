"""İlerleme birleştirme, ustalık hesabı ve rozet kuralları."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Progress, QuizAttempt, UserBadge

TIER1 = ["derivative-tangent", "riemann-integral", "trig-unit-circle", "function-transforms", "probability-monte-carlo", "limit-epsilon-delta"]


def mastery(p: Progress) -> float:
    """Ders %40, görevler %60 ağırlıklı (frontend ile aynı formül)."""
    step = len(p.completed_steps) / p.steps_total if p.steps_total else 0.0
    chal = len(p.solved_challenges) / p.challenges_total if p.challenges_total else 0.0
    return min(1.0, 0.4 * step + 0.6 * chal)


def merge_progress(row: Progress, incoming: dict) -> None:
    """Çakışmasız birleştirme: listeler birleşim, ilk tahmin sonucu korunur, ipucu sayısı en büyüğü."""
    row.completed_steps = sorted(set(row.completed_steps or []) | {int(s) for s in incoming.get("completed_steps", [])})
    preds = dict(row.predictions or {})
    for k, v in (incoming.get("predictions") or {}).items():
        preds.setdefault(str(k), bool(v))
    row.predictions = preds
    row.solved_challenges = sorted(set(row.solved_challenges or []) | set(incoming.get("solved_challenges", [])))
    hints = dict(row.hints_used or {})
    for k, v in (incoming.get("hints_used") or {}).items():
        hints[k] = max(int(v), int(hints.get(k, 0)))
    row.hints_used = hints
    totals = incoming.get("totals") or {}
    row.steps_total = max(row.steps_total or 0, int(totals.get("steps", 0)))
    row.challenges_total = max(row.challenges_total or 0, int(totals.get("challenges", 0)))
    row.updated_at = utcnow()


@dataclass(frozen=True)
class Badge:
    id: str
    title: str
    description: str
    icon: str


BADGES: list[Badge] = [
    Badge("ilk-adim", "İlk adım", "Bir dersin ilk adımını tamamla.", "👣"),
    Badge("kasif", "Kâşif", "5 farklı konuyu aç.", "🧭"),
    Badge("tahmin-ustasi", "Tahmin ustası", "10 tahmini doğru yap.", "🎯"),
    Badge("cesur-tahminci", "Cesur tahminci", "5 kez yanıl — yanılgılar en iyi öğretmendir.", "🦁"),
    Badge("gorev-avcisi", "Görev avcısı", "10 görev çöz.", "🏹"),
    Badge("soru-cozucu", "Soru çözücü", "10 quiz sorusunu doğru cevapla.", "✍️"),
    Badge("hafiza-sarayi", "Hafıza sarayı", "5 aralıklı tekrar sorusunu doğru cevapla.", "🏛️"),
    Badge("kademe-1", "Kademe 1 ustası", "Kademe 1'deki 6 konunun hepsinde %80 ustalığa ulaş.", "🏆"),
]


def compute_stats(db: Session, user_id: int) -> dict:
    rows = db.scalars(select(Progress).where(Progress.user_id == user_id)).all()
    preds = [v for r in rows for v in (r.predictions or {}).values()]
    correct_quiz = db.scalar(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.correct.is_(True))) or 0
    total_quiz = db.scalar(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id)) or 0
    correct_review = (
        db.scalar(
            select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.correct.is_(True), QuizAttempt.is_review.is_(True))
        )
        or 0
    )
    by_sim = {r.sim_id: r for r in rows}
    return {
        "topics_opened": len(rows),
        "steps_done": sum(len(r.completed_steps or []) for r in rows),
        "predictions_right": sum(1 for v in preds if v),
        "predictions_wrong": sum(1 for v in preds if not v),
        "challenges_solved": sum(len(r.solved_challenges or []) for r in rows),
        "quiz_correct": correct_quiz,
        "quiz_total": total_quiz,
        "review_correct": correct_review,
        "tier1_mastered": all(t in by_sim and mastery(by_sim[t]) >= 0.8 for t in TIER1),
        "mastery": {r.sim_id: round(mastery(r), 4) for r in rows},
    }


_RULES = {
    "ilk-adim": lambda s: s["steps_done"] >= 1,
    "kasif": lambda s: s["topics_opened"] >= 5,
    "tahmin-ustasi": lambda s: s["predictions_right"] >= 10,
    "cesur-tahminci": lambda s: s["predictions_wrong"] >= 5,
    "gorev-avcisi": lambda s: s["challenges_solved"] >= 10,
    "soru-cozucu": lambda s: s["quiz_correct"] >= 10,
    "hafiza-sarayi": lambda s: s["review_correct"] >= 5,
    "kademe-1": lambda s: s["tier1_mastered"],
}


def award_badges(db: Session, user_id: int) -> list[str]:
    """Yeni kazanılan rozetleri kaydeder ve kimliklerini döndürür (commit çağırana aittir)."""
    stats = compute_stats(db, user_id)
    owned = set(db.scalars(select(UserBadge.badge_id).where(UserBadge.user_id == user_id)).all())
    new = [b.id for b in BADGES if b.id not in owned and _RULES[b.id](stats)]
    for bid in new:
        db.add(UserBadge(user_id=user_id, badge_id=bid))
    return new
