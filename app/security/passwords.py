import base64
import hashlib
import hmac
import os


def hash_password(password: str, *, iterations: int = 240_000) -> str:
    if not isinstance(password, str) or len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    salt_b64 = base64.urlsafe_b64encode(salt).decode("ascii").rstrip("=")
    dk_b64 = base64.urlsafe_b64encode(dk).decode("ascii").rstrip("=")
    return f"pbkdf2_sha256${iterations}${salt_b64}${dk_b64}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, iters_s, salt_b64, dk_b64 = password_hash.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False

        iterations = int(iters_s)
        pad = lambda s: s + "=" * ((4 - len(s) % 4) % 4)
        salt = base64.urlsafe_b64decode(pad(salt_b64).encode("ascii"))
        expected = base64.urlsafe_b64decode(pad(dk_b64).encode("ascii"))

        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

