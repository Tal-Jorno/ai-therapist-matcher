from fastapi import FastAPI
from sqlalchemy import text

from app.db.base import Base
from app.db.database import engine
from app.models.therapist import Therapist
from app.api.therapists import router as therapists_router
from app.logger_config import logger


logger.info("Starting AI Therapist Matcher application...")

# create tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables ensured.")

app = FastAPI(title="AI Therapist Matcher")

# connect router
app.include_router(therapists_router)


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
    except Exception as e:
        logger.error("Database connection failed.", exc_info=True)
        return {"error": "Database connection failed"}