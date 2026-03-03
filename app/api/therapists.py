from decimal import Decimal

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.therapist import Therapist
from app.schemas.therapists_schema import TherapistCreate, TherapistResponse, TherapistUpdate
from app.logger_config import logger
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schemas.therapists_schema import TherapistRegisterRequest


router = APIRouter(prefix="/therapists", tags=["therapists"])


@router.get("", response_model=list[TherapistResponse])
def get_therapists(
    city: str | None = None,
    specialization: str | None = None,
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    is_online: bool | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    logger.info(
        "Get therapists called. city=%s specialization=%s min_price=%s max_price=%s is_online=%s limit=%s offset=%s",
        city,
        specialization,
        min_price,
        max_price,
        is_online,
        limit,
        offset,
    )

    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price cannot be greater than max_price")

    query = db.query(Therapist)

    if city is not None:
        city = city.strip()
        if city != "":
            query = query.filter(Therapist.city.ilike(f"%{city}%"))

    if specialization is not None:
        specialization = specialization.strip()
        if specialization != "":
            query = query.filter(Therapist.specialization.ilike(f"%{specialization}%"))

    if min_price is not None:
        query = query.filter(Therapist.price_per_session >= min_price)

    if max_price is not None:
        query = query.filter(Therapist.price_per_session <= max_price)

    if is_online is not None:
        query = query.filter(Therapist.is_online == is_online)

    therapists = query.offset(offset).limit(limit).all()
    logger.info("Get therapists returned %d records.", len(therapists))
    return therapists

@router.post("/register", response_model=TherapistResponse, status_code=status.HTTP_201_CREATED)
def register_therapist(payload: TherapistRegisterRequest, db: Session = Depends(get_db)):
    try:
        user = User(role="THERAPIST", email=payload.email, full_name=payload.full_name)
        db.add(user)
        db.flush()

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
        db.commit()
        db.refresh(therapist)
        return therapist
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already exists")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to register therapist")



@router.get("/{user_id}", response_model=TherapistResponse)
def get_therapist_by_id(user_id: int, db: Session = Depends(get_db)):
    logger.info("Get therapist by user_id called. user_id=%s", user_id)

    therapist = db.get(Therapist, user_id)
    if not therapist:
        logger.info("Therapist not found. user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    return therapist


@router.patch("/{user_id}", response_model=TherapistResponse)
def update_therapist(
    user_id: int,
    payload: TherapistUpdate,
    db: Session = Depends(get_db),
):
    logger.info("Patch therapist called. user_id=%s", user_id)

    therapist = db.get(Therapist, user_id)
    if not therapist:
        logger.info("Therapist not found for patch. user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    updates = payload.model_dump(exclude_unset=True)

    try:
        for field, value in updates.items():
            setattr(therapist, field, value)

        db.commit()
        db.refresh(therapist)

        logger.info(
            "Therapist updated successfully. user_id=%s updated_fields=%s",
            user_id,
            list(updates.keys()),
        )
        return therapist
    except Exception:
        db.rollback()
        logger.error("Failed to update therapist. user_id=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update therapist")


@router.delete("/{user_id}")
def delete_therapist(user_id: int, db: Session = Depends(get_db)):
    logger.info("Delete therapist called. user_id=%s", user_id)

    therapist = db.get(Therapist, user_id)
    if not therapist:
        logger.info("Therapist not found for delete. user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    try:
        db.delete(therapist)
        db.commit()

        logger.info("Therapist deleted successfully. user_id=%s", user_id)
        return {"status": "deleted", "user_id": user_id}
    except Exception:
        db.rollback()
        logger.error("Failed to delete therapist. user_id=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete therapist")