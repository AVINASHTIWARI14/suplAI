from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.security import ROLE_ADMIN, decode_token, normalize_role
from services.auth_service import get_user_by_id

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials, expected_type="access")
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user["role"] = normalize_role(user.get("role"))
    return user


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials or not credentials.credentials:
        return None
    payload = decode_token(credentials.credentials, expected_type="access")
    if not payload or not payload.get("sub"):
        return None
    user = get_user_by_id(payload["sub"])
    if user:
        user["role"] = normalize_role(user.get("role"))
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Guard for write/CRUD endpoints — viewers are read-only."""
    if normalize_role(user.get("role")) != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required for this action",
        )
    return user
