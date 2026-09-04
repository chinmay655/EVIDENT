"""EVIDENT — Project Experience Platform API."""
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from app.core import logger
from app.routes_auth import router as auth_router
from app.routes_public import router as public_router
from app.routes_student import router as student_router
from app.routes_admin import router as admin_router
from app.seed import run_seed

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

app = FastAPI(title="EVIDENT API", version="1.0.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health():
    return {"status": "ok"}


@api_router.get("/")
async def root():
    return {"message": "EVIDENT API", "status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(public_router)
api_router.include_router(student_router)
api_router.include_router(admin_router)
app.include_router(api_router)

_frontend = os.environ.get("FRONTEND_URL", "").strip()
_origins = os.environ.get("CORS_ORIGINS", "*")
allow_origins = [_frontend] if _frontend and _origins == "*" else _origins.split(",")
if _origins == "*" and not _frontend:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    if os.environ.get("ENVIRONMENT") == "production":
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"})


@app.on_event("startup")
async def startup():
    try:
        await run_seed()
        logger.info("Seed complete")
    except Exception as e:
        logger.error(f"Seed failed: {e}")