from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("match_sessions.id", ondelete="CASCADE"), unique=True, index=True)

    payload: Mapped[dict] = mapped_column(JSON)  # store {top5:[...], reasons:[...], extraction:{...}}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())