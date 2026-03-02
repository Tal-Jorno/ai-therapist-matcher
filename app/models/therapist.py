from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    bio = Column(Text)