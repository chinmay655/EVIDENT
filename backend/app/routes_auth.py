"""Auth routes: register, login, logout, me, forgot/reset password."""
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from bson import ObjectId

from .core import (db, hash_password, verify_password, set_auth_cookies, clear_auth_cookies,
                   get_current_user, public_user, audit, now_iso, send_email_safe, email_template,
                   FRONTEND_URL, client_ip)
from .models import RegisterIn, LoginIn, ForgotIn, ResetIn

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


async def _check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= MAX_ATTEMPTS:
        locked_until = rec.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")


async def _record_fail(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec.get("count", 0) if rec else 0) + 1
    update = {"count": count}
    if count >= MAX_ATTEMPTS:
        update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=LOCK_MINUTES)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


@router.post("/register")
async def register(payload: RegisterIn, response: Response, request: Request):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    base_username = email.split("@")[0].lower()
    username = base_username
    while await db.users.find_one({"public_username": username}):
        username = f"{base_username}{secrets.randbelow(9999)}"
    doc = {
        "email": email, "password_hash": hash_password(payload.password),
        "name": payload.full_name.strip(), "role": "student",
        "phone": payload.phone, "college": payload.college, "degree": payload.degree,
        "graduation_year": payload.graduation_year, "skills": payload.skills,
        "bio": "", "github": "", "linkedin": "", "portfolio": "",
        "profile_photo_id": None, "public_username": username,
        "created_at": now_iso(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    set_auth_cookies(response, uid, email, "student")
    user = public_user({**doc, "_id": result.inserted_id})
    await audit(user, "register", "user", uid, request)
    await send_email_safe(email, "Welcome to EVIDENT",
                          email_template("Welcome to EVIDENT",
                                         [f"Hi {payload.full_name}, your account is ready.",
                                          "Discover real projects, build them, and generate verifiable proof of your skills."],
                                         "Explore Projects", f"{FRONTEND_URL}/projects"))
    return user


@router.post("/login")
async def login(payload: LoginIn, response: Response, request: Request):
    email = payload.email.lower().strip()
    ip = client_ip(request) or "unknown"
    identifier = f"{ip}:{email}"
    await _check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await _record_fail(identifier)
        await audit(None, "failed_login", "user", email, request)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    set_auth_cookies(response, uid, email, user["role"])
    pub = public_user(user)
    await audit(pub, "admin_login" if user["role"] in ("admin", "super_admin") else "login", "user", uid, request)
    return pub


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"status": "ok"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    import jwt as _jwt
    from .core import JWT_SECRET, JWT_ALG
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = _jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    set_auth_cookies(response, str(user["_id"]), user["email"], user["role"])
    return public_user(user)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotIn, request: Request):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return ok (no user enumeration)
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": str(user["_id"]), "used": False,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "created_at": now_iso(),
        })
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        await send_email_safe(email, "Reset your EVIDENT password",
                              email_template("Reset your password",
                                             ["We received a request to reset your password.",
                                              "This link expires in 1 hour. If you didn't request this, ignore this email."],
                                             "Reset Password", reset_url))
    return {"status": "ok", "message": "If an account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": payload.token})
    if not rec or rec.get("used") or datetime.fromisoformat(rec["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    await db.users.update_one({"_id": ObjectId(rec["user_id"])},
                              {"$set": {"password_hash": hash_password(payload.password)}})
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"status": "ok"}
