"""Student routes: profile, files, enrollments, payments, workspace, submissions, questions, notifications, certificates."""
import os
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Response, Query

from .core import (db, get_current_user, gen_id, now_iso, save_file, notify, audit,
                   send_email_safe, email_template, FRONTEND_URL, PAYMENT_SANDBOX, get_object)
from .models import (ProfileUpdate, EnrollIn, CreateOrderIn, VerifyPaymentIn, TaskProgressIn,
                     SubmissionIn, QuestionIn, EvidenceVisibilityIn)
from .services import compute_progress, get_version_data, issue_certificate
from .routes_public import public_project_card

router = APIRouter(tags=["student"])

MAX_FILE_MB = int(os.environ.get("MAX_FILE_MB", "15"))
ALLOWED = {
    "resume": {"pdf": "application/pdf",
               "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    "image": {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"},
}


def _sanitize(name: str) -> str:
    name = os.path.basename(name or "file")
    return "".join(c for c in name if c.isalnum() or c in "._- ").strip() or "file"


# ---------------- Profile ----------------
@router.patch("/profile")
async def update_profile(payload: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    mapping = {"full_name": "name"}
    doc = {mapping.get(k, k): v for k, v in updates.items()}
    if doc:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": doc})
    fresh = await db.users.find_one({"_id": ObjectId(user["id"])})
    fresh["id"] = str(fresh.pop("_id"))
    fresh.pop("password_hash", None)
    return fresh


@router.post("/files/upload")
async def upload_file(request: Request, file: UploadFile = File(...),
                      category: str = Query("resume"), user: dict = Depends(get_current_user)):
    if category not in ("resume", "image"):
        category = "image"
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    allowed = ALLOWED[category]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed)}")
    data = await file.read()
    if len(data) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_FILE_MB}MB")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    ctype = allowed[ext]
    rec = await save_file(user["id"], category, _sanitize(file.filename), data, ctype,
                          is_public=(category == "image"))
    return {"file_id": rec["id"], "filename": rec["original_filename"],
            "url": f"/api/files/{rec['id']}", "size": rec["size"]}


# ---------------- Enrollment ----------------
@router.post("/enrollments")
async def create_enrollment(payload: EnrollIn, request: Request, user: dict = Depends(get_current_user)):
    if not payload.accept_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms to enroll")
    project = await db.projects.find_one({"id": payload.project_id, "status": "published"})
    if not project:
        raise HTTPException(status_code=404, detail="Project not available")
    resume = await db.files.find_one({"id": payload.resume_file_id, "owner_id": user["id"],
                                      "category": "resume", "is_deleted": False})
    if not resume:
        raise HTTPException(status_code=400, detail="A valid resume upload is required before enrollment")
    existing = await db.enrollments.find_one({
        "student_id": user["id"], "project_id": payload.project_id,
        "status": {"$nin": ["cancelled", "expired"]}})
    if existing:
        if existing.get("payment_status") == "verified":
            raise HTTPException(status_code=400, detail="You are already enrolled in this project")
        # reuse pending enrollment
        await db.enrollments.update_one({"id": existing["id"]},
                                        {"$set": {"resume_file_id": payload.resume_file_id}})
        return {"enrollment_id": existing["id"], "status": existing["status"],
                "payment_status": existing["payment_status"], "price": existing["price"]}
    version = project.get("current_version", 1)
    enr = {
        "id": gen_id(), "student_id": user["id"], "project_id": payload.project_id,
        "project_version": version, "resume_file_id": payload.resume_file_id,
        "payment_id": None, "payment_status": "pending", "status": "pending_payment",
        "price": project["price"], "currency": project.get("currency", "INR"),
        "duration_days": project.get("duration_days", 28),
        "start_date": None, "due_date": None, "completion_date": None,
        "deadline_history": [], "created_at": now_iso(),
    }
    await db.enrollments.insert_one(dict(enr))
    await audit(user, "enrollment_created", "enrollment", enr["id"], request,
                {"project_id": payload.project_id})
    return {"enrollment_id": enr["id"], "status": enr["status"],
            "payment_status": "pending", "price": enr["price"]}


async def _enrollment_owned(enrollment_id: str, user: dict) -> dict:
    enr = await db.enrollments.find_one({"id": enrollment_id})
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enr["student_id"] != user["id"] and user["role"] not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="You do not have access to this enrollment")
    return enr


@router.get("/enrollments")
async def my_enrollments(user: dict = Depends(get_current_user)):
    enrs = await db.enrollments.find({"student_id": user["id"]}).sort("created_at", -1).to_list(200)
    out = []
    for e in enrs:
        project = await db.projects.find_one({"id": e["project_id"]}, {"_id": 0})
        prog = await compute_progress(e) if e.get("payment_status") == "verified" else {"student_percent": 0}
        out.append({
            "id": e["id"], "status": e["status"], "payment_status": e["payment_status"],
            "project": public_project_card(project) if project else {"title": "Project"},
            "progress": prog.get("student_percent", 0), "due_date": e.get("due_date"),
            "created_at": e["created_at"],
        })
    return {"items": out}


@router.get("/enrollments/{enrollment_id}")
async def enrollment_detail(enrollment_id: str, user: dict = Depends(get_current_user)):
    e = await _enrollment_owned(enrollment_id, user)
    project = await db.projects.find_one({"id": e["project_id"]}, {"_id": 0})
    return {"id": e["id"], "status": e["status"], "payment_status": e["payment_status"],
            "price": e["price"], "currency": e.get("currency", "INR"),
            "project": public_project_card(project) if project else {}}


# ---------------- Payments ----------------
def _razorpay_client():
    kid = os.environ.get("RAZORPAY_KEY_ID")
    ksec = os.environ.get("RAZORPAY_KEY_SECRET")
    if kid and ksec:
        import razorpay
        return razorpay.Client(auth=(kid, ksec)), kid
    return None, None


@router.post("/payments/create-order")
async def create_order(payload: CreateOrderIn, user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(payload.enrollment_id, user)
    if enr["payment_status"] == "verified":
        raise HTTPException(status_code=400, detail="This enrollment is already paid")
    # SERVER-CONTROLLED price from DB
    project = await db.projects.find_one({"id": enr["project_id"]})
    amount = int(enr["price"]) * 100  # paise; price snapshot at enrollment
    currency = enr.get("currency", "INR")
    client, kid = _razorpay_client()
    payment_id = gen_id()
    if client:
        order = client.order.create({"amount": amount, "currency": currency,
                                     "payment_capture": 1, "receipt": payment_id[:40]})
        order_id = order["id"]
        sandbox = False
    else:
        order_id = f"order_sandbox_{gen_id()[:12]}"
        sandbox = True
    await db.payments.insert_one({
        "id": payment_id, "enrollment_id": enr["id"], "student_id": user["id"],
        "razorpay_order_id": order_id, "razorpay_payment_id": None,
        "amount": amount, "currency": currency, "status": "created",
        "signature_verified": False, "sandbox": sandbox, "created_at": now_iso(),
    })
    return {"order_id": order_id, "amount": amount, "currency": currency,
            "key_id": kid, "sandbox": sandbox, "payment_ref": payment_id,
            "name": project["title"] if project else "EVIDENT", "prefill_name": user.get("name"),
            "prefill_email": user.get("email")}


async def _activate(enr: dict, user_email: str, project_title: str):
    start = datetime.now(timezone.utc)
    due = start + timedelta(days=int(enr.get("duration_days", 28)))
    await db.enrollments.update_one({"id": enr["id"]}, {"$set": {
        "payment_status": "verified", "status": "active",
        "start_date": start.isoformat(), "due_date": due.isoformat()}})
    # init task progress
    data = await get_version_data(enr)
    for t in data.get("tasks", []):
        exists = await db.task_progress.find_one({"enrollment_id": enr["id"], "task_id": t["id"]})
        if not exists:
            await db.task_progress.insert_one({
                "id": gen_id(), "enrollment_id": enr["id"], "task_id": t["id"],
                "student_completed": False, "admin_approved": False,
                "status": "available", "updated_at": now_iso()})
    await notify(enr["student_id"], "enrollment_activated", "Enrollment activated",
                 f"Your workspace for {project_title} is now unlocked.", f"/workspace/{enr['id']}")
    await send_email_safe(user_email, "Payment confirmed — workspace unlocked",
                          email_template("You're enrolled!",
                                         [f"Your payment is confirmed and your workspace for <strong>{project_title}</strong> is unlocked.",
                                          "Start with the project overview and first task."],
                                         "Open Workspace", f"{FRONTEND_URL}/workspace/{enr['id']}"))


@router.post("/payments/verify")
async def verify_payment(payload: VerifyPaymentIn, request: Request, user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(payload.enrollment_id, user)
    if enr["payment_status"] == "verified":
        return {"status": "already_verified"}
    payment = await db.payments.find_one({"enrollment_id": enr["id"]}, sort=[("created_at", -1)])
    if not payment:
        raise HTTPException(status_code=400, detail="No payment order found")
    if payment.get("signature_verified"):
        return {"status": "already_verified"}
    client, kid = _razorpay_client()
    if payment.get("sandbox") or not client:
        if not (PAYMENT_SANDBOX or payment.get("sandbox")):
            raise HTTPException(status_code=400, detail="Sandbox payments are disabled")
        await db.payments.update_one({"id": payment["id"]}, {"$set": {
            "status": "verified", "signature_verified": True,
            "razorpay_payment_id": payload.razorpay_payment_id or f"pay_sandbox_{gen_id()[:10]}"}})
    else:
        if not (payload.razorpay_order_id and payload.razorpay_payment_id and payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Missing payment verification parameters")
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature})
        except Exception:
            await db.payments.update_one({"id": payment["id"]}, {"$set": {"status": "failed"}})
            raise HTTPException(status_code=400, detail="Payment verification failed")
        await db.payments.update_one({"id": payment["id"]}, {"$set": {
            "status": "verified", "signature_verified": True,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id}})
    await db.enrollments.update_one({"id": enr["id"]}, {"$set": {"payment_id": payment["id"]}})
    fresh = await db.enrollments.find_one({"id": enr["id"]})
    project = await db.projects.find_one({"id": enr["project_id"]})
    await _activate(fresh, user.get("email"), project["title"] if project else "your project")
    await audit(user, "payment_verified", "payment", payment["id"], request,
                {"enrollment_id": enr["id"], "sandbox": payment.get("sandbox")})
    return {"status": "verified", "enrollment_id": enr["id"]}


# ---------------- Workspace ----------------
def _overdue(enr):
    if enr.get("due_date"):
        return datetime.fromisoformat(enr["due_date"]) < datetime.now(timezone.utc)
    return False


def _days_remaining(enr):
    if not enr.get("due_date"):
        return None
    delta = datetime.fromisoformat(enr["due_date"]) - datetime.now(timezone.utc)
    return delta.days


@router.get("/workspaces/{enrollment_id}")
async def workspace(enrollment_id: str, user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(enrollment_id, user)
    if enr["payment_status"] != "verified":
        raise HTTPException(status_code=403, detail="Complete payment to access this workspace")
    data = await get_version_data(enr)
    progresses = await db.task_progress.find({"enrollment_id": enr["id"]}).to_list(500)
    pmap = {p["task_id"]: p for p in progresses}
    tasks = []
    for t in sorted(data.get("tasks", []), key=lambda x: x.get("order", 0)):
        p = pmap.get(t["id"], {})
        tasks.append({**t, "student_completed": p.get("student_completed", False),
                      "admin_approved": p.get("admin_approved", False),
                      "task_status": p.get("status", "available")})
    resources = [{"id": r.get("id"), "title": r["title"], "description": r.get("description", ""),
                  "type": r.get("type"), "external_url": r.get("external_url"),
                  "file_id": r.get("file_id"), "order": r.get("order", 0)}
                 for r in sorted(data.get("resources", []), key=lambda x: x.get("order", 0))
                 if r.get("visibility") in ("public", "enrolled")]
    submissions = await db.submissions.find({"enrollment_id": enr["id"]}, {"_id": 0}).sort("version", 1).to_list(100)
    questions = await db.questions.find({"enrollment_id": enr["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    cert = await db.certificates.find_one({"enrollment_id": enr["id"]}, {"_id": 0})
    evidence = await db.evidence.find_one({"enrollment_id": enr["id"]}, {"_id": 0})
    project = await db.projects.find_one({"id": enr["project_id"]}, {"_id": 0})
    prog = await compute_progress(enr)
    return {
        "enrollment": {"id": enr["id"], "status": enr["status"], "start_date": enr.get("start_date"),
                       "due_date": enr.get("due_date"), "days_remaining": _days_remaining(enr),
                       "overdue": _overdue(enr), "project_version": enr["project_version"]},
        "project": {"title": data.get("title") or (project or {}).get("title"),
                    "category": data.get("category"),
                    "full_description": data.get("full_description", ""),
                    "what_student_will_build": data.get("what_student_will_build", ""),
                    "what_student_will_submit": data.get("what_student_will_submit", ""),
                    "submission_requirements": data.get("submission_requirements", []),
                    "evaluation_criteria": data.get("evaluation_criteria", [])},
        "tasks": tasks, "resources": resources, "submissions": submissions,
        "questions": questions, "certificate": cert, "evidence": evidence,
        "progress": prog,
    }


@router.patch("/tasks/{task_id}/progress")
async def update_task_progress(task_id: str, payload: TaskProgressIn,
                               enrollment_id: str = Query(...), user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(enrollment_id, user)
    if enr["payment_status"] != "verified":
        raise HTTPException(status_code=403, detail="Workspace locked")
    p = await db.task_progress.find_one({"enrollment_id": enr["id"], "task_id": task_id})
    if not p:
        raise HTTPException(status_code=404, detail="Task not found")
    status = "completed" if payload.student_completed else "in_progress"
    if p.get("admin_approved"):
        status = "approved"
    await db.task_progress.update_one({"enrollment_id": enr["id"], "task_id": task_id},
                                      {"$set": {"student_completed": payload.student_completed,
                                                "status": status, "updated_at": now_iso()}})
    prog = await compute_progress(enr)
    return {"status": "ok", "progress": prog}


# ---------------- Submissions ----------------
@router.post("/submissions")
async def create_submission(payload: SubmissionIn, enrollment_id: str = Query(...),
                            request: Request = None, user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(enrollment_id, user)
    if enr["payment_status"] != "verified":
        raise HTTPException(status_code=403, detail="Workspace locked")
    if enr["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Enrollment cancelled")
    if payload.submit and _overdue(enr) and not enr.get("allow_late"):
        raise HTTPException(status_code=400, detail="The deadline has passed. Contact admin for an extension.")
    if not payload.github_url.startswith(("http://", "https://")) or "github.com" not in payload.github_url:
        raise HTTPException(status_code=400, detail="Enter a valid GitHub repository URL")
    last = await db.submissions.find_one({"enrollment_id": enr["id"]}, sort=[("version", -1)])
    version = (last["version"] + 1) if last else 1
    sub = {
        "id": gen_id(), "enrollment_id": enr["id"], "student_id": user["id"],
        "version": version, "github_url": payload.github_url, "deployed_url": payload.deployed_url,
        "description": payload.description, "technologies": payload.technologies,
        "challenges": payload.challenges, "solution_summary": payload.solution_summary,
        "screenshots": payload.screenshots, "demo_video": payload.demo_video,
        "status": "submitted" if payload.submit else "draft",
        "evaluator_notes": None, "reviewed_at": None, "reviewed_by": None,
        "submitted_at": now_iso() if payload.submit else None, "created_at": now_iso(),
    }
    await db.submissions.insert_one(dict(sub))
    if payload.submit:
        await db.enrollments.update_one({"id": enr["id"]},
                                        {"$set": {"status": "under_review"}})
        admins = await db.users.find({"role": {"$in": ["admin", "super_admin"]}}).to_list(20)
        for a in admins:
            await notify(str(a["_id"]), "submission_received", "New submission",
                         f"A submission was received for review.", f"/admin/submissions/{sub['id']}")
        await audit(user, "submission", "submission", sub["id"], request, {"version": version})
    sub.pop("_id", None)
    return sub


@router.get("/submissions")
async def submission_history(enrollment_id: str = Query(...), user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(enrollment_id, user)
    subs = await db.submissions.find({"enrollment_id": enr["id"]}, {"_id": 0}).sort("version", 1).to_list(100)
    return {"items": subs}


# ---------------- Questions ----------------
@router.post("/questions")
async def ask_question(payload: QuestionIn, user: dict = Depends(get_current_user)):
    enr = await _enrollment_owned(payload.enrollment_id, user)
    q = {"id": gen_id(), "enrollment_id": enr["id"], "student_id": user["id"],
         "project_id": enr["project_id"], "subject": payload.subject, "message": payload.message,
         "status": "open", "answer": None, "admin_id": None, "answered_at": None,
         "created_at": now_iso()}
    await db.questions.insert_one(dict(q))
    admins = await db.users.find({"role": {"$in": ["admin", "super_admin"]}}).to_list(20)
    for a in admins:
        await notify(str(a["_id"]), "question", "New question", payload.subject, "/admin/questions")
    q.pop("_id", None)
    return q


@router.get("/questions")
async def my_questions(enrollment_id: str = Query(None), user: dict = Depends(get_current_user)):
    q = {"student_id": user["id"]}
    if enrollment_id:
        q["enrollment_id"] = enrollment_id
    items = await db.questions.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}


# ---------------- Notifications ----------------
@router.get("/notifications")
async def notifications(user: dict = Depends(get_current_user)):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread}


@router.patch("/notifications/{nid}/read")
async def mark_read(nid: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"status": "ok"}


@router.post("/notifications/read-all")
async def read_all(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"status": "ok"}


# ---------------- Certificates ----------------
@router.get("/certificates")
async def my_certificates(user: dict = Depends(get_current_user)):
    items = await db.certificates.find({"student_id": user["id"]}, {"_id": 0}).sort("issued_at", -1).to_list(100)
    return {"items": items}


@router.get("/certificates/{cert_id}/download")
async def download_certificate(cert_id: str, user: dict = Depends(get_current_user)):
    cert = await db.certificates.find_one({"id": cert_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if cert["student_id"] != user["id"] and user["role"] not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    if cert["status"] != "issued":
        raise HTTPException(status_code=400, detail="Certificate is not available")
    file_rec = await db.files.find_one({"id": cert["pdf_file_id"]})
    data, ctype = get_object(file_rec["storage_path"])
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{cert["certificate_id"]}.pdf"'})


# ---------------- Dashboard ----------------
@router.get("/dashboard")
async def student_dashboard(user: dict = Depends(get_current_user)):
    enrs = await db.enrollments.find({"student_id": user["id"]}).sort("created_at", -1).to_list(200)
    active, completed, revision = [], [], []
    for e in enrs:
        if e["payment_status"] != "verified":
            continue
        project = await db.projects.find_one({"id": e["project_id"]}, {"_id": 0})
        prog = await compute_progress(e)
        card = {"id": e["id"], "status": e["status"], "progress": prog.get("student_percent", 0),
                "due_date": e.get("due_date"),
                "project": public_project_card(project) if project else {"title": "Project"}}
        if e["status"] == "completed":
            completed.append(card)
        else:
            active.append(card)
            if e["status"] == "revision_required":
                revision.append(card)
    certs = await db.certificates.count_documents({"student_id": user["id"], "status": "issued"})
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    recommended = await db.projects.find({"status": "published"}, {"_id": 0}).sort("featured", -1).limit(3).to_list(3)
    return {
        "stats": {"active": len(active), "completed": len(completed),
                  "certificates": certs, "unread_notifications": unread},
        "active_projects": active, "completed_projects": completed,
        "revision_requests": revision,
        "recommended": [public_project_card(p) for p in recommended],
    }


# ---------------- Evidence ----------------
@router.get("/evidence/mine/list")
async def my_evidence(user: dict = Depends(get_current_user)):
    items = await db.evidence.find({"student_id": user["id"]}, {"_id": 0}).to_list(100)
    return {"items": items, "public_username": user.get("public_username")}


@router.patch("/evidence/{public_id}/visibility")
async def set_evidence_visibility(public_id: str, payload: EvidenceVisibilityIn,
                                  user: dict = Depends(get_current_user)):
    ev = await db.evidence.find_one({"public_id": public_id})
    if not ev or ev["student_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Evidence not found")
    await db.evidence.update_one({"public_id": public_id}, {"$set": {"is_public": payload.is_public}})
    return {"status": "ok", "is_public": payload.is_public}
