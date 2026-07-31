import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

APP_ENV = os.getenv("APP_ENV", "development").lower()
_DEFAULT_DEV_SECRET = "suplai-dev-secret-change-in-production"
SECRET_KEY = os.getenv("JWT_SECRET_KEY", _DEFAULT_DEV_SECRET)

# Fail fast in production if the secret was never configured. A predictable
# secret lets anyone forge tokens, so we refuse to boot rather than run insecure.
if APP_ENV == "production" and (not SECRET_KEY or SECRET_KEY == _DEFAULT_DEV_SECRET):
    raise RuntimeError(
        "JWT_SECRET_KEY must be set to a strong, non-default value when APP_ENV=production. "
        'Generate one with: python -c "import secrets;print(secrets.token_urlsafe(48))"'
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7"))

# Roles recognised by the platform.
ROLE_ADMIN = "admin"
ROLE_VIEWER = "viewer"
VALID_ROLES = {ROLE_ADMIN, ROLE_VIEWER}


def normalize_role(role: Optional[str]) -> str:
    """Map any legacy/unknown role to a safe read-only default."""
    r = (role or "").strip().lower()
    if r == ROLE_ADMIN:
        return ROLE_ADMIN
    # Legacy "user" and anything unexpected collapse to read-only viewer.
    return ROLE_VIEWER


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str, extra: Optional[dict] = None) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if expected_type and payload.get("type") not in (None, expected_type):
        # A refresh token must not be usable as an access token, and vice versa.
        return None
    return payload
