import logging
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.rate_limit import limiter
from routers.alerts import router as alerts_router
from routers.auth import router as auth_router
from routers.companies import router as companies_router
from routers.dashboard import router as dashboard_router
from routers.disruptions import router as disruptions_router
from routers.external import router as external_router
from routers.graph import router as graph_router
from routers.nlp import router as nlp_router
from routers.risk import router as risk_router
from routers.suppliers import router as suppliers_router

logger = logging.getLogger("suplai")

# ---- CORS: explicit allowed origins only (never "*" with credentials) --------
_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _origins_raw.split(",") if o.strip()]

app = FastAPI(
    title="SuplAI",
    description="AI-Powered Supply Chain Disruption Prediction",
    version="1.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Prevents any null-deref / unexpected error from leaking a stack trace to
    # clients; logs the real cause server-side.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(companies_router, prefix="/companies", tags=["companies"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
app.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])
app.include_router(disruptions_router, prefix="/disruptions", tags=["disruptions"])
app.include_router(graph_router, prefix="/graph", tags=["graph"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(risk_router, prefix="/risk", tags=["risk"])
app.include_router(nlp_router, prefix="/nlp", tags=["nlp"])
app.include_router(external_router, prefix="/external", tags=["external"])


@app.get("/")
def read_root() -> dict:
    return {
        "message": "Welcome to SuplAI",
        "docs": "/docs",
        "tagline": "AI-Powered Supply Chain Disruption Prediction",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
