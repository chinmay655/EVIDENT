"""EVIDENT backend regression suite — auth, RBAC, security, payments, workspace,
submissions/review, certificates, verification, versioning, evidence."""
import io
import uuid

import requests

from conftest import (API, new_student, upload_resume, enroll, pay, enrolled_student)


# ---------------- Health & public catalog ----------------
class TestHealthAndCatalog:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=60)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_projects_list_and_shape(self, first_project):
        r = requests.get(f"{API}/projects", timeout=60)
        assert r.status_code == 200
        body = r.json()
        assert body["total"] >= 1
        p = body["items"][0]
        for k in ("id", "title", "slug", "price", "difficulty"):
            assert k in p, f"missing {k}"
        assert "_id" not in p

    def test_projects_search_filter(self):
        r = requests.get(f"{API}/projects", params={"search": "Business"}, timeout=60)
        assert r.status_code == 200
        items = r.json()["items"]
        assert items, "search for 'Business' returned nothing"
        assert any("business" in i["title"].lower() for i in items)

    def test_categories(self):
        r = requests.get(f"{API}/projects/categories", timeout=60)
        assert r.status_code == 200
        assert isinstance(r.json()["categories"], list)

    def test_project_detail_by_slug(self, first_project):
        r = requests.get(f"{API}/projects/{first_project['slug']}", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == first_project["slug"]
        assert d["task_count"] >= 1
        assert "_id" not in d

    def test_project_detail_404(self):
        r = requests.get(f"{API}/projects/no-such-project-slug-xyz", timeout=60)
        assert r.status_code == 404


# ---------------- Auth ----------------
class TestAuth:
    def test_register_me_logout(self):
        s, email = new_student()
        me = s.get(f"{API}/auth/me", timeout=60)
        assert me.status_code == 200
        data = me.json()
        assert data["email"] == email
        assert data["role"] == "student"
        assert "password_hash" not in data and "_id" not in data
        assert s.post(f"{API}/auth/logout", timeout=60).status_code == 200
        s.cookies.clear()
        assert s.get(f"{API}/auth/me", timeout=60).status_code == 401

    def test_login_sets_httponly_secure_cookies(self, admin_credentials):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=admin_credentials, timeout=60)
        assert r.status_code == 200
        assert r.json()["role"] == "super_admin"
        raw = "; ".join(r.headers.get_all("Set-Cookie")) if hasattr(r.headers, "get_all") else str(r.headers)
        assert "access_token" in raw
        assert "HttpOnly" in raw
        assert "Secure" in raw

    def test_login_invalid_credentials(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": f"nobody_{uuid.uuid4().hex[:6]}@example.com", "password": "Wrong123!"},
                          timeout=60)
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_duplicate_registration_rejected(self):
        s, email = new_student()
        r = requests.post(f"{API}/auth/register", json={
            "full_name": "TEST Dup", "email": email, "password": "Passw0rd!",
            "confirm_password": "Passw0rd!"}, timeout=60)
        assert r.status_code == 400

    def test_weak_password_rejected(self):
        r = requests.post(f"{API}/auth/register", json={
            "full_name": "TEST Weak", "email": f"test_weak_{uuid.uuid4().hex[:8]}@example.com",
            "password": "short", "confirm_password": "short"}, timeout=60)
        assert r.status_code in (400, 422)

    def test_password_mismatch_rejected(self):
        r = requests.post(f"{API}/auth/register", json={
            "full_name": "TEST Mismatch", "email": f"test_mm_{uuid.uuid4().hex[:8]}@example.com",
            "password": "Passw0rd!", "confirm_password": "Passw0rd?"}, timeout=60)
        assert r.status_code in (400, 422)

    def test_brute_force_lockout_after_5_failures(self):
        email = f"test_lock_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{API}/auth/register", json={
            "full_name": "TEST Lock", "email": email, "password": "Passw0rd!",
            "confirm_password": "Passw0rd!"}, timeout=60)
        codes = []
        for _ in range(6):
            codes.append(requests.post(f"{API}/auth/login",
                                       json={"email": email, "password": "Bad0000!"}, timeout=60).status_code)
        assert 429 in codes, f"no lockout observed, codes={codes}"

    def test_forgot_password_no_enumeration(self):
        r1 = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody_xyz@example.com"}, timeout=60)
        assert r1.status_code == 200 and r1.json()["status"] == "ok"

    def test_me_requires_auth(self):
        assert requests.get(f"{API}/auth/me", timeout=60).status_code == 401


# ---------------- RBAC ----------------
class TestRBAC:
    def test_student_forbidden_on_admin_dashboard(self, student):
        s, _ = student
        assert s.get(f"{API}/admin/dashboard", timeout=60).status_code == 403

    def test_anonymous_unauthorized_on_admin(self):
        assert requests.get(f"{API}/admin/dashboard", timeout=60).status_code == 401

    def test_admin_dashboard_ok(self, admin_client):
        r = admin_client.get(f"{API}/admin/dashboard", timeout=60)
        assert r.status_code == 200
        body = r.json()
        stats = body["stats"]
        for k in ("total_students", "active_enrollments", "revenue", "certificates_issued", "projects"):
            assert k in stats, f"missing stat {k}: {stats}"
        assert isinstance(body["enrollments_series"], list)
        assert isinstance(body["revenue_series"], list)

    def test_student_forbidden_creating_project(self, student):
        s, _ = student
        r = s.post(f"{API}/admin/projects", json={"title": "TEST hack", "price": 1}, timeout=60)
        assert r.status_code in (403, 422)


# ---------------- Enrollment & payment security ----------------
class TestEnrollmentSecurity:
    def test_resume_required(self, student, first_project):
        s, _ = student
        r = s.post(f"{API}/enrollments", json={
            "project_id": first_project["id"], "resume_file_id": "bogus", "accept_terms": True}, timeout=60)
        assert r.status_code == 400

    def test_terms_required(self, student, first_project):
        s, _ = student
        fid = upload_resume(s)
        r = s.post(f"{API}/enrollments", json={
            "project_id": first_project["id"], "resume_file_id": fid, "accept_terms": False}, timeout=60)
        assert r.status_code in (400, 422)

    def test_invalid_resume_filetype_rejected(self, student):
        s, _ = student
        files = {"file": ("TEST_bad.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
        r = s.post(f"{API}/files/upload?category=resume", files=files, timeout=60)
        assert r.status_code == 400

    def test_workspace_locked_before_payment(self, student, first_project):
        s, _ = student
        eid, _ = enroll(s, first_project)
        r = s.get(f"{API}/workspaces/{eid}", timeout=60)
        assert r.status_code == 403

    def test_price_is_server_controlled(self, first_project):
        s, _ = new_student()
        eid, _ = enroll(s, first_project)
        order = s.post(f"{API}/payments/create-order",
                       json={"enrollment_id": eid, "amount": 1, "price": 1}, timeout=60)
        assert order.status_code == 200
        body = order.json()
        assert body["amount"] == int(first_project["price"]) * 100, body
        assert body["sandbox"] is True

    def test_workspace_unlocks_after_sandbox_payment(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.get(f"{API}/workspaces/{eid}", timeout=60)
        assert r.status_code == 200
        ws = r.json()
        assert ws["enrollment"]["status"] == "active"
        assert len(ws["tasks"]) >= 1
        assert ws["progress"]["percent"] == 0

    def test_cross_student_workspace_denied(self, first_project):
        s1, _, eid, fid = enrolled_student(first_project)
        s2, _ = new_student()
        assert s2.get(f"{API}/workspaces/{eid}", timeout=60).status_code == 403
        assert s2.get(f"{API}/enrollments/{eid}", timeout=60).status_code == 403

    def test_cross_student_resume_download_denied(self, first_project):
        s1, _, _, fid = enrolled_student(first_project)
        s2, _ = new_student()
        assert s2.get(f"{API}/files/{fid}", timeout=60).status_code in (401, 403)
        assert requests.get(f"{API}/files/{fid}", timeout=60).status_code in (401, 403)
        assert s1.get(f"{API}/files/{fid}", timeout=60).status_code == 200

    def test_duplicate_paid_enrollment_rejected(self, first_project):
        s, _, eid, fid = enrolled_student(first_project)
        r = s.post(f"{API}/enrollments", json={
            "project_id": first_project["id"], "resume_file_id": fid, "accept_terms": True}, timeout=60)
        assert r.status_code == 400

    def test_payment_verify_idempotent(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.post(f"{API}/payments/verify", json={"enrollment_id": eid, "sandbox": True}, timeout=60)
        assert r.status_code == 200
        assert r.json()["status"] == "already_verified"


# ---------------- Workspace features ----------------
class TestWorkspace:
    def test_task_progress_updates_percent(self, first_project):
        """percent is admin-approval based; student_completed counter must increment."""
        s, _, eid, _ = enrolled_student(first_project)
        ws = s.get(f"{API}/workspaces/{eid}", timeout=60).json()
        task_id = ws["tasks"][0]["id"]
        r = s.patch(f"{API}/tasks/{task_id}/progress?enrollment_id={eid}",
                    json={"student_completed": True}, timeout=60)
        assert r.status_code == 200
        prog = r.json()["progress"]
        assert prog["student_completed"] >= 1, prog
        ws2 = s.get(f"{API}/workspaces/{eid}", timeout=60).json()
        done = [t for t in ws2["tasks"] if t["id"] == task_id][0]
        assert done["student_completed"] is True
        assert done["task_status"] == "completed"

    def test_task_progress_cross_student_denied(self, first_project):
        s1, _, eid, _ = enrolled_student(first_project)
        ws = s1.get(f"{API}/workspaces/{eid}", timeout=60).json()
        tid = ws["tasks"][0]["id"]
        s2, _ = new_student()
        r = s2.patch(f"{API}/tasks/{tid}/progress?enrollment_id={eid}",
                     json={"student_completed": True}, timeout=60)
        assert r.status_code == 403

    def test_invalid_github_url_rejected(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.post(f"{API}/submissions?enrollment_id={eid}",
                   json={"github_url": "https://gitlab.com/a/b", "submit": True}, timeout=60)
        assert r.status_code == 400

    def test_ask_question_and_admin_answer(self, first_project, admin_client):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.post(f"{API}/questions", json={
            "enrollment_id": eid, "subject": "TEST question", "message": "How do I start?"}, timeout=60)
        assert r.status_code == 200
        qid = r.json()["id"]
        assert r.json()["status"] == "open"
        ans = admin_client.post(f"{API}/admin/questions/{qid}/answer",
                                json={"answer": "TEST answer from admin"}, timeout=60)
        assert ans.status_code == 200
        items = s.get(f"{API}/questions", params={"enrollment_id": eid}, timeout=60).json()["items"]
        me = [q for q in items if q["id"] == qid][0]
        assert me["status"] == "answered"
        assert me["answer"] == "TEST answer from admin"

    def test_notifications_after_activation(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.get(f"{API}/notifications", timeout=60)
        assert r.status_code == 200
        assert r.json()["unread"] >= 1
        assert s.post(f"{API}/notifications/read-all", timeout=60).status_code == 200
        assert s.get(f"{API}/notifications", timeout=60).json()["unread"] == 0

    def test_student_dashboard(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        r = s.get(f"{API}/dashboard", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["stats"]["active"] >= 1
        assert any(c["id"] == eid for c in d["active_projects"])


# ---------------- Review, certificate & verification ----------------
class TestReviewCertificateFlow:
    def _submit(self, s, eid):
        r = s.post(f"{API}/submissions?enrollment_id={eid}",
                   json={"github_url": "https://github.com/testorg/testrepo", "submit": True,
                         "description": "TEST submission"}, timeout=60)
        assert r.status_code == 200, r.text
        return r.json()

    def test_no_certificate_before_approval(self, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        self._submit(s, eid)
        certs = s.get(f"{API}/certificates", timeout=60).json()["items"]
        assert certs == [], f"certificate issued before approval: {certs}"

    def test_full_flow_approve_certificate_verify_revoke(self, first_project, admin_client):
        s, email, eid, _ = enrolled_student(first_project)
        sub = self._submit(s, eid)
        assert sub["version"] == 1 and sub["status"] == "submitted"

        detail = admin_client.get(f"{API}/admin/submissions/{sub['id']}", timeout=60)
        assert detail.status_code == 200

        ap = admin_client.post(f"{API}/admin/submissions/{sub['id']}/approve", timeout=120)
        assert ap.status_code == 200 and ap.json()["status"] == "approved"

        certs = s.get(f"{API}/certificates", timeout=60).json()["items"]
        assert len(certs) == 1, f"expected 1 certificate, got {certs}"
        cert = certs[0]
        assert cert["status"] == "issued"
        assert cert["student_name"]
        assert cert["pdf_file_id"], "certificate PDF not generated"

        pdf = s.get(f"{API}/certificates/{cert['id']}/download", timeout=120)
        assert pdf.status_code == 200
        assert pdf.content[:4] == b"%PDF", "downloaded certificate is not a PDF"

        v = requests.get(f"{API}/verify/{cert['verification_id']}", timeout=60).json()
        assert v["valid"] is True and v["status"] == "issued"
        assert v["project_title"]

        # another student cannot download this certificate
        s2, _ = new_student()
        assert s2.get(f"{API}/certificates/{cert['id']}/download", timeout=60).status_code == 403

        # revoke -> invalid
        rv = admin_client.post(f"{API}/admin/certificates/{cert['id']}/revoke", timeout=60)
        assert rv.status_code == 200
        v2 = requests.get(f"{API}/verify/{cert['verification_id']}", timeout=60).json()
        assert v2["valid"] is False and v2["status"] == "revoked"

        # reissue restores validity
        assert admin_client.post(f"{API}/admin/certificates/{cert['id']}/reissue", timeout=60).status_code == 200
        v3 = requests.get(f"{API}/verify/{cert['verification_id']}", timeout=60).json()
        assert v3["valid"] is True

    def test_verify_unknown_id(self):
        r = requests.get(f"{API}/verify/nonexistent-verification-id", timeout=60)
        assert r.status_code == 200
        assert r.json() == {"valid": False, "status": "not_found",
                            "message": "No certificate found for this ID"}

    def test_request_changes_requires_feedback_and_allows_resubmit(self, first_project, admin_client):
        s, _, eid, _ = enrolled_student(first_project)
        sub = self._submit(s, eid)
        bad = admin_client.post(f"{API}/admin/submissions/{sub['id']}/request-changes",
                                json={}, timeout=60)
        assert bad.status_code == 400, f"expected 400 without feedback, got {bad.status_code}"

        ok = admin_client.post(f"{API}/admin/submissions/{sub['id']}/request-changes",
                               json={"feedback": "TEST please add README"}, timeout=60)
        assert ok.status_code == 200
        enr = s.get(f"{API}/enrollments/{eid}", timeout=60).json()
        assert enr["status"] == "revision_required"

        sub2 = self._submit(s, eid)
        assert sub2["version"] == 2
        hist = s.get(f"{API}/submissions", params={"enrollment_id": eid}, timeout=60).json()["items"]
        assert len(hist) == 2, "older submission versions not retained"
        assert hist[0]["status"] == "revision_required"
        assert hist[0]["evaluator_notes"] == "TEST please add README"

    def test_evidence_generated_and_public_toggle(self, first_project, admin_client):
        s, _, eid, _ = enrolled_student(first_project)
        sub = self._submit(s, eid)
        assert admin_client.post(f"{API}/admin/submissions/{sub['id']}/approve", timeout=120).status_code == 200
        ev = s.get(f"{API}/evidence/mine/list", timeout=60).json()
        assert ev["items"], "no evidence record created after approval"
        pid = ev["items"][0]["public_id"]
        # not public by default -> 404
        assert requests.get(f"{API}/evidence/{pid}", timeout=60).status_code == 404
        r = s.patch(f"{API}/evidence/{pid}/visibility", json={"is_public": True}, timeout=60)
        assert r.status_code == 200 and r.json()["is_public"] is True
        pub = requests.get(f"{API}/evidence/{pid}", timeout=60)
        assert pub.status_code == 200
        assert "_id" not in pub.json()
        # public portfolio
        me = s.get(f"{API}/auth/me", timeout=60).json()
        port = requests.get(f"{API}/students/{me['public_username']}", timeout=60)
        assert port.status_code == 200
        assert port.json()["certificates"], "portfolio shows no certificates"
        # other student cannot toggle visibility
        s2, _ = new_student()
        assert s2.patch(f"{API}/evidence/{pid}/visibility", json={"is_public": False}, timeout=60).status_code == 404


# ---------------- Admin project management & versioning ----------------
class TestAdminProjectsAndVersioning:
    def _project_payload(self, title):
        return {
            "title": title, "short_description": "TEST short", "full_description": "TEST full",
            "category": "Web Development", "difficulty": "Beginner", "price": 499,
            "duration_days": 14, "technologies": ["React"], "skills": ["React"],
            "tasks": [{"title": "TEST Task 1", "description": "do it", "order": 1,
                       "estimated_hours": 2, "required": True}],
        }

    def test_create_publish_and_catalog_visibility(self, admin_client):
        title = f"TEST Project {uuid.uuid4().hex[:6]}"
        c = admin_client.post(f"{API}/admin/projects", json=self._project_payload(title), timeout=60)
        assert c.status_code == 200, c.text
        proj = c.json()
        assert proj["status"] == "draft" and proj["current_version"] == 0

        # draft not in public catalog
        assert requests.get(f"{API}/projects/{proj['slug']}", timeout=60).status_code == 404

        p = admin_client.post(f"{API}/admin/projects/{proj['id']}/publish", timeout=60)
        assert p.status_code == 200 and p.json()["version"] == 1
        pub = requests.get(f"{API}/projects/{proj['slug']}", timeout=60)
        assert pub.status_code == 200
        assert pub.json()["task_count"] == 1

        # unpublish hides it again
        assert admin_client.post(f"{API}/admin/projects/{proj['id']}/unpublish", timeout=60).status_code == 200
        assert requests.get(f"{API}/projects/{proj['slug']}", timeout=60).status_code == 404
        admin_client.post(f"{API}/admin/projects/{proj['id']}/archive", timeout=60)

    def test_version_isolation_for_active_enrollments(self, admin_client):
        title = f"TEST Version {uuid.uuid4().hex[:6]}"
        proj = admin_client.post(f"{API}/admin/projects", json=self._project_payload(title), timeout=60).json()
        admin_client.post(f"{API}/admin/projects/{proj['id']}/publish", timeout=60)
        pub = requests.get(f"{API}/projects/{proj['slug']}", timeout=60).json()

        s, _, eid, _ = enrolled_student(pub)
        ws1 = s.get(f"{API}/workspaces/{eid}", timeout=60).json()
        assert len(ws1["tasks"]) == 1
        assert ws1["enrollment"]["project_version"] == 1

        payload = self._project_payload(title)
        payload["tasks"].append({"title": "TEST Task 2 NEW", "description": "new",
                                 "order": 2, "estimated_hours": 1, "required": True})
        u = admin_client.patch(f"{API}/admin/projects/{proj['id']}", json=payload, timeout=60)
        assert u.status_code == 200
        rp = admin_client.post(f"{API}/admin/projects/{proj['id']}/publish", timeout=60)
        assert rp.status_code == 200
        assert rp.json()["version"] == 2, f"expected new version 2, got {rp.json()}"

        ws2 = s.get(f"{API}/workspaces/{eid}", timeout=60).json()
        assert ws2["enrollment"]["project_version"] == 1
        assert len(ws2["tasks"]) == 1, "existing enrollment saw new-version tasks (version leak)"

        detail = requests.get(f"{API}/projects/{proj['slug']}", timeout=60).json()
        assert detail["task_count"] == 2
        admin_client.post(f"{API}/admin/projects/{proj['id']}/archive", timeout=60)

    def test_admin_lists_and_audit(self, admin_client):
        for path in ("/admin/projects", "/admin/students", "/admin/enrollments",
                     "/admin/submissions", "/admin/questions", "/admin/certificates",
                     "/admin/audit-logs"):
            r = admin_client.get(f"{API}{path}", timeout=90)
            assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
            body = r.json()
            assert "items" in body
            for it in body["items"][:5]:
                assert "_id" not in it, f"{path} leaks mongo _id"

    def test_admin_can_view_student_resume(self, admin_client, first_project):
        s, _, _, fid = enrolled_student(first_project)
        r = admin_client.get(f"{API}/files/{fid}", timeout=60)
        assert r.status_code == 200

    def test_admin_enrollment_detail_and_extend(self, admin_client, first_project):
        s, _, eid, _ = enrolled_student(first_project)
        d = admin_client.get(f"{API}/admin/enrollments/{eid}", timeout=60)
        assert d.status_code == 200
        from datetime import datetime, timezone, timedelta
        new_due = (datetime.now(timezone.utc) + timedelta(days=40)).isoformat()
        r = admin_client.post(f"{API}/admin/enrollments/{eid}/extend-deadline",
                              json={"due_date": new_due, "reason": "TEST extension"}, timeout=60)
        assert r.status_code == 200, r.text
        after = s.get(f"{API}/workspaces/{eid}", timeout=60).json()
        assert after["enrollment"]["due_date"].startswith(new_due[:10])
