import json
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from core.database import supabase
from core.security import (
    ROLE_VIEWER,
    create_access_token,
    create_refresh_token,
    hash_password,
    normalize_role,
    verify_password,
)
from core.supabase_helpers import response_data

USERS_FILE = Path(__file__).resolve().parent.parent / "data" / "users.json"


def _load_local_users() -> List[dict]:
    if not USERS_FILE.exists():
        return []
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))


def _save_local_users(users: List[dict]) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")


def _find_user_by_email(email: str) -> Optional[dict]:
    email = email.strip().lower()

    try:
        if supabase:
            result = supabase.table("app_users").select("*").eq("email", email).limit(1).execute()
            rows = response_data(result) or []
            if rows:
                return rows[0]
    except Exception:
        pass

    for user in _load_local_users():
        if user.get("email", "").lower() == email:
            return user
    return None


def register_user(email: str, password: str, full_name: str, company_id: Optional[str] = None) -> dict:
    email = email.strip().lower()
    if _find_user_by_email(email):
        raise ValueError("Email already registered")

    user = {
        "id": str(uuid4()),
        "email": email,
        "password_hash": hash_password(password),
        "full_name": full_name,
        # New self-service signups are read-only by default; an admin must
        # promote them. Never let the client pick its own role.
        "role": ROLE_VIEWER,
        "company_id": company_id,
    }

    try:
        if supabase:
            supabase.table("app_users").insert(user).execute()
        else:
            raise RuntimeError("Supabase is not configured")
    except Exception:
        users = _load_local_users()
        users.append(user)
        _save_local_users(users)

    return _issue_tokens(user)


def google_login_user(access_token: str) -> dict:
    """Verify a Supabase Google session and sync the user into app_users."""
    if not supabase:
        raise ValueError("Supabase is not configured")

    try:
        auth_response = supabase.auth.get_user(access_token)
        auth_user = getattr(auth_response, "user", None)
    except Exception as exc:
        raise ValueError("Invalid Google authentication token") from exc

    if not auth_user:
        raise ValueError("Invalid Google authentication token")

    user_id = str(auth_user.id)
    email = (auth_user.email or "").strip().lower()
    if not email:
        raise ValueError("Google account does not have an email address")

    metadata = getattr(auth_user, "user_metadata", None) or {}
    full_name = (
        metadata.get("full_name")
        or metadata.get("name")
        or metadata.get("user_name")
        or email.split("@", 1)[0]
    ).strip()

    existing = None
    try:
        result = (
            supabase.table("app_users")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = response_data(result) or []
        if rows:
            existing = rows[0]
    except Exception as exc:
        raise ValueError("Unable to check application user") from exc

    if existing:
        user = existing
    else:
        user = {
            "id": user_id,
            "email": email,
            "password_hash": "",
            "full_name": full_name,
            "role": ROLE_VIEWER,
            "company_id": None,
        }
        try:
            result = supabase.table("app_users").insert(user).execute()
            rows = response_data(result) or []
            if rows:
                user = rows[0]
        except Exception as exc:
            raise ValueError("Unable to create application user") from exc

    return _issue_tokens(user)


def login_user(email: str, password: str) -> dict:
    user = _find_user_by_email(email)
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise ValueError("Invalid email or password")
    return _issue_tokens(user)


def _issue_tokens(user: dict) -> dict:
    role = normalize_role(user.get("role"))
    access = create_access_token(
        user["id"],
        {"email": user.get("email"), "role": role, "name": user.get("full_name", "User")},
    )
    refresh = create_refresh_token(user["id"])
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": _public_user(user),
    }


def get_user_by_id(user_id: str) -> Optional[dict]:
    try:
        if supabase:
            result = supabase.table("app_users").select("*").eq("id", user_id).limit(1).execute()
            rows = response_data(result) or []
            if rows:
                return _public_user(rows[0])
    except Exception:
        pass

    for user in _load_local_users():
        if user.get("id") == user_id:
            return _public_user(user)
    return None


def update_user_profile(user_id: str, full_name: str) -> dict:
    full_name = full_name.strip()
    if not full_name:
        raise ValueError("Full name is required")

    updated_user = None

    if supabase:
        try:
            result = (
                supabase.table("app_users")
                .update({"full_name": full_name})
                .eq("id", user_id)
                .select("*")
                .limit(1)
                .execute()
            )
            rows = response_data(result) or []
            if rows:
                updated_user = rows[0]
        except Exception as exc:
            raise ValueError("Unable to update profile") from exc

    if updated_user is None:
        users = _load_local_users()
        for user in users:
            if user.get("id") == user_id:
                user["full_name"] = full_name
                updated_user = user
                break

        if updated_user is not None:
            _save_local_users(users)

    if not updated_user:
        raise ValueError("User not found")

    return _public_user(updated_user)


def refresh_access_token(refresh_token: str) -> dict:
    """Exchange a valid refresh token for a fresh access token."""
    from core.security import decode_token

    payload = decode_token(refresh_token, expected_type="refresh")
    if not payload or not payload.get("sub"):
        raise ValueError("Invalid or expired refresh token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise ValueError("User not found")
    return _issue_tokens(user)


def _public_user(user: dict) -> dict:
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": normalize_role(user.get("role")),
        "company_id": user.get("company_id"),
    }
