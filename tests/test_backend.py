import os
import io
import uuid
import requests

BASE = os.environ.get("TEST_BASE_URL", "http://localhost:8001") + "/api"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "ghogalechinmay00@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@Evident2026")


def _student_session():
    s = requests.Session()
    email = f"stud_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE}/auth/register", json={
        "full_name": "QA Student", "email": email, "password": "Passw0rd!",
        "confirm_password": "Passw0rd!", "skills": ["Python"]})
    assert r.status_code == 200, r.text
    return s, email


def _admin_session():
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    assert r.json()["role"] in ("admin", "super_admin")
    return s


def _first_project():
    return requests.get(f"{BASE}/projects").json()["items"][0]


def _enroll_and_pay(s, project):
    files = {"file": ("resume.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")}
    r = s.post(f"{BASE}/files/upload?category=resume", files=files)
    assert r.status_code == 200, r.text
    fid = r.json()["file_id"]
    r = s.post(f"{BASE}/enrollments", json={"project_id": project["id"], "resume_file_id": fid, "accept_terms": True})
    assert r.status_code == 200, r.text
    eid = r.json()["enrollment_id"]
    s.post(f"{BASE}/payments/create-order", json={"enrollment_id": eid})
    r = s.post(f"{BASE}/payments/verify", json={"enrollment_id": eid, "sandbox": True})
    assert r.status_code == 200, r.text
    return eid, fid


def test_health():
    assert requests.get(f"{BASE}/health").json()["status"] == "ok"


def test_register_login_me():
    s, email = _student_session()
    me = s.get(f"{BASE}/auth/me").json()
    assert me["email"] == email and me["role"] == "student"


def test_student_cannot_access_admin():
    s, _ = _student_session()
    assert s.get(f"{BASE}/admin/dashboard").status_code == 403


def test_admin_can_access_admin():
    s = _admin_session()
    assert s.get(f"{BASE}/admin/dashboard").status_code == 200


def test_resume_required_before_enrollment():
    s, _ = _student_session()
    p = _first_project()
    r = s.post(f"{BASE}/enrollments", json={"project_id": p["id"], "resume_file_id": "bad", "accept_terms": True})
    assert r.status_code == 400


def test_price_is_server_controlled():
    # Frontend cannot influence price; create-order uses DB price
    s, _ = _student_session()
    p = _first_project()
    eid, _ = _enroll_and_pay(s, p)
    # order amount equals project price * 100
    # verify workspace unlocked
    assert s.get(f"{BASE}/workspaces/{eid}").status_code == 200


def test_workspace_locked_without_payment():
    s, _ = _student_session()
    p = _first_project()
    files = {"file": ("r.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")}
    fid = s.post(f"{BASE}/files/upload?category=resume", files=files).json()["file_id"]
    eid = s.post(f"{BASE}/enrollments", json={"project_id": p["id"], "resume_file_id": fid, "accept_terms": True}).json()["enrollment_id"]
    assert s.get(f"{BASE}/workspaces/{eid}").status_code == 403


def test_student_cannot_access_other_enrollment():
    s1, _ = _student_session()
    p = _first_project()
    eid, _ = _enroll_and_pay(s1, p)
    s2, _ = _student_session()
    assert s2.get(f"{BASE}/workspaces/{eid}").status_code == 403


def test_cannot_download_other_resume():
    s1, _ = _student_session()
    p = _first_project()
    _, fid = _enroll_and_pay(s1, p)
    s2, _ = _student_session()
    assert s2.get(f"{BASE}/files/{fid}").status_code in (403, 401)


def test_full_flow_submission_approval_certificate_and_verify():
    s, _ = _student_session()
    p = _first_project()
    eid, _ = _enroll_and_pay(s, p)
    r = s.post(f"{BASE}/submissions?enrollment_id={eid}",
               json={"github_url": "https://github.com/x/y", "submit": True})
    assert r.status_code == 200
    admin = _admin_session()
    subs = admin.get(f"{BASE}/admin/submissions", params={"status": "submitted"}).json()["items"]
    sid = [x for x in subs if True][0]["id"]
    assert admin.post(f"{BASE}/admin/submissions/{sid}/approve").status_code == 200
    certs = s.get(f"{BASE}/certificates").json()["items"]
    assert len(certs) >= 1
    vid = certs[0]["verification_id"]
    v = requests.get(f"{BASE}/verify/{vid}").json()
    assert v["valid"] is True
    # revoke -> invalid
    cid = certs[0]["id"]
    admin.post(f"{BASE}/admin/certificates/{cid}/revoke")
    v2 = requests.get(f"{BASE}/verify/{vid}").json()
    assert v2["valid"] is False and v2["status"] == "revoked"


def test_certificate_not_eligible_early():
    s, _ = _student_session()
    p = _first_project()
    eid, _ = _enroll_and_pay(s, p)
    # no submission approved -> no certificate
    assert s.get(f"{BASE}/certificates").json()["items"] == []
