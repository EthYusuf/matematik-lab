"""
Hesaplar. Erişim belirteci (15 dk) JSON'da döner ve istemci belleğinde tutulur;
yenileme belirteci (30 gün) httpOnly çerezde saklanır, her kullanımda döndürülür (rotation).
"""

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.config import get_settings
from app.core.db import utcnow
from app.core.ratelimit import limiter
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models import RefreshToken, User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["hesaplar"])

COOKIE = "matlab_refresh"
COOKIE_PATH = "/api/auth"

# Kullanıcı yokken de aynı sürede yanıt vermek için sabit bir özet (zamanlama saldırılarına karşı).
_DUMMY_HASH = hash_password("zamanlama-esitleme")


def _issue(db, response: Response, user: User) -> TokenOut:
    s = get_settings()
    token, jti, expires = create_refresh_token(user.id)
    db.add(RefreshToken(jti=jti, user_id=user.id, expires_at=expires))
    db.commit()
    response.set_cookie(
        COOKIE,
        token,
        max_age=s.refresh_token_days * 86400,
        httponly=True,
        secure=s.cookie_secure,
        samesite="lax",
        path=COOKIE_PATH,
    )
    return TokenOut(access_token=create_access_token(user.id), expires_in=s.access_token_minutes * 60, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED, summary="Hesap oluştur")
@limiter.limit(get_settings().rate_limit_auth)
def register(request: Request, response: Response, body: RegisterIn, db: DB) -> TokenOut:
    if not body.consent:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Devam etmek için KVKK aydınlatma metnini onaylamalısın.")
    if db.scalar(select(User).where(User.username == body.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu kullanıcı adı alınmış.")
    now = utcnow()
    user = User(
        username=body.username,
        display_name=(body.display_name or body.username).strip()[:48],
        password_hash=hash_password(body.password),
        consent_at=now,
        created_at=now,
    )
    db.add(user)
    db.commit()
    return _issue(db, response, user)


@router.post("/login", response_model=TokenOut, summary="Giriş yap")
@limiter.limit(get_settings().rate_limit_auth)
def login(request: Request, response: Response, body: LoginIn, db: DB) -> TokenOut:
    user = db.scalar(select(User).where(User.username == body.username.strip().lower()))
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Kullanıcı adı ya da parola hatalı.")
    return _issue(db, response, user)


@router.post("/refresh", response_model=TokenOut, summary="Erişim belirtecini yenile")
def refresh(request: Request, response: Response, db: DB) -> TokenOut:
    token = request.cookies.get(COOKIE)
    payload = decode_token(token, "refresh") if token else None
    row = db.get(RefreshToken, payload["jti"]) if payload else None
    if not payload or not row or row.revoked or row.expires_at < utcnow():
        response.delete_cookie(COOKIE, path=COOKIE_PATH)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Oturum süresi doldu.")
    row.revoked = True  # tek kullanımlık
    user = db.get(User, int(payload["sub"]))
    if user is None:
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Hesap bulunamadı.")
    return _issue(db, response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Çıkış yap")
def logout(request: Request, response: Response, db: DB) -> Response:
    token = request.cookies.get(COOKIE)
    payload = decode_token(token, "refresh") if token else None
    if payload and (row := db.get(RefreshToken, payload["jti"])):
        row.revoked = True
        db.commit()
    response.delete_cookie(COOKIE, path=COOKIE_PATH)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut, summary="Oturumdaki kullanıcı")
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, summary="Hesabı ve tüm verileri sil (KVKK)")
def delete_me(user: CurrentUser, response: Response, db: DB) -> Response:
    db.delete(user)
    db.commit()
    response.delete_cookie(COOKIE, path=COOKIE_PATH)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
