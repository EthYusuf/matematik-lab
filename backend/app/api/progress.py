import re

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.models import Progress
from app.schemas import SimProgressIn, SimProgressOut, SyncIn, SyncOut
from app.services.progress import award_badges, mastery, merge_progress

router = APIRouter(prefix="/progress", tags=["ilerleme"])

_SIM_ID = re.compile(r"^[a-z0-9-]{2,64}$")


def _out(row: Progress) -> SimProgressOut:
    return SimProgressOut(
        completed_steps=row.completed_steps or [],
        predictions=row.predictions or {},
        solved_challenges=row.solved_challenges or [],
        hints_used=row.hints_used or {},
        totals={"steps": row.steps_total, "challenges": row.challenges_total},
        mastery=round(mastery(row), 4),
        updated_at=row.updated_at,
    )


def _upsert(db, user_id: int, sim_id: str, body: SimProgressIn) -> Progress:
    if not _SIM_ID.match(sim_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Geçersiz konu kimliği.")
    row = db.scalar(select(Progress).where(Progress.user_id == user_id, Progress.sim_id == sim_id))
    if row is None:
        row = Progress(user_id=user_id, sim_id=sim_id, completed_steps=[], predictions={}, solved_challenges=[], hints_used={})
        db.add(row)
    merge_progress(row, body.model_dump())
    return row


@router.get("", response_model=dict[str, SimProgressOut], summary="Tüm konulardaki ilerleme")
def list_progress(user: CurrentUser, db: DB) -> dict[str, SimProgressOut]:
    rows = db.scalars(select(Progress).where(Progress.user_id == user.id)).all()
    return {r.sim_id: _out(r) for r in rows}


@router.put("/{sim_id}", response_model=SyncOut, summary="Bir konunun ilerlemesini birleştir")
def put_progress(sim_id: str, body: SimProgressIn, user: CurrentUser, db: DB) -> SyncOut:
    row = _upsert(db, user.id, sim_id, body)
    db.flush()
    new = award_badges(db, user.id)
    db.commit()
    return SyncOut(sims={sim_id: _out(row)}, new_badges=new)


@router.post("/sync", response_model=SyncOut, summary="Tarayıcıdaki ilerlemeyi hesapla birleştir")
def sync(body: SyncIn, user: CurrentUser, db: DB) -> SyncOut:
    for sim_id, data in body.sims.items():
        _upsert(db, user.id, sim_id, data)
    db.flush()
    new = award_badges(db, user.id)
    db.commit()
    rows = db.scalars(select(Progress).where(Progress.user_id == user.id)).all()
    return SyncOut(sims={r.sim_id: _out(r) for r in rows}, new_badges=new)
