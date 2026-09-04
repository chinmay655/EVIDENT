# EVIDENT — Project Experience Platform

Build real projects. Prove your skills. EVIDENT is a **project experience platform** (not a course marketplace) where students discover realistic projects, enroll and pay, complete structured tasks, submit GitHub-backed work, get it reviewed, and receive **verifiable evidence** (a public evidence page + a downloadable certificate with QR verification).

> The certificate is not the value. The **project work and verifiable evidence** are.

## Tech Stack
- **Frontend:** React (CRA + CRACO), Tailwind CSS, shadcn/ui, React Router, Recharts, Sonner
- **Backend:** FastAPI (Python), Pydantic, Motor (async MongoDB)
- **Database:** MongoDB
- **Storage:** Emergent-managed private object storage (signed backend-proxied access)
- **Payments:** Razorpay (with a clearly-marked sandbox/test mode)
- **Email:** Emergent-managed Resend (optional; app runs without it)
- **Certificates:** ReportLab (PDF) + QR codes

## Project Structure
```
/app
├── backend/
│   ├── server.py            # FastAPI app entry (routers, CORS, startup/seed)
│   ├── app/
│   │   ├── core.py          # config, db, auth/JWT, storage, email, audit, notifications
│   │   ├── models.py        # Pydantic request schemas
│   │   ├── certificates.py  # PDF certificate generation
│   │   ├── services.py      # certificate issuance, progress, eligibility
│   │   ├── seed.py          # admin + demo projects + indexes
│   │   ├── routes_auth.py   # /api/auth/*
│   │   ├── routes_public.py # catalog, project detail, verify, evidence, files
│   │   ├── routes_student.py# enrollment, payment, workspace, submissions, etc.
│   │   └── routes_admin.py  # admin dashboard, projects, reviews, certificates
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # public / auth / student / admin
│   │   ├── components/      # layouts, nav, shared UI
│   │   ├── context/         # AuthContext
│   │   └── lib/             # apiClient
│   └── .env.example
├── tests/test_backend.py    # critical security + flow tests
└── docs/DEPLOYMENT.md
```

## Local Development (VS Code)
### Prerequisites
- Node 18+ and Yarn, Python 3.11+, MongoDB running locally

### Backend
```bash
cd backend
python -m venv .venv && source  
pip install -r requirements.txt
cp .env.example .env      # fill in values (see below)
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
cp .env.example .env      # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start                # http://localhost:3000
```

> Note: auth cookies are `Secure`. For local http testing, use the deployed https URL or run behind https. The included tests target the https preview URL.

## Environment Variables
See `backend/.env.example` and `frontend/.env.example`. Key ones:
- `MONGO_URL`, `DB_NAME`
- `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `EMERGENT_LLM_KEY` (object storage), `EMERGENT_EMAIL_KEY` + `EMAIL_FROM_NAME` (email)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYMENT_SANDBOX`
- `FRONTEND_URL`, `CORS_ORIGINS`, `ENVIRONMENT`

## Seed Data
On startup the backend seeds:
- A **super_admin** from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (never creatable via public registration)
- Two demo projects: *Business Website Development* and *Student Enrollment Data Analytics*

Credentials are written to `/app/memory/test_credentials.md`.

## Core Journey
Discover → Enroll (resume required) → Pay (Razorpay/sandbox, server-verified) → Workspace unlocks → Tasks/Resources → Submit GitHub → Admin review → Revisions/Approve → Certificate + Evidence → Public verification.

## Security Highlights (all enforced server-side)
- Prices come from the DB, never the frontend
- RBAC on every admin route; ownership checks on enrollments/files
- Payment signature verification + idempotency; sandbox disabled in production
- Certificate eligibility computed server-side; unguessable verification IDs
- Private resumes/certificates via backend-proxied storage (no public URLs)
- Immutable **project versions** — existing enrollments keep their version
- Audit log for privileged actions; rate-limited login; security headers

## Tests
```bash
cd /app && TEST_BASE_URL=<https-backend-url> python -m pytest tests/ -q
```

## Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
