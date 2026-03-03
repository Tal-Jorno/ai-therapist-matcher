from decimal import Decimal

from fastapi import (APIRouter, Depends, Query, HTTPException)
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.therapist import Therapist
from app.schemas.create_response_update import TherapistCreate, TherapistResponse, TherapistUpdate
from app.logger_config import logger

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

    query = db.query(Therapist)

    if city:
        city = city.strip()
        if city != "":
            query = query.filter(Therapist.city.ilike(f"%{city}%"))

    if specialization:
        specialization = specialization.strip()
        if specialization != "":
            query = query.filter(Therapist.specialization.ilike(f"%{specialization}%"))

    if min_price:
        query = query.filter(Therapist.price_per_session >= min_price)

    if max_price:
        query = query.filter(Therapist.price_per_session <= max_price)

    if is_online is not None:
        query = query.filter(Therapist.is_online == is_online)

    therapists = query.offset(offset).limit(limit).all()
    logger.info("Get therapists returned %d records.", len(therapists))
    return therapists


@router.post("", response_model=TherapistResponse)
def create_therapist(payload: TherapistCreate, db: Session = Depends(get_db)):
    logger.info("Create therapist request received. Name=%s", payload.full_name)

    try:
        therapist = Therapist(**payload.model_dump())
        db.add(therapist)
        db.commit()
        db.refresh(therapist)

        logger.info("Therapist created successfully. ID=%s", therapist.id)
        return therapist
    except Exception:
        logger.error("Failed to create therapist.", exc_info=True)
        raise

@router.get("/{therapist_id}", response_model=TherapistResponse)
def get_therapist_by_id(therapist_id: int, db: Session = Depends(get_db)):
    logger.info("Get therapist by id called. id=%s", therapist_id)

    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        logger.info("Therapist not found. id=%s", therapist_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    return therapist

@router.patch("/{therapist_id}", response_model=TherapistResponse)
def update_therapist(
    therapist_id: int,
    payload: TherapistUpdate,
    db: Session = Depends(get_db),
):
    logger.info("Patch therapist called. id=%s", therapist_id)

    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        logger.info("Therapist not found for patch. id=%s", therapist_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(therapist, field, value)

    db.commit()
    db.refresh(therapist)

    logger.info("Therapist updated successfully. id=%s updated_fields=%s", therapist_id, list(updates.keys()))
    return therapist


@router.delete("/{therapist_id}")
def delete_therapist(therapist_id: int, db: Session = Depends(get_db)):
    logger.info("Delete therapist called. id=%s", therapist_id)

    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        logger.info("Therapist not found for delete. id=%s", therapist_id)
        raise HTTPException(status_code=404, detail="Therapist not found")

    db.delete(therapist)
    db.commit()

    logger.info("Therapist deleted successfully. id=%s", therapist_id)
    return {"status": "deleted", "id": therapist_id}