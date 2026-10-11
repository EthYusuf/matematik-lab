from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token
from app.models import User

DB = Annotated[Session, Depends(get_db)]


def _user_from_header(request: Request, db: Session) -> User | None:
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    payload = decode_token(header[7:].strip(), "access")
    if payload is None:
        return None
    return db.get(User, int(payload["sub"]))


def get_optional_user(request: Request, db: DB) -> User | None:
    return _user_from_header(request, db)


def get_current_user(request: Request, db: DB) -> User:
    user = _user_from_header(request, db)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Oturum gerekli.", headers={"WWW-Authenticate": "Bearer"})
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
