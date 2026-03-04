from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MatchSession(Base):
    __tablename__ = "match_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    status: Mapped[str] = mapped_column(String(32), default="OPEN", index=True)  # OPEN | COMPLETE | ERROR
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship("MatchMessage", back_populates="session", cascade="all, delete-orphan")