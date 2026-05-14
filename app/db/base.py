from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.models.user import User  # noqa
from app.models.user_identity import UserIdentity  # noqa
from app.models.therapist import Therapist  # noqa
from app.models.user_password_credential import UserPasswordCredential  # noqa
from app.models.email_verification_token import EmailVerificationToken  # noqa
