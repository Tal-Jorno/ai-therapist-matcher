from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.therapist import Therapist
from app.schemas.therapist import TherapistCreate, TherapistResponse
from app.logger_config import logger

router = APIRouter(prefix="/therapists", tags=["therapists"])


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