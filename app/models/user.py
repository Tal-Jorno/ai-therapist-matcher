from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    role = Column(String, nullable=False)  # "CLIENT" | "THERAPIST" | "ADMIN"
    email = Column(String, nullable=True, unique=True, index=True)
    full_name = Column(String, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)