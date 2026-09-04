# PRD — EVIDENT (Project Experience Platform)

## Original Problem Statement
Build a production-ready platform where college students gain REAL, project-based experience they can demonstrate in job applications. NOT a course site. Core loop: Discover → Enroll → Pay → Get real tasks → Build → Submit → Review → Revise → Approve → Verified certificate + evidence → Portfolio proof.

## Architecture
- **Frontend:** React (CRA/CRACO) + Tailwind + shadcn/ui + React Router + Recharts. `apiClient` (axios, withCredentials). AuthContext (JWT httpOnly cookies).
- **Backend:** FastAPI, modular `app/` package (core, models, services, certificates, seed, routes_auth/public/student/admin). Motor async MongoDB.
- **Storage:** Emergent object storage (private, backend-proxied downloads with ownership/enrollment/RBAC checks).
- **Payments:** Razorpay with server-side price + signature verification; sandbox mode when keys absent (disabled in production).
- **Email:** Emergent Resend (best-effort, non-blocking).
- **Certificates:** ReportLab PDF + QR + unguessable verification IDs.

## User Personas
1. **Student** — discovers projects, enrolls/pays, builds, submits, gets reviewed, earns verifiable evidence.
2. **Admin/super_admin** — manages projects (wizard), reviews submissions, manages enrollments/students/certificates, views analytics. (Future: mentor, evaluator — architected via role field + RBAC.)

## Core Requirements (static)
Server-enforced: DB-controlled price, RBAC on admin routes, enrollment ownership, payment-gated workspace, backend certificate eligibility, private resumes/certs, immutable project versions, audit log, rate-limited login.

## Implemented (2026-06)
- Public site: Home, Projects catalog (search/filter/sort), Project detail, About, How it Works, FAQ, Contact, Privacy, Terms, Refund, public certificate verification, public portfolio + evidence pages.
- Auth: register/login/logout/me/refresh, forgot/reset password, brute-force lockout (X-Forwarded-For keyed), seeded super_admin.
- Student: dashboard, enrollment + required resume upload, Razorpay/sandbox checkout, workspace (Overview/Tasks/Resources/Submission/Questions/Progress/Certificate/Evidence), task progress (student vs admin-approved), GitHub submissions + history, questions, notifications center + bell, profile, certificates page, evidence visibility toggle.
- Admin: analytics dashboard (charts), project CRUD + publish/unpublish/archive/duplicate/feature, 9-step project wizard with unlimited tasks/resources + file upload, enrollment management (extend deadline, cancel, issue cert), submission review (approve/request-changes/reject → auto certificate), student search, certificate management (revoke/reissue/copy link/download), question answering, audit log.
- Project versioning: publish creates immutable snapshot; existing enrollments keep their version.
- Certificates: PDF with QR → public verify; revoke invalidates.
- Tests: /app/tests/test_backend.py + /app/backend/tests/backend_test.py (44/45 → all auth pass after brute-force fix). Full E2E verified by testing agent.
- Docs: README.md, docs/DEPLOYMENT.md, backend/frontend .env.example.

## Known Notes
- Payments in SANDBOX until real Razorpay keys added (`PAYMENT_SANDBOX=false` + keys for prod).
- Email skipped silently if `EMERGENT_EMAIL_KEY` unset.

## Backlog / Remaining (prioritized)
- P1: Email verification flow UI (backend architected); GitHub API repo metadata display on submission.
- P2: Screenshot uploads in submission form (endpoint exists via /files/upload image); admin student detail drill-down page; deadline auto-expiry cron.
- P2: Recruiter/mentor roles, AI review, job matching (future extensibility — not built).

## Next Tasks
- Add real Razorpay keys and flip sandbox off for go-live.
- Optionally wire screenshot uploads into the submission UI.
