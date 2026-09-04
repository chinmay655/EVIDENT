"""Business services shared across student/admin routes."""
import secrets
from datetime import datetime, timezone
from .core import (db, gen_id, now_iso, save_file, notify, send_email_safe, email_template,
                   FRONTEND_URL)
from .certificates import generate_certificate_pdf


async def get_version_data(enrollment: dict) -> dict:
    v = await db.project_versions.find_one(
        {"project_id": enrollment["project_id"], "version": enrollment["project_version"]})
    return v["data"] if v else {}


async def compute_progress(enrollment: dict) -> dict:
    data = await get_version_data(enrollment)
    tasks = data.get("tasks", [])
    required = [t for t in tasks if t.get("required", True)]
    progresses = await db.task_progress.find({"enrollment_id": enrollment["id"]}).to_list(500)
    pmap = {p["task_id"]: p for p in progresses}
    done = 0
    for t in required:
        p = pmap.get(t["id"])
        if p and p.get("admin_approved"):
            done += 1
    total = len(required)
    pct = round((done / total) * 100) if total else 0
    student_done = sum(1 for t in tasks if pmap.get(t["id"], {}).get("student_completed"))
    student_percent = round((student_done / len(tasks)) * 100) if tasks else 0
    return {"required_total": total, "required_approved": done, "percent": pct,
            "student_percent": student_percent,
            "task_total": len(tasks), "student_completed": student_done}


async def check_certificate_eligibility(enrollment: dict) -> tuple[bool, str]:
    if enrollment.get("payment_status") != "verified":
        return False, "Payment not verified"
    if enrollment.get("status") == "cancelled":
        return False, "Enrollment cancelled"
    prog = await compute_progress(enrollment)
    if prog["required_total"] > 0 and prog["required_approved"] < prog["required_total"]:
        return False, "Not all required tasks are approved"
    sub = await db.submissions.find_one(
        {"enrollment_id": enrollment["id"], "status": "approved"})
    if not sub:
        return False, "No approved submission"
    return True, "Eligible"


async def issue_certificate(enrollment: dict, actor: dict | None = None, force: bool = False) -> dict:
    existing = await db.certificates.find_one(
        {"enrollment_id": enrollment["id"], "status": {"$ne": "revoked"}})
    if existing:
        return existing
    if not force:
        ok, reason = await check_certificate_eligibility(enrollment)
        if not ok:
            raise ValueError(reason)
    from bson import ObjectId
    student = await db.users.find_one({"_id": ObjectId(enrollment["student_id"])})
    data = await get_version_data(enrollment)
    project = await db.projects.find_one({"id": enrollment["project_id"]})
    year = datetime.now(timezone.utc).year
    certificate_id = f"EVD-{year}-{secrets.token_hex(3).upper()}"
    while await db.certificates.find_one({"certificate_id": certificate_id}):
        certificate_id = f"EVD-{year}-{secrets.token_hex(3).upper()}"
    verification_id = secrets.token_urlsafe(16)
    completion_date = datetime.now(timezone.utc).strftime("%d %B %Y")
    skills = data.get("skills", []) or (project.get("skills", []) if project else [])
    student_name = student.get("name", "Student")
    project_title = data.get("title") or (project.get("title") if project else "Project")
    category = data.get("category") or (project.get("category") if project else "")
    verification_url = f"{FRONTEND_URL}/verify/{verification_id}"

    pdf_bytes = generate_certificate_pdf(
        student_name=student_name, project_title=project_title, category=category,
        skills=skills, completion_date=completion_date, certificate_id=certificate_id,
        verification_url=verification_url)
    file_rec = await save_file(enrollment["student_id"], "certificate",
                               f"{certificate_id}.pdf", pdf_bytes, "application/pdf", is_public=False)
    cert = {
        "id": gen_id(), "enrollment_id": enrollment["id"], "student_id": enrollment["student_id"],
        "project_id": enrollment["project_id"], "certificate_id": certificate_id,
        "verification_id": verification_id, "student_name": student_name,
        "project_title": project_title, "category": category, "skills": skills,
        "completion_date": completion_date, "status": "issued",
        "pdf_file_id": file_rec["id"], "issued_at": now_iso(),
    }
    await db.certificates.insert_one(dict(cert))
    await db.enrollments.update_one({"id": enrollment["id"]},
                                    {"$set": {"status": "completed", "completion_date": now_iso()}})
    await _ensure_evidence(enrollment, data, project, verification_id)
    await notify(enrollment["student_id"], "certificate_issued", "Certificate issued",
                 f"Your certificate for {project_title} is ready to download.",
                 f"/workspace/{enrollment['id']}")
    if student.get("email"):
        await send_email_safe(student["email"], "Your EVIDENT certificate is ready",
                              email_template("Certificate issued",
                                             [f"Congratulations {student_name}!",
                                              f"You completed <strong>{project_title}</strong> and your verifiable certificate is ready."],
                                             "View Certificate", f"{FRONTEND_URL}/workspace/{enrollment['id']}"))
    return cert


async def _ensure_evidence(enrollment: dict, data: dict, project: dict, verification_id: str):
    existing = await db.evidence.find_one({"enrollment_id": enrollment["id"]})
    sub = await db.submissions.find_one({"enrollment_id": enrollment["id"], "status": "approved"})
    prog = await compute_progress(enrollment)
    tasks = [t["title"] for t in sorted(data.get("tasks", []), key=lambda x: x.get("order", 0))]
    payload = {
        "project_title": data.get("title"), "category": data.get("category"),
        "technologies": data.get("technologies", []), "skills": data.get("skills", []),
        "what_built": data.get("what_student_will_build", ""),
        "completed_tasks": tasks, "verification_id": verification_id,
        "github_url": sub.get("github_url") if sub else None,
        "deployed_url": sub.get("deployed_url") if sub else None,
        "description": sub.get("description") if sub else "",
        "screenshots": sub.get("screenshots", []) if sub else [],
        "completion_date": datetime.now(timezone.utc).strftime("%d %B %Y"),
    }
    if existing:
        await db.evidence.update_one({"enrollment_id": enrollment["id"]}, {"$set": payload})
    else:
        from bson import ObjectId
        student = await db.users.find_one({"_id": ObjectId(enrollment["student_id"])})
        await db.evidence.insert_one({
            "public_id": secrets.token_urlsafe(10), "enrollment_id": enrollment["id"],
            "student_id": enrollment["student_id"], "student_name": student.get("name"),
            "is_public": False, "created_at": now_iso(), **payload,
        })
