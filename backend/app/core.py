"""Core: config, db, security, storage, email, audit, notifications."""
import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta

import jwt
import bcrypt
import httpx
import requests
from bson import ObjectId
from fastapi import HTTPException, Request, Response, Depends
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("evident")

# ---------------- Config ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
APP_NAME = os.environ.get("APP_NAME", "evident")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
PAYMENT_SANDBOX = os.environ.get("PAYMENT_SANDBOX", "true").lower() == "true"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ---------------- Password ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

# ---------------- JWT ----------------
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=30), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def set_auth_cookies(response: Response, user_id: str, email: str, role: str):
    access = create_access_token(user_id, email, role)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=1800, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

def _token_from_request(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    return token

async def get_current_user(request: Request) -> dict:
    token = _token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return public_user(user)

def public_user(user: dict) -> dict:
    u = dict(user)
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u

def require_roles(*roles):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker

get_current_admin = require_roles("admin", "super_admin")

# ---------------- Audit & Notifications ----------------
def client_ip(request: Request) -> str:
    if request is None:
        return ""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else ""


async def audit(actor: dict | None, action: str, entity: str, entity_id: str = "", request: Request = None, metadata: dict = None):
    ip = ""
    if request is not None:
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "") or ""
    doc = {
        "id": str(uuid.uuid4()),
        "actor_id": actor.get("id") if actor else None,
        "actor_email": actor.get("email") if actor else None,
        "role": actor.get("role") if actor else None,
        "action": action, "entity": entity, "entity_id": entity_id,
        "ip": ip.split(",")[0].strip(), "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_logs.insert_one(doc)

async def notify(user_id: str, ntype: str, title: str, message: str, link: str = ""):
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "type": ntype,
        "title": title, "message": message, "link": link, "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

# ---------------- Object Storage ----------------
'''STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
_storage_key = None

def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

async def save_file(owner_id: str, category: str, filename: str, data: bytes, content_type: str, is_public: bool = False) -> dict:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/{category}/{owner_id}/{file_id}.{ext}"
    result = put_object(path, data, content_type)
    record = {
        "id": file_id, "storage_path": result["path"], "original_filename": filename,
        "content_type": content_type, "size": result.get("size", len(data)),
        "owner_id": owner_id, "category": category, "is_public": is_public,
        "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one(dict(record))
    return record

# ---------------- Email (best-effort, non-blocking) ----------------
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "EVIDENT")

async def send_email_safe(to: str, subject: str, html: str):
    """Never blocks core flows; logs and swallows errors if email is unavailable."""
    if not EMAIL_KEY:
        logger.info(f"[email skipped: not configured] to={to} subject={subject}")
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed to={to}: {e}")
        return None

def email_template(title: str, body_lines: list[str], cta_label: str = None, cta_url: str = None) -> str:
    body = "".join(f'<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6">{l}</p>' for l in body_lines)
    cta = ""
    if cta_label and cta_url:
        cta = (f'<a href="{cta_url}" style="display:inline-block;background:#0f172a;color:#ffffff;'
               f'text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">{cta_label}</a>')
    return (f'<table role="presentation" width="100%" style="background:#f4f4f5;padding:32px 0"><tr><td align="center">'
            f'<table role="presentation" width="560" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;'
            f'font-family:Arial,Helvetica,sans-serif"><tr><td style="padding:32px">'
            f'<p style="font-size:13px;letter-spacing:2px;color:#2563eb;font-weight:700;margin:0 0 16px">EVIDENT</p>'
            f'<h1 style="font-size:22px;color:#0f172a;margin:0 0 20px">{title}</h1>{body}{cta}'
            f'<p style="margin:28px 0 0;font-size:12px;color:#94a3b8">Sent by EVIDENT. We never ask for your '
            f'password or payment details by email.</p></td></tr></table></td></tr></table>')'''

# ---------------- Supabase Object Storage ----------------

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "evident-files").strip()


def _supabase_headers(content_type: str | None = None) -> dict:
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        raise RuntimeError("Supabase storage is not configured")

    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
    }

    if content_type:
        headers["Content-Type"] = content_type

    return headers


def put_object(path: str, data: bytes, content_type: str) -> dict:
    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{SUPABASE_BUCKET}/{path}"
    )

    headers = _supabase_headers(content_type)
    headers["x-upsert"] = "true"

    resp = requests.post(
        url,
        headers=headers,
        data=data,
        timeout=120,
    )

    resp.raise_for_status()

    return {
        "path": path,
        "size": len(data),
    }


def get_object(path: str):
    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{SUPABASE_BUCKET}/{path}"
    )

    resp = requests.get(
        url,
        headers=_supabase_headers(),
        timeout=60,
    )

    resp.raise_for_status()

    return (
        resp.content,
        resp.headers.get(
            "Content-Type",
            "application/octet-stream"
        ),
    )


async def save_file(
    owner_id: str,
    category: str,
    filename: str,
    data: bytes,
    content_type: str,
    is_public: bool = False,
) -> dict:

    ext = (
        filename.rsplit(".", 1)[-1].lower()
        if "." in filename
        else "bin"
    )

    file_id = str(uuid.uuid4())

    path = (
        f"{APP_NAME}/{category}/"
        f"{owner_id}/{file_id}.{ext}"
    )

    result = put_object(
        path,
        data,
        content_type,
    )

    record = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "owner_id": owner_id,
        "category": category,
        "is_public": is_public,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.files.insert_one(dict(record))

    return record

# ---------------- helpers ----------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def gen_id():
    return str(uuid.uuid4())

def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop("_id", None)
    return doc

# ---------------- Email (best-effort, non-blocking) ----------------

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "EVIDENT")


async def send_email_safe(to: str, subject: str, html: str):
    """Send email when configured; never block the main application flow."""

    if not EMAIL_KEY:
        logger.info(
            f"[email skipped: not configured] to={to} subject={subject}"
        )
        return None

    payload = {
        "to": [to],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as c:
            resp = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )

        resp.raise_for_status()
        return resp.json().get("id")

    except Exception as e:
        logger.error(f"Email send failed to={to}: {e}")
        return None


# ---------------- Email (best-effort, non-blocking) ----------------

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "EVIDENT")


async def send_email_safe(to: str, subject: str, html: str):
    """Send email when configured; never block the main application flow."""

    if not EMAIL_KEY:
        logger.info(
            f"[email skipped: not configured] to={to} subject={subject}"
        )
        return None

    payload = {
        "to": [to],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as c:
            resp = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )

        resp.raise_for_status()
        return resp.json().get("id")

    except Exception as e:
        logger.error(f"Email send failed to={to}: {e}")
        return None


def email_template(
    title: str,
    body_lines: list[str],
    cta_label: str = None,
    cta_url: str = None,
) -> str:
    body = "".join(
        f'<p style="margin:0 0 12px;color:#334155;'
        f'font-size:15px;line-height:1.6">{line}</p>'
        for line in body_lines
    )

    cta = ""

    if cta_label and cta_url:
        cta = (
            f'<a href="{cta_url}" '
            f'style="display:inline-block;background:#0f172a;'
            f'color:#ffffff;padding:12px 18px;border-radius:8px;'
            f'text-decoration:none;font-weight:600">'
            f'{cta_label}</a>'
        )

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;
                margin:0 auto;padding:24px">
        <h2 style="color:#0f172a">{title}</h2>
        {body}
        {cta}
    </div>
    """