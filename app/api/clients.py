from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.deps import get_db
from app.models.user import User
from app.schemas.client_schema import ClientRegisterRequest
from app.schemas.client_schema import ClientUpdateRequest
from app.schemas.client_schema import UserResponse

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




@router.get("/{user_id}", response_model=UserResponse)
def get_client(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "CLIENT").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def patch_client(user_id: int, payload: ClientUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "CLIENT").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"] != user.email:
        existing = db.query(User).filter(User.email == data["email"]).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    for k, v in data.items():
        setattr(user, k, v)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "CLIENT").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    db.delete(user)
    db.commit()
    return None