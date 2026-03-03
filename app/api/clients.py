from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.deps import get_db
from app.models.user import User
from app.schemas.client_schema import ClientRegisterRequest

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_client(payload: ClientRegisterRequest, db: Session = Depends(get_db)):
    try:
        user = User(role="CLIENT", email=payload.email, full_name=payload.full_name, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"user_id": user.id, "role": user.role, "email": user.email, "full_name": user.full_name}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already exists")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to register client")