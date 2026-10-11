from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.db import utcnow
from app.models import ReviewItem, UserBadge
from app.schemas import BadgeOut, ReviewItemOut, SummaryOut, UserOut
from app.services.progress import BADGES, compute_stats

router = APIRouter(prefix="/me", tags=["panel"])


@router.get("/summary", response_model=SummaryOut, summary="Panel özeti: ustalık, istatistik, rozetler")
def summary(user: CurrentUser, db: DB) -> SummaryOut:
    stats = compute_stats(db, user.id)
    owned = {b.badge_id: b.awarded_at for b in db.scalars(select(UserBadge).where(UserBadge.user_id == user.id))}
    now = utcnow()
    due = db.scalars(select(ReviewItem).where(ReviewItem.user_id == user.id, ReviewItem.due_at <= now)).all()
    return SummaryOut(
        user=UserOut.model_validate(user),
        mastery=stats.pop("mastery"),
        stats={k: int(v) for k, v in stats.items()},
        badges=[BadgeOut(id=b.id, title=b.title, description=b.description, icon=b.icon, earned=b.id in owned, awarded_at=owned.get(b.id)) for b in BADGES],
        review_due=len(due),
    )


@router.get("/review", response_model=list[ReviewItemOut], summary="Aralıklı tekrar kuyruğu")
def review(user: CurrentUser, db: DB) -> list[ReviewItemOut]:
    now = utcnow()
    items = db.scalars(select(ReviewItem).where(ReviewItem.user_id == user.id).order_by(ReviewItem.due_at)).all()
    return [
        ReviewItemOut(topic=i.topic, due_at=i.due_at, interval_days=i.interval_days, repetitions=i.repetitions, ease=round(i.ease, 2), due=i.due_at <= now)
        for i in items
    ]
