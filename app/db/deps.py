from app.db.database import SessionLocal
from app.logger_config import logger
from fastapi import HTTPException


def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Database session error.")
        raise
    finally:
        db.close()