import io
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


def _creds():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")
    c = p.read_text(encoding="utf-8")
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("No admin email/password in test_credentials.md")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="session")
def admin_credentials():
    return _creds()


@pytest.fixture(scope="session")
def admin_client(admin_credentials):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=admin_credentials, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:400]}")
    assert r.json()["role"] in ("admin", "super_admin")
    return s


def new_student():
    """Register a fresh student; returns (session, email)."""
    s = requests.Session()
    email = f"test_stud_{uuid.uuid4().hex[:10]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "full_name": "TEST Student", "email": email, "password": "Passw0rd!",
        "confirm_password": "Passw0rd!", "skills": ["Python"]}, timeout=60)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text[:300]}"
    return s, email


@pytest.fixture
def student():
    return new_student()


@pytest.fixture(scope="session")
def first_project():
    r = requests.get(f"{API}/projects", timeout=60)
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert items, "No published projects seeded"
    return items[0]


def upload_resume(session):
    files = {"file": ("TEST_resume.pdf", io.BytesIO(b"%PDF-1.4 test resume"), "application/pdf")}
    r = session.post(f"{API}/files/upload?category=resume", files=files, timeout=120)
    assert r.status_code == 200, f"resume upload failed: {r.status_code} {r.text[:300]}"
    return r.json()["file_id"]


def enroll(session, project, resume_id=None):
    fid = resume_id or upload_resume(session)
    r = session.post(f"{API}/enrollments", json={
        "project_id": project["id"], "resume_file_id": fid, "accept_terms": True}, timeout=60)
    assert r.status_code == 200, f"enroll failed: {r.status_code} {r.text[:300]}"
    return r.json()["enrollment_id"], fid


def pay(session, enrollment_id):
    o = session.post(f"{API}/payments/create-order", json={"enrollment_id": enrollment_id}, timeout=60)
    assert o.status_code == 200, o.text
    v = session.post(f"{API}/payments/verify", json={"enrollment_id": enrollment_id, "sandbox": True}, timeout=60)
    assert v.status_code == 200, v.text
    return o.json(), v.json()


def enrolled_student(project):
    s, email = new_student()
    eid, fid = enroll(s, project)
    pay(s, eid)
    return s, email, eid, fid
