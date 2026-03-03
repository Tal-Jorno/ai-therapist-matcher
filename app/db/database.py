import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.logger_config import logger

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable is not set.")
    raise ValueError("DATABASE_URL is not set")

logger.info("Initializing database connection...")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    logger.info("Database engine created successfully.")
except Exception:
    logger.error("Failed to create database engine.", exc_info=True)
    raise