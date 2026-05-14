"""Idempotent schema patching for local development.

The project uses `Base.metadata.create_all()` which creates missing tables but
does not migrate existing ones (e.g. add new columns).

This module applies minimal, safe DDL patches at startup so model/schema drift
does not break auth.
"""

from __future__ import annotations

from sqlalchemy import Engine, text

from app.logger_config import logger


def apply_auth_schema_patch(engine: Engine) -> None:
    """Apply minimal auth-related schema patches.

    Properties:
    - Idempotent: safe to run on every startup.
    - Non-destructive: no data deletion or DB reset.
    """

    statements: list[str] = [
        # users.email_verified
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;",

        # user_password_credentials
        """
        CREATE TABLE IF NOT EXISTS user_password_credentials (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            password_hash VARCHAR NOT NULL,
            CONSTRAINT uq_user_password_user_id UNIQUE (user_id),
            CONSTRAINT user_password_credentials_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_user_password_credentials_user_id ON user_password_credentials (user_id);",

        # email_verification_tokens
        """
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            token_sha256 VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            CONSTRAINT uq_email_verify_token_sha UNIQUE (token_sha256),
            CONSTRAINT email_verification_tokens_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_user_id ON email_verification_tokens (user_id);",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_email_verification_tokens_token_sha256 ON email_verification_tokens (token_sha256);",

        # email_verification_codes
        """
        CREATE TABLE IF NOT EXISTS email_verification_codes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            code_sha256 VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            CONSTRAINT email_verification_codes_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT uq_email_verify_user_code_sha UNIQUE (user_id, code_sha256)
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_email_verification_codes_user_id ON email_verification_codes (user_id);",
        "CREATE INDEX IF NOT EXISTS ix_email_verification_codes_code_sha256 ON email_verification_codes (code_sha256);",

        # password_reset_tokens
        """
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            code_sha256 VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            CONSTRAINT password_reset_tokens_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT uq_password_reset_user_code_sha UNIQUE (user_id, code_sha256)
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);",
        "CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_code_sha256 ON password_reset_tokens (code_sha256);",

        # user_identities.user_id index (model sets index=True)
        "CREATE INDEX IF NOT EXISTS ix_user_identities_user_id ON user_identities (user_id);",

        # Data-safe backfill: Google identities imply verified emails.
        """
        UPDATE users
        SET email_verified = TRUE
        WHERE email_verified = FALSE
          AND id IN (SELECT user_id FROM user_identities WHERE provider = 'google');
        """,
    ]

    try:
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))
        logger.info("Auth schema patch applied/verified successfully.")
    except Exception:
        logger.error("Auth schema patch failed.", exc_info=True)
        raise
