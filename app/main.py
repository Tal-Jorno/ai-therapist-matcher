from fastapi import FastAPI
from sqlalchemy import text

from app.db.base import Base
from app.db.database import engine
from app.models.therapist import Therapist
from app.models.user import User  # חשוב שייטען
from app.models.user_identity import UserIdentity  # חשוב שייטען
from app.api.therapists import router as therapists_router
from app.api.clients import router as clients_router
from app.logger_config import logger
from app.models.match_session import MatchSession
from app.models.match_message import MatchMessage
from app.models.match_result import MatchResult
from app.api.match import router as match_router



logger.info("Starting AI Therapist Matcher application...")

Base.metadata.create_all(bind=engine)
logger.info("Database tables ensured.")

app = FastAPI(title="AI Therapist Matcher")
app.include_router(match_router)
app.include_router(therapists_router)
app.include_router(clients_router)


@app.get("/health")
def health():
    logger.info("Health check endpoint called.")
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    logger.info("DB check endpoint called.")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("Database connection successful.")
            return {"db_response": result.scalar()}
    except Exception:
        logger.error("Database connection failed.", exc_info=True)
        return {"error": "Database connection failed"}