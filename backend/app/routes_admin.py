"""Admin routes: dashboard, projects, versioning, students, enrollments, submissions, certificates, questions, audit."""
import re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Query

from .core import (db, get_current_admin, gen_id, now_iso, save_file, notify, audit,
                   send_email_safe, email_template, FRONTEND_URL, clean)
from .models import ProjectIn, ReviewIn, ExtendDeadlineIn, AnswerIn
from .services import issue_certificate, compute_progress, get_version_data

router = APIRouter(prefix="/admin", tags=["admin"])

CONTENT_FIELDS = ["title", "short_description", "full_description", "category", "difficulty",
                  "technologies", "skills", "duration_days", "price", "currency", "thumbnail",
                  "project_banner", "requirements", "learning_outcomes", "what_student_will_build",
                  "what_student_will_submit", "project_type", "estimated_hours",
                  "submission_requirements", "evaluation_criteria", "certificate_config",
                  "tasks", "resources"]

RES_MIME = {"pdf": "application/pdf", "csv": "text/csv", "zip": "application/zip",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "txt": "text/plain"}


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "project"


def _normalize_content(payload: dict) -> dict:
    data = {k: payload[k] for k in CONTENT_FIELDS if k in payload}
    # ensure task/resource ids
    for t in data.get("tasks", []):
        if not t.get("id"):
            t["id"] = gen_id()
    for i, t in enumerate(sorted(data.get("tasks", []), key=lambda x: x.get("order", 0))):
        t["order"] = i
    for r in data.get("resources", []):
        if not r.get("id"):
            r["id"] = gen_id()
    return data


# ---------------- Dashboard ----------------
@router.get("/dashboard")
async def dashboard(admin: dict = Depends(get_current_admin)):
    total_students = await db.users.count_documents({"role": "student"})
    active_enrollments = await db.enrollments.count_documents({"status": "active"})
    completed = await db.enrollments.count_documents({"status": "completed"})
    pending_submissions = await db.submissions.count_documents({"status": "submitted"})
    revision_requests = await db.enrollments.count_documents({"status": "revision_required"})
    open_questions = await db.questions.count_documents({"status": "open"})
    certs_issued = await db.certificates.count_documents({"status": "issued"})
    projects_count = await db.projects.count_documents({})
    payments = await db.payments.find({"status": "verified"}).to_list(5000)
    revenue = sum(p["amount"] for p in payments) / 100

    # time series (last 30 days)
    by_day_enroll = defaultdict(int)
    by_day_rev = defaultdict(float)
    since = datetime.now(timezone.utc) - timedelta(days=30)
    all_enr = await db.enrollments.find({"payment_status": "verified"}).to_list(5000)
    for e in all_enr:
        try:
            d = datetime.fromisoformat(e["created_at"])
            if d >= since:
                by_day_enroll[d.strftime("%Y-%m-%d")] += 1
        except Exception:
            pass
    for p in payments:
        try:
            d = datetime.fromisoformat(p["created_at"])
            if d >= since:
                by_day_rev[d.strftime("%Y-%m-%d")] += p["amount"] / 100
        except Exception:
            pass
    days = [(datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(29, -1, -1)]
    enroll_series = [{"date": d, "count": by_day_enroll.get(d, 0)} for d in days]
    revenue_series = [{"date": d, "amount": round(by_day_rev.get(d, 0), 2)} for d in days]

    # project popularity
    pop = defaultdict(int)
    for e in all_enr:
        pop[e["project_id"]] += 1
    projects = await db.projects.find({}).to_list(500)
    pname = {p["id"]: p["title"] for p in projects}
    popularity = sorted([{"project": pname.get(pid, "?"), "enrollments": c} for pid, c in pop.items()],
                        key=lambda x: -x["enrollments"])[:6]
    total_paid = len(all_enr)
    completion_rate = round((completed / total_paid) * 100) if total_paid else 0

    recent = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(12).to_list(12)
    return {
        "stats": {"total_students": total_students, "active_enrollments": active_enrollments,
                  "completed_projects": completed, "revenue": revenue,
                  "pending_submissions": pending_submissions, "revision_requests": revision_requests,
                  "open_questions": open_questions, "certificates_issued": certs_issued,
                  "projects": projects_count, "completion_rate": completion_rate},
        "enrollments_series": enroll_series, "revenue_series": revenue_series,
        "popularity": popularity, "recent_activity": recent,
    }


# ---------------- Projects ----------------
@router.get("/projects")
async def admin_projects(status: str = None, admin: dict = Depends(get_current_admin)):
    q = {}
    if status and status != "All":
        q["status"] = status
    items = await db.projects.find(q, {"_id": 0}).sort("updated_at", -1).to_list(500)
    for p in items:
        p["enrollment_count"] = await db.enrollments.count_documents(
            {"project_id": p["id"], "payment_status": "verified"})
    return {"items": items}


@router.get("/projects/{project_id}")
async def admin_project_get(project_id: str, admin: dict = Depends(get_current_admin)):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p["enrollment_count"] = await db.enrollments.count_documents(
        {"project_id": project_id, "payment_status": "verified"})
    return p


@router.post("/projects")
async def create_project(payload: ProjectIn, request: Request, admin: dict = Depends(get_current_admin)):
    data = _normalize_content(payload.model_dump())
    slug = payload.slug or slugify(payload.title)
    base = slug
    n = 1
    while await db.projects.find_one({"slug": slug}):
        n += 1
        slug = f"{base}-{n}"
    doc = {"id": gen_id(), "slug": slug, "status": "draft", "featured": payload.featured,
           "current_version": 0, "enrollment_count": 0,
           "created_at": now_iso(), "updated_at": now_iso(), "published_at": None, **data}
    await db.projects.insert_one(dict(doc))
    await audit(admin, "project_creation", "project", doc["id"], request, {"title": payload.title})
    doc.pop("_id", None)
    return doc


@router.patch("/projects/{project_id}")
async def update_project(project_id: str, payload: ProjectIn, request: Request,
                         admin: dict = Depends(get_current_admin)):
    p = await db.projects.find_one({"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    data = _normalize_content(payload.model_dump())
    if p.get("price") != data.get("price"):
        await audit(admin, "price_change", "project", project_id, request,
                    {"old": p.get("price"), "new": data.get("price")})
    data["featured"] = payload.featured
    data["updated_at"] = now_iso()
    await db.projects.update_one({"id": project_id}, {"$set": data})
    fresh = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return fresh


@router.post("/projects/{project_id}/publish")
async def publish_project(project_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    p = await db.projects.find_one({"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    current = p.get("current_version", 0)
    enrollments_on_current = await db.enrollments.count_documents(
        {"project_id": project_id, "project_version": current, "payment_status": "verified"}) if current else 0
    if current == 0:
        new_version = 1
    elif enrollments_on_current > 0:
        new_version = current + 1  # protect existing enrollments -> immutable new version
    else:
        new_version = current  # safe to re-snapshot in place
    snapshot = {k: p.get(k) for k in CONTENT_FIELDS}
    await db.project_versions.update_one(
        {"project_id": project_id, "version": new_version},
        {"$set": {"project_id": project_id, "version": new_version, "data": snapshot,
                  "created_at": now_iso()}}, upsert=True)
    await db.projects.update_one({"id": project_id}, {"$set": {
        "status": "published", "current_version": new_version,
        "published_at": p.get("published_at") or now_iso(), "updated_at": now_iso()}})
    await audit(admin, "project_publication", "project", project_id, request, {"version": new_version})
    fresh = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return {"status": "published", "version": new_version, "project": fresh}


@router.post("/projects/{project_id}/unpublish")
async def unpublish(project_id: str, admin: dict = Depends(get_current_admin)):
    await db.projects.update_one({"id": project_id}, {"$set": {"status": "draft", "updated_at": now_iso()}})
    return {"status": "draft"}


@router.post("/projects/{project_id}/archive")
async def archive(project_id: str, admin: dict = Depends(get_current_admin)):
    await db.projects.update_one({"id": project_id}, {"$set": {"status": "archived", "updated_at": now_iso()}})
    return {"status": "archived"}


@router.post("/projects/{project_id}/feature")
async def toggle_feature(project_id: str, admin: dict = Depends(get_current_admin)):
    p = await db.projects.find_one({"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    newval = not p.get("featured", False)
    await db.projects.update_one({"id": project_id}, {"$set": {"featured": newval}})
    return {"featured": newval}


@router.post("/projects/{project_id}/duplicate")
async def duplicate(project_id: str, admin: dict = Depends(get_current_admin)):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    new = dict(p)
    new["id"] = gen_id()
    new["title"] = p["title"] + " (Copy)"
    base = slugify(new["title"])
    slug = base
    n = 1
    while await db.projects.find_one({"slug": slug}):
        n += 1
        slug = f"{base}-{n}"
    new["slug"] = slug
    new["status"] = "draft"
    new["current_version"] = 0
    new["published_at"] = None
    new["created_at"] = now_iso()
    new["updated_at"] = now_iso()
    await db.projects.insert_one(dict(new))
    return {"id": new["id"]}


@router.post("/resources/upload")
async def upload_resource(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in RES_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported type. Allowed: {', '.join(RES_MIME)}")
    data = await file.read()
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    rec = await save_file(admin["id"], "resource", file.filename, data, RES_MIME[ext], is_public=False)
    return {"file_id": rec["id"], "filename": rec["original_filename"], "type": ext}


# ---------------- Students ----------------
@router.get("/students")
async def students(search: str = None, admin: dict = Depends(get_current_admin)):
    q = {"role": "student"}
    if search:
        q["$or"] = [{"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"college": {"$regex": search, "$options": "i"}}]
    users = await db.users.find(q).sort("created_at", -1).limit(500).to_list(500)
    out = []
    for u in users:
        uid = str(u["_id"])
        out.append({
            "id": uid, "name": u.get("name"), "email": u.get("email"),
            "college": u.get("college"), "created_at": u.get("created_at"),
            "active_enrollments": await db.enrollments.count_documents(
                {"student_id": uid, "status": "active"}),
            "completed": await db.enrollments.count_documents(
                {"student_id": uid, "status": "completed"}),
            "certificates": await db.certificates.count_documents(
                {"student_id": uid, "status": "issued"}),
        })
    return {"items": out}


@router.get("/students/{student_id}")
async def student_detail(student_id: str, admin: dict = Depends(get_current_admin)):
    u = await db.users.find_one({"_id": ObjectId(student_id)})
    if not u:
        raise HTTPException(status_code=404, detail="Student not found")
    enrs = await db.enrollments.find({"student_id": student_id}).sort("created_at", -1).to_list(100)
    enr_out = []
    for e in enrs:
        proj = await db.projects.find_one({"id": e["project_id"]})
        enr_out.append({"id": e["id"], "project": proj["title"] if proj else "?",
                        "status": e["status"], "payment_status": e["payment_status"]})
    return {"id": student_id, "name": u.get("name"), "email": u.get("email"),
            "college": u.get("college"), "degree": u.get("degree"),
            "graduation_year": u.get("graduation_year"), "skills": u.get("skills", []),
            "created_at": u.get("created_at"), "enrollments": enr_out}


# ---------------- Enrollments ----------------
@router.get("/enrollments")
async def admin_enrollments(status: str = None, admin: dict = Depends(get_current_admin)):
    q = {}
    if status and status != "All":
        q["status"] = status
    enrs = await db.enrollments.find(q).sort("created_at", -1).limit(500).to_list(500)
    out = []
    for e in enrs:
        proj = await db.projects.find_one({"id": e["project_id"]})
        student = await db.users.find_one({"_id": ObjectId(e["student_id"])})
        prog = await compute_progress(e) if e.get("payment_status") == "verified" else {"percent": 0}
        overdue = False
        if e.get("due_date"):
            overdue = datetime.fromisoformat(e["due_date"]) < datetime.now(timezone.utc) and e["status"] not in ("completed",)
        out.append({"id": e["id"], "student": student.get("name") if student else "?",
                    "student_email": student.get("email") if student else "",
                    "project": proj["title"] if proj else "?", "version": e["project_version"],
                    "status": e["status"], "payment_status": e["payment_status"],
                    "progress": prog.get("percent", 0), "due_date": e.get("due_date"), "overdue": overdue})
    return {"items": out}


@router.get("/enrollments/{enrollment_id}")
async def admin_enrollment_detail(enrollment_id: str, admin: dict = Depends(get_current_admin)):
    e = await db.enrollments.find_one({"id": enrollment_id}, {"_id": 0})
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    proj = await db.projects.find_one({"id": e["project_id"]})
    student = await db.users.find_one({"_id": ObjectId(e["student_id"])})
    subs = await db.submissions.find({"enrollment_id": enrollment_id}, {"_id": 0}).sort("version", 1).to_list(100)
    prog = await compute_progress(e)
    resume = await db.files.find_one({"id": e.get("resume_file_id")})
    cert = await db.certificates.find_one({"enrollment_id": enrollment_id}, {"_id": 0})
    return {"enrollment": e, "project": proj["title"] if proj else "?",
            "student": {"name": student.get("name"), "email": student.get("email")} if student else {},
            "resume_file_id": e.get("resume_file_id") if resume else None,
            "submissions": subs, "progress": prog, "certificate": cert,
            "deadline_history": e.get("deadline_history", [])}


@router.post("/enrollments/{enrollment_id}/extend-deadline")
async def extend_deadline(enrollment_id: str, payload: ExtendDeadlineIn, request: Request,
                          admin: dict = Depends(get_current_admin)):
    e = await db.enrollments.find_one({"id": enrollment_id})
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    history = e.get("deadline_history", [])
    history.append({"old": e.get("due_date"), "new": payload.due_date, "reason": payload.reason,
                    "by": admin["email"], "at": now_iso()})
    await db.enrollments.update_one({"id": enrollment_id}, {"$set": {
        "due_date": payload.due_date, "allow_late": True, "deadline_history": history}})
    await audit(admin, "deadline_extension", "enrollment", enrollment_id, request, {"new": payload.due_date})
    await notify(e["student_id"], "deadline_extended", "Deadline extended",
                 "Your project deadline has been extended.", f"/workspace/{enrollment_id}")
    return {"status": "ok"}


@router.post("/enrollments/{enrollment_id}/cancel")
async def cancel_enrollment(enrollment_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    await db.enrollments.update_one({"id": enrollment_id}, {"$set": {"status": "cancelled"}})
    await audit(admin, "access_changes", "enrollment", enrollment_id, request, {"action": "cancel"})
    return {"status": "cancelled"}


@router.post("/enrollments/{enrollment_id}/issue-certificate")
async def admin_issue_cert(enrollment_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    e = await db.enrollments.find_one({"id": enrollment_id})
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    cert = await issue_certificate(e, admin, force=True)
    await audit(admin, "certificate_issue", "certificate", cert["id"], request,
                {"enrollment_id": enrollment_id, "manual": True})
    return {"status": "issued", "certificate_id": cert["certificate_id"]}


# ---------------- Submissions ----------------
@router.get("/submissions")
async def admin_submissions(status: str = None, admin: dict = Depends(get_current_admin)):
    q = {}
    if status and status != "All":
        q["status"] = status
    subs = await db.submissions.find(q).sort("created_at", -1).limit(500).to_list(500)
    out = []
    for s in subs:
        e = await db.enrollments.find_one({"id": s["enrollment_id"]})
        student = await db.users.find_one({"_id": ObjectId(s["student_id"])}) if s.get("student_id") else None
        proj = await db.projects.find_one({"id": e["project_id"]}) if e else None
        out.append({"id": s["id"], "student": student.get("name") if student else "?",
                    "project": proj["title"] if proj else "?", "version": s["version"],
                    "status": s["status"], "github_url": s.get("github_url"),
                    "submitted_at": s.get("submitted_at")})
    return {"items": out}


@router.get("/submissions/{submission_id}")
async def admin_submission_detail(submission_id: str, admin: dict = Depends(get_current_admin)):
    s = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    e = await db.enrollments.find_one({"id": s["enrollment_id"]})
    student = await db.users.find_one({"_id": ObjectId(s["student_id"])})
    proj = await db.projects.find_one({"id": e["project_id"]}) if e else None
    history = await db.submissions.find({"enrollment_id": s["enrollment_id"]}, {"_id": 0}).sort("version", 1).to_list(100)
    prog = await compute_progress(e) if e else {"percent": 0}
    return {"submission": s, "history": history,
            "student": {"name": student.get("name"), "email": student.get("email")} if student else {},
            "project": proj["title"] if proj else "?", "project_version": e["project_version"] if e else None,
            "progress": prog, "enrollment_id": s["enrollment_id"]}


async def _approve_all_tasks(enrollment_id: str):
    await db.task_progress.update_many({"enrollment_id": enrollment_id},
                                       {"$set": {"admin_approved": True, "status": "approved",
                                                 "student_completed": True, "updated_at": now_iso()}})


@router.post("/submissions/{submission_id}/approve")
async def approve_submission(submission_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    s = await db.submissions.find_one({"id": submission_id})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    e = await db.enrollments.find_one({"id": s["enrollment_id"]})
    await db.submissions.update_one({"id": submission_id}, {"$set": {
        "status": "approved", "reviewed_at": now_iso(), "reviewed_by": admin["email"]}})
    await _approve_all_tasks(e["id"])
    await db.enrollments.update_one({"id": e["id"]}, {"$set": {"status": "approved"}})
    await audit(admin, "submission_approval", "submission", submission_id, request)
    fresh = await db.enrollments.find_one({"id": e["id"]})
    try:
        cert = await issue_certificate(fresh, admin, force=True)
        await audit(admin, "certificate_issue", "certificate", cert["id"], request)
    except Exception as ex:
        from .core import logger
        logger.error(f"Certificate issuance failed for enrollment {e['id']}: {ex}")
    student = await db.users.find_one({"_id": ObjectId(s["student_id"])})
    await notify(s["student_id"], "submission_approved", "Submission approved",
                 "Congratulations! Your submission was approved.", f"/workspace/{e['id']}")
    if student:
        await send_email_safe(student["email"], "Your submission was approved",
                              email_template("Submission approved",
                                             ["Great work! Your submission has been approved and your certificate is being issued."],
                                             "View Workspace", f"{FRONTEND_URL}/workspace/{e['id']}"))
    return {"status": "approved"}


@router.post("/submissions/{submission_id}/request-changes")
async def request_changes(submission_id: str, payload: ReviewIn, request: Request,
                          admin: dict = Depends(get_current_admin)):
    if not payload.feedback and not payload.required_changes:
        raise HTTPException(status_code=400, detail="Feedback is required to request changes")
    s = await db.submissions.find_one({"id": submission_id})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    e = await db.enrollments.find_one({"id": s["enrollment_id"]})
    notes = payload.feedback or payload.required_changes
    await db.submissions.update_one({"id": submission_id}, {"$set": {
        "status": "revision_required", "evaluator_notes": notes,
        "required_changes": payload.required_changes, "priority": payload.priority,
        "reviewed_at": now_iso(), "reviewed_by": admin["email"]}})
    await db.enrollments.update_one({"id": e["id"]}, {"$set": {"status": "revision_required"}})
    await audit(admin, "revision_request", "submission", submission_id, request)
    student = await db.users.find_one({"_id": ObjectId(s["student_id"])})
    await notify(s["student_id"], "revision_requested", "Revision requested",
                 notes[:120], f"/workspace/{e['id']}")
    if student:
        await send_email_safe(student["email"], "Revision requested on your submission",
                              email_template("Revision requested",
                                             ["A reviewer has requested some changes to your submission.",
                                              f"Feedback: {notes}"],
                                             "Update Submission", f"{FRONTEND_URL}/workspace/{e['id']}"))
    return {"status": "revision_required"}


@router.post("/submissions/{submission_id}/reject")
async def reject_submission(submission_id: str, payload: ReviewIn, request: Request,
                            admin: dict = Depends(get_current_admin)):
    if not payload.feedback:
        raise HTTPException(status_code=400, detail="Feedback is required to reject")
    s = await db.submissions.find_one({"id": submission_id})
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    e = await db.enrollments.find_one({"id": s["enrollment_id"]})
    await db.submissions.update_one({"id": submission_id}, {"$set": {
        "status": "rejected", "evaluator_notes": payload.feedback,
        "reviewed_at": now_iso(), "reviewed_by": admin["email"]}})
    await db.enrollments.update_one({"id": e["id"]}, {"$set": {"status": "revision_required"}})
    await audit(admin, "revision_request", "submission", submission_id, request, {"rejected": True})
    await notify(s["student_id"], "revision_requested", "Submission needs rework",
                 payload.feedback[:120], f"/workspace/{e['id']}")
    return {"status": "rejected"}


# ---------------- Questions ----------------
@router.get("/questions")
async def admin_questions(status: str = None, admin: dict = Depends(get_current_admin)):
    q = {}
    if status and status != "All":
        q["status"] = status
    items = await db.questions.find(q, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    for it in items:
        student = await db.users.find_one({"_id": ObjectId(it["student_id"])})
        it["student_name"] = student.get("name") if student else "?"
    return {"items": items}


@router.post("/questions/{question_id}/answer")
async def answer_question(question_id: str, payload: AnswerIn, admin: dict = Depends(get_current_admin)):
    q = await db.questions.find_one({"id": question_id})
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.questions.update_one({"id": question_id}, {"$set": {
        "answer": payload.answer, "admin_id": admin["id"], "answered_at": now_iso(),
        "status": "answered"}})
    await notify(q["student_id"], "question_answered", "Your question was answered",
                 q["subject"], f"/workspace/{q['enrollment_id']}")
    return {"status": "answered"}


# ---------------- Certificates ----------------
@router.get("/certificates")
async def admin_certificates(search: str = None, admin: dict = Depends(get_current_admin)):
    q = {}
    if search:
        q["$or"] = [{"certificate_id": {"$regex": search, "$options": "i"}},
                    {"student_name": {"$regex": search, "$options": "i"}},
                    {"project_title": {"$regex": search, "$options": "i"}}]
    items = await db.certificates.find(q, {"_id": 0}).sort("issued_at", -1).limit(500).to_list(500)
    return {"items": items}


@router.post("/certificates/{cert_id}/revoke")
async def revoke_certificate(cert_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    c = await db.certificates.find_one({"id": cert_id})
    if not c:
        raise HTTPException(status_code=404, detail="Certificate not found")
    await db.certificates.update_one({"id": cert_id}, {"$set": {"status": "revoked"}})
    await db.evidence.update_one({"enrollment_id": c["enrollment_id"]}, {"$set": {"is_public": False}})
    await audit(admin, "certificate_revoke", "certificate", cert_id, request)
    return {"status": "revoked"}


@router.post("/certificates/{cert_id}/reissue")
async def reissue_certificate(cert_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    c = await db.certificates.find_one({"id": cert_id})
    if not c:
        raise HTTPException(status_code=404, detail="Certificate not found")
    await db.certificates.update_one({"id": cert_id}, {"$set": {"status": "issued"}})
    await audit(admin, "certificate_issue", "certificate", cert_id, request, {"reissue": True})
    return {"status": "issued"}


# ---------------- Audit ----------------
@router.get("/audit-logs")
async def audit_logs(admin: dict = Depends(get_current_admin)):
    items = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(200).to_list(200)
    return {"items": items}
