from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.models.user import User  # noqa
from app.models.user_identity import UserIdentity  # noqa
from app.models.therapist import Therapist  # noqa