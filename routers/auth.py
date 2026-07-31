from fastapi import APIRouter, Depends, HTTPException, Request

from core.deps import get_current_user
from core.models import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from core.rate_limit import limiter
from services.auth_service import login_user, refresh_access_token, register_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register(body: RegisterRequest, request: Request) -> TokenResponse:
    try:
        result = register_user(body.email, body.password, body.full_name, body.company_id)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
@limiter.limit("15/minute")
def login(body: LoginRequest, request: Request) -> TokenResponse:
    try:
        result = login_user(body.email, body.password)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
def refresh(body: RefreshRequest, request: Request) -> TokenResponse:
    try:
        result = refresh_access_token(body.refresh_token)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**user)
