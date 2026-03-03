from fastapi import FastAPI
from sqlalchemy import text

from app.db.base import Base
from app.db.database import engine
from app.models.therapist import Therapist  # חשוב כדי שהטבלה תיווצר
from app.api.therapists import router as therapists_router


# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Therapist Matcher")

# connect router
app.include_router(therapists_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"db_response": result.scalar()}


print("LOADED ROUTES:", [r.path for r in app.routes])