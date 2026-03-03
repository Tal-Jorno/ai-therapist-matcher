from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.therapist import Therapist
from app.schemas.therapist import TherapistCreate, TherapistResponse

router = APIRouter(prefix="/therapists", tags=["therapists"])


@router.post("", response_model=TherapistResponse)
def create_therapist(payload: TherapistCreate, db: Session = Depends(get_db)):
    therapist = Therapist(**payload.model_dump())
    db.add(therapist)
    db.commit()
    db.refresh(therapist)
    return therapist