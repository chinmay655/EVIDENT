"""Public routes: catalog, project details, certificate verification, evidence, portfolio, contact, file download."""
from fastapi import APIRouter, Request, HTTPException, Query, Response
from typing import Optional
import jwt as _jwt
from bson import ObjectId

from .core import db, clean, JWT_SECRET, JWT_ALG, now_iso, get_object

router = APIRouter(tags=["public"])


def public_project_card(p: dict) -> dict:
    return {
        "id": p["id"], "title": p["title"], "slug": p["slug"],
        "short_description": p.get("short_description", ""), "category": p.get("category"),
        "difficulty": p.get("difficulty"), "technologies": p.get("technologies", []),
        "skills": p.get("skills", []), "duration_days": p.get("duration_days"),
        "price": p.get("price"), "currency": p.get("currency", "INR"),
        "thumbnail": p.get("thumbnail"), "featured": p.get("featured", False),
        "estimated_hours": p.get("estimated_hours"),
        "enrollment_count": p.get("enrollment_count", 0),
    }


@router.get("/projects")
async def list_projects(
    search: Optional[str] = None, category: Optional[str] = None,
    difficulty: Optional[str] = None, technology: Optional[str] = None,
    featured: Optional[bool] = None, sort: str = "newest",
    page: int = 1, limit: int = 12,
):
    q = {"status": "published"}
    if category and category != "All":
        q["category"] = category
    if difficulty and difficulty != "All":
        q["difficulty"] = difficulty
    if technology:
        q["technologies"] = {"$in": [technology]}
    if featured is not None:
        q["featured"] = featured
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"short_description": {"$regex": search, "$options": "i"}},
            {"skills": {"$regex": search, "$options": "i"}},
        ]
    sort_map = {"newest": [("published_at", -1)], "price_low": [("price", 1)],
                "price_high": [("price", -1)], "popular": [("enrollment_count", -1)]}
    cursor = db.projects.find(q, {"_id": 0}).sort(sort_map.get(sort, [("published_at", -1)]))
    total = await db.projects.count_documents(q)
    items = await cursor.skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"items": [public_project_card(p) for p in items], "total": total, "page": page, "limit": limit}


@router.get("/projects/categories")
async def categories():
    cats = await db.projects.distinct("category", {"status": "published"})
    return {"categories": cats}


@router.get("/projects/{slug}")
async def project_details(slug: str):
    p = await db.projects.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not available")
    version = await db.project_versions.find_one(
        {"project_id": p["id"], "version": p.get("current_version", 1)}, {"_id": 0})
    data = version["data"] if version else p
    tasks_overview = [{"title": t["title"], "description": t.get("description", ""),
                       "estimated_hours": t.get("estimated_hours"), "required": t.get("required", True),
                       "difficulty": t.get("difficulty")} for t in sorted(data.get("tasks", []), key=lambda x: x.get("order", 0))]
    resources_overview = [{"title": r["title"], "type": r.get("type"), "visibility": r.get("visibility")}
                          for r in data.get("resources", [])]
    return {
        **public_project_card(p),
        "full_description": data.get("full_description", ""),
        "requirements": data.get("requirements", []),
        "learning_outcomes": data.get("learning_outcomes", []),
        "what_student_will_build": data.get("what_student_will_build", ""),
        "what_student_will_submit": data.get("what_student_will_submit", ""),
        "project_banner": data.get("project_banner"),
        "submission_requirements": data.get("submission_requirements", []),
        "evaluation_criteria": data.get("evaluation_criteria", []),
        "certificate_config": {"enabled": data.get("certificate_config", {}).get("enabled", True)},
        "tasks_overview": tasks_overview,
        "resources_overview": resources_overview,
        "task_count": len(tasks_overview),
        "current_version": p.get("current_version", 1),
    }


@router.get("/verify/{verification_id}")
async def verify_certificate(verification_id: str):
    cert = await db.certificates.find_one({"verification_id": verification_id}, {"_id": 0})
    if not cert:
        return {"valid": False, "status": "not_found", "message": "No certificate found for this ID"}
    if cert.get("status") == "revoked":
        return {"valid": False, "status": "revoked", "message": "Certificate Revoked",
                "student_name": cert.get("student_name"), "project_title": cert.get("project_title"),
                "certificate_id": cert.get("certificate_id")}
    if cert.get("status") != "issued":
        return {"valid": False, "status": cert.get("status"), "message": "Certificate not issued"}
    return {
        "valid": True, "status": "issued",
        "student_name": cert.get("student_name"), "project_title": cert.get("project_title"),
        "category": cert.get("category"), "skills": cert.get("skills", []),
        "completion_date": cert.get("completion_date"), "certificate_id": cert.get("certificate_id"),
    }


@router.get("/evidence/{public_id}")
async def public_evidence(public_id: str):
    ev = await db.evidence.find_one({"public_id": public_id, "is_public": True}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found or not public")
    return ev


@router.get("/students/{username}")
async def public_portfolio(username: str):
    user = await db.users.find_one({"public_username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    uid = str(user["_id"])
    evidences = await db.evidence.find({"student_id": uid, "is_public": True}, {"_id": 0}).to_list(100)
    certs = await db.certificates.find({"student_id": uid, "status": "issued"}, {"_id": 0}).to_list(100)
    return {
        "name": user.get("name"), "public_username": username, "bio": user.get("bio", ""),
        "college": user.get("college"), "degree": user.get("degree"),
        "graduation_year": user.get("graduation_year"), "skills": user.get("skills", []),
        "github": user.get("github"), "linkedin": user.get("linkedin"), "portfolio": user.get("portfolio"),
        "evidence": evidences,
        "certificates": [{"project_title": c.get("project_title"), "verification_id": c.get("verification_id"),
                          "completion_date": c.get("completion_date")} for c in certs],
    }


@router.post("/contact")
async def contact(request: Request):
    body = await request.json()
    await db.contact_messages.insert_one({
        "name": body.get("name", ""), "email": body.get("email", ""),
        "message": body.get("message", ""), "created_at": now_iso(),
    })
    return {"status": "ok", "message": "Thanks — we'll get back to you soon."}


# ---------- File download (auth-aware) ----------
async def _optional_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    try:
        payload = _jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if user:
            return {"id": str(user["_id"]), "role": user["role"]}
    except Exception:
        return None
    return None


@router.get("/files/{file_id}")
async def download_file(file_id: str, request: Request):
    rec = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    if not rec.get("is_public"):
        user = await _optional_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        allowed = user["role"] in ("admin", "super_admin") or rec.get("owner_id") == user["id"]
        if not allowed and rec.get("category") == "resource":
            # allow enrolled students to access resource files
            allowed = await _user_can_access_resource(user["id"], file_id)
        if not allowed:
            raise HTTPException(status_code=403, detail="You do not have access to this file")
    data, ctype = get_object(rec["storage_path"])
    headers = {"Content-Disposition": f'inline; filename="{rec.get("original_filename", "file")}"'}
    return Response(content=data, media_type=rec.get("content_type", ctype), headers=headers)


async def _user_can_access_resource(user_id: str, file_id: str) -> bool:
    enrollments = await db.enrollments.find(
        {"student_id": user_id, "payment_status": "verified"}).to_list(200)
    for e in enrollments:
        version = await db.project_versions.find_one(
            {"project_id": e["project_id"], "version": e["project_version"]})
        if not version:
            continue
        for r in version["data"].get("resources", []):
            if r.get("file_id") == file_id and r.get("visibility") in ("enrolled", "public"):
                return True
    return False
