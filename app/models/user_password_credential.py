from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint

from app.db.base import Base


class UserPasswordCredential(Base):
    __tablename__ = "user_password_credentials"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Stored as: "pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>"
    password_hash = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", name="uq_user_password_user_id"),)

