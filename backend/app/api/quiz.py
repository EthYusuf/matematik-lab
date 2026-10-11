import secrets

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, OptionalUser
from app.core.db import utcnow
from app.models import QuizAttempt, ReviewItem
from app.schemas import CheckIn, CheckOut, QuestionOut
from app.services.progress import award_badges
from app.services.quiz.answers import parse_answer
from app.services.quiz.generators import TOPICS, make_question
from app.services.srs import CORRECT_QUALITY, WRONG_QUALITY, ReviewState, next_due, sm2

router = APIRouter(prefix="/quiz", tags=["quiz"])


def _topic(topic: str) -> str:
    if topic not in TOPICS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bu konu için soru üreticisi yok.")
    return topic


@router.get("/topics", response_model=list[str], summary="Soru üretilebilen konular")
def topics() -> list[str]:
    return TOPICS


@router.get("/{topic}", response_model=QuestionOut, summary="Parametrik bir soru üret")
def question(topic: str, seed: int | None = None) -> QuestionOut:
    _topic(topic)
    if seed is None:
        seed = secrets.randbelow(2**31)
    q = make_question(topic, seed)
    # Cevap istemciye gönderilmez; kontrol sırasında aynı tohumla yeniden üretilir.
    return QuestionOut(topic=topic, seed=seed, prompt=q.prompt, kind=q.kind, options=q.options)


@router.post("/{topic}/check", response_model=CheckOut, summary="Cevabı kontrol et")
def check(topic: str, body: CheckIn, db: DB, user: OptionalUser) -> CheckOut:
    _topic(topic)
    q = make_question(topic, body.seed)
    parsed = True
    if q.kind == "choice":
        try:
            correct = int(body.answer) == q.correct
        except ValueError:
            correct, parsed = False, False
    else:
        value = parse_answer(body.answer)
        parsed = value is not None
        correct = parsed and abs(value - q.answer) <= q.tolerance

    out = CheckOut(correct=correct, expected=q.answer_text, explanation=q.explanation, parsed=parsed)
    if user is None or not parsed:
        return out

    now = utcnow()
    db.add(QuizAttempt(user_id=user.id, topic=topic, seed=body.seed, correct=correct, is_review=body.review, created_at=now))
    item = db.scalar(select(ReviewItem).where(ReviewItem.user_id == user.id, ReviewItem.topic == topic))
    if item is None:
        item = ReviewItem(user_id=user.id, topic=topic, ease=2.5, interval_days=0, repetitions=0, due_at=now)
        db.add(item)
    state = sm2(ReviewState(item.ease, item.interval_days, item.repetitions), CORRECT_QUALITY if correct else WRONG_QUALITY)
    item.ease, item.interval_days, item.repetitions = state.ease, state.interval_days, state.repetitions
    item.due_at = next_due(now, state)
    item.last_reviewed_at = now
    db.flush()
    out.new_badges = award_badges(db, user.id)
    out.next_review_days = state.interval_days
    db.commit()
    return out
