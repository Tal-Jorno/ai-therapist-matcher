from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from app.db.base import Base


class UserIdentity(Base):
    __tablename__ = "user_identities"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    provider = Column(String, nullable=False)          # "google" | "apple"
    provider_user_id = Column(String, nullable=False)
    email = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user"),
    )