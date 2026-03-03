from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric
from app.db.base import Base


class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    bio = Column(Text, nullable=True)

    languages = Column(String, nullable=True)   # "Hebrew,English"
    city = Column(String, nullable=True)

    is_online = Column(Boolean, default=True, nullable=False)
    price_per_session = Column(Numeric(10, 2), nullable=True)