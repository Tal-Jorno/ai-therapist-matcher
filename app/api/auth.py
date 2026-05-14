import os
import secrets
from datetime import datetime, timedelta
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.logger_config import logger
from app.models.email_verification_token import EmailVerificationToken
from app.models.therapist import Therapist
from app.models.user import User
from app.models.user_identity import UserIdentity
from app.models.user_password_credential import UserPasswordCredential
from app.security.passwords import hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


BackendRole = Literal["CLIENT", "THERAPIST"]


class AuthSessionResponse(BaseModel):
    user_id: int
    role: BackendRole
    email: EmailStr | None = None
    full_name: str | None = None
    email_verified: bool


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)
    role: BackendRole = "CLIENT"


class EmailRegisterRequest(BaseModel):
    role: BackendRole = "CLIENT"
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None


class TherapistEmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    specialization: str
    bio: str | None = None
    languages: str | None = None
    city: str | None = None
    is_online: bool = True
    price_per_session: float | None = None


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=10)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


def _session_for_user(user: User) -> AuthSessionResponse:
    return AuthSessionResponse(
        user_id=user.id,
        role=user.role,  # type: ignore[arg-type]
        email=user.email,
        full_name=user.full_name,
        email_verified=bool(user.email_verified),
    )


def _sha256_hex(s: str) -> str:
    import hashlib

    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")


def _issue_email_verification(db: Session, user: User) -> dict:
    token = secrets.token_urlsafe(32)
    token_sha = _sha256_hex(token)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_sha256=token_sha,
            expires_at=expires_at,
        )
    )

    verify_url = f"{_frontend_base_url()}/verify-email?token={token}"
    logger.info("[DEV] Email verification link for %s: %s", user.email, verify_url)

    # For development UX (until real email sender is wired): return token/link.
    return {"dev_verify_token": token, "dev_verify_url": verify_url, "expires_at": expires_at.isoformat()}


async def _google_tokeninfo(id_token: str) -> dict:
    # Minimal verification via Google tokeninfo endpoint.
    # In production you'd verify signature using Google's public keys.
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        return r.json()


@router.post("/google", response_model=AuthSessionResponse)
async def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    info = await _google_tokeninfo(payload.id_token)
    aud = info.get("aud")
    if google_client_id and aud != google_client_id:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")

    sub = info.get("sub")
    email = info.get("email")
    name = info.get("name")
    email_verified_claim = info.get("email_verified")

    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Google token missing sub")
    if not email or not isinstance(email, str):
        raise HTTPException(status_code=400, detail="Google account has no email")

    identity = (
        db.query(UserIdentity)
        .filter(UserIdentity.provider == "google", UserIdentity.provider_user_id == sub)
        .first()
    )

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Identity user missing")
        # Ensure Google users remain verified.
        if not user.email_verified:
            user.email_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)
        return _session_for_user(user)

    # No identity yet. Try existing user by email (role separation).
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        if existing_user.role != payload.role:
            raise HTTPException(status_code=409, detail="Email already exists under a different role")

        # Attach identity for future logins.
        db.add(
            UserIdentity(
                user_id=existing_user.id,
                provider="google",
                provider_user_id=sub,
                email=email,
            )
        )
        if not existing_user.email_verified:
            existing_user.email_verified = True
            db.add(existing_user)
        db.commit()
        db.refresh(existing_user)
        return _session_for_user(existing_user)

    # Create a new user (default CLIENT).
    user = User(
        role=payload.role,
        email=email,
        full_name=name if isinstance(name, str) and name.strip() else None,
        is_active=True,
        email_verified=bool(email_verified_claim) if email_verified_claim is not None else True,
    )
    db.add(user)
    db.flush()

    db.add(
        UserIdentity(
            user_id=user.id,
            provider="google",
            provider_user_id=sub,
            email=email,
        )
    )

    # For therapists, profile creation is a separate flow; do not auto-create Therapist record.
    db.commit()
    db.refresh(user)
    return _session_for_user(user)


@router.post("/register")
def register_email(payload: EmailRegisterRequest, db: Session = Depends(get_db)):
    # Client registration via email/password.
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    try:
        pw_hash = hash_password(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = User(
        role=payload.role,
        email=str(payload.email),
        full_name=payload.full_name,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    db.flush()

    db.add(UserPasswordCredential(user_id=user.id, password_hash=pw_hash))

    extra = _issue_email_verification(db, user)
    db.commit()
    db.refresh(user)
    return {"session": _session_for_user(user), **extra}


@router.post("/therapist/register")
def register_therapist_email(payload: TherapistEmailRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    try:
        pw_hash = hash_password(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = User(
        role="THERAPIST",
        email=str(payload.email),
        full_name=payload.full_name,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    db.flush()

    db.add(UserPasswordCredential(user_id=user.id, password_hash=pw_hash))

    therapist = Therapist(
        user_id=user.id,
        full_name=payload.full_name,
        specialization=payload.specialization,
        bio=payload.bio,
        languages=payload.languages,
        city=payload.city,
        is_online=payload.is_online,
        price_per_session=payload.price_per_session,
    )
    db.add(therapist)

    extra = _issue_email_verification(db, user)
    db.commit()
    db.refresh(user)
    return {"session": _session_for_user(user), **extra}


@router.post("/login", response_model=AuthSessionResponse)
def login_email(payload: EmailLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    cred = db.query(UserPasswordCredential).filter(UserPasswordCredential.user_id == user.id).first()
    if not cred or not verify_password(payload.password, cred.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    return _session_for_user(user)


@router.post("/verify-email", response_model=AuthSessionResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    token_sha = _sha256_hex(payload.token)
    tok = db.query(EmailVerificationToken).filter(EmailVerificationToken.token_sha256 == token_sha).first()
    if not tok:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if tok.used_at is not None:
        raise HTTPException(status_code=400, detail="Token already used")

    if tok.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    user = db.query(User).filter(User.id == tok.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.email_verified = True
    tok.used_at = datetime.utcnow()
    db.add(user)
    db.add(tok)
    db.commit()
    db.refresh(user)
    return _session_for_user(user)


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Do not leak account existence.
        return {"status": "ok"}

    if user.email_verified:
        return {"status": "ok"}

    extra = _issue_email_verification(db, user)
    db.commit()
    return {"status": "ok", **extra}

