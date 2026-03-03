from app.db.database import SessionLocal
from app.logger_config import logger


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        logger.error("Database session error.", exc_info=True)
        raise
    finally:
        db.close()