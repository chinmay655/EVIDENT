"""Seed admin account, demo projects, and MongoDB indexes."""
import os
from datetime import datetime, timezone
from .core import db, hash_password, verify_password, gen_id, now_iso, logger


async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("public_username")
    await db.password_reset_tokens.create_index("token")
    await db.login_attempts.create_index("identifier")
    await db.projects.create_index("slug", unique=True)
    await db.projects.create_index("status")
    await db.enrollments.create_index([("student_id", 1), ("project_id", 1)])
    await db.enrollments.create_index("status")
    await db.payments.create_index("enrollment_id")
    await db.payments.create_index("razorpay_order_id")
    await db.submissions.create_index("enrollment_id")
    await db.notifications.create_index("user_id")
    await db.certificates.create_index("verification_id", unique=True)
    await db.certificates.create_index("certificate_id", unique=True)
    await db.audit_logs.create_index("timestamp")
    await db.files.create_index("id")


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    name = os.environ.get("ADMIN_NAME", "Platform Admin")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "email": email, "password_hash": hash_password(password), "name": name,
            "role": "super_admin", "public_username": "admin", "skills": [],
            "created_at": now_iso()})
        logger.info(f"Seeded admin {email}")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email},
                                  {"$set": {"password_hash": hash_password(password),
                                            "role": "super_admin"}})


def _tasks(titles):
    out = []
    for i, (t, d) in enumerate(titles):
        out.append({"id": gen_id(), "title": t, "description": d, "instructions": d,
                    "order": i, "estimated_hours": 4, "difficulty": "Intermediate",
                    "required": True, "evaluation_notes": "", "depends_on": None,
                    "submission_requirements": ""})
    return out


async def seed_projects():
    if await db.projects.count_documents({}) > 0:
        return
    projects = [
        {
            "title": "Business Website Development Project",
            "slug": "business-website-development",
            "short_description": "Design and build a responsive multi-page business website and ship it to production with a public GitHub repository.",
            "full_description": "Step into the role of a freelance web developer delivering a real client website. You'll gather requirements, design a responsive interface, build multiple pages with working interactions, deploy it live, and hand over a documented GitHub repository — exactly the deliverable a small business would pay for.",
            "category": "Web Development", "difficulty": "Intermediate",
            "technologies": ["React", "JavaScript", "HTML", "CSS", "Git", "GitHub"],
            "skills": ["Responsive Design", "Component Architecture", "Deployment", "Git Workflow"],
            "duration_days": 28, "price": 999, "currency": "INR",
            "thumbnail": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "project_banner": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
            "requirements": ["Basic HTML/CSS knowledge", "Familiarity with JavaScript", "A GitHub account"],
            "learning_outcomes": ["Translate business needs into a website", "Build responsive layouts",
                                  "Deploy a live site", "Maintain a clean Git history"],
            "what_student_will_build": "A fully responsive, multi-page business website with a working contact form, deployed to a public URL and backed by a GitHub repository.",
            "what_student_will_submit": "GitHub repository URL, deployed live URL, screenshots, and a short project write-up.",
            "project_type": "individual", "estimated_hours": 40,
            "submission_requirements": ["Public GitHub repository", "Deployed live URL",
                                        "At least 3 screenshots", "Short project explanation"],
            "evaluation_criteria": ["Responsiveness across devices", "Code quality & structure",
                                    "Working interactions", "Deployment success", "Documentation quality"],
            "certificate_config": {"enabled": True},
            "tasks": _tasks([
                ("Understand business requirements", "Review the client brief and document the site's goals, pages, and target audience."),
                ("Create responsive layout", "Set up the project structure and build a mobile-first responsive layout foundation."),
                ("Build core pages", "Implement Home, About, Services, and Contact pages with semantic HTML."),
                ("Implement interactions", "Add navigation, a working contact form, and interactive UI elements."),
                ("Test responsiveness", "Test across mobile, tablet, and desktop and fix layout issues."),
                ("Deploy the website", "Deploy the site to a hosting provider and confirm the public URL works."),
                ("Document the project", "Write a clear README covering setup, tech stack, and features."),
                ("Submit GitHub repository", "Push final code to GitHub and submit repository, live URL and screenshots."),
            ]),
            "resources": [
                {"id": gen_id(), "title": "Client Project Brief", "description": "Business requirements document.",
                 "type": "doc", "external_url": "https://example.com/brief", "order": 0, "visibility": "enrolled"},
                {"id": gen_id(), "title": "Responsive Design Checklist", "description": "A checklist for responsive QA.",
                 "type": "link", "external_url": "https://web.dev/responsive-web-design-basics/", "order": 1, "visibility": "enrolled"},
            ],
            "featured": True,
        },
        {
            "title": "Student Enrollment Data Analytics Project",
            "slug": "student-enrollment-data-analytics",
            "short_description": "Analyze a real enrollment dataset end-to-end: clean it, find insights, build visualizations, and document your methodology.",
            "full_description": "Play the role of a junior data analyst handed a messy student-enrollment dataset. You'll clean the data, run exploratory analysis, compute KPIs, build visualizations, and turn raw numbers into clear, decision-ready insights — with a documented, reproducible workflow on GitHub.",
            "category": "Data Analytics", "difficulty": "Beginner",
            "technologies": ["Python", "Pandas", "Excel", "SQL", "Power BI"],
            "skills": ["Data Cleaning", "Exploratory Analysis", "Data Visualization", "Insight Communication"],
            "duration_days": 21, "price": 799, "currency": "INR",
            "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "project_banner": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
            "requirements": ["Basic Python or spreadsheet skills", "Curiosity about data", "A GitHub account"],
            "learning_outcomes": ["Clean and prepare real data", "Run exploratory analysis",
                                  "Build meaningful visualizations", "Communicate insights clearly"],
            "what_student_will_build": "A reproducible analysis notebook and a dashboard/report that surfaces actionable insights from an enrollment dataset.",
            "what_student_will_submit": "GitHub repository with notebook, a final report or dashboard, and a summary of key insights.",
            "project_type": "individual", "estimated_hours": 30,
            "submission_requirements": ["Public GitHub repository", "Analysis notebook",
                                        "Final report or dashboard", "Key insights summary"],
            "evaluation_criteria": ["Data cleaning rigor", "Depth of analysis", "Visualization clarity",
                                    "Quality of insights", "Reproducibility"],
            "certificate_config": {"enabled": True},
            "tasks": _tasks([
                ("Understand the dataset", "Explore the dataset structure, columns, and data dictionary."),
                ("Data cleaning", "Handle missing values, duplicates, and inconsistent formatting."),
                ("Exploratory analysis", "Examine distributions and relationships across key variables."),
                ("KPI calculation", "Compute enrollment KPIs such as trends, retention, and segment breakdowns."),
                ("Visualization", "Create clear charts to communicate the most important patterns."),
                ("Insight generation", "Translate findings into concrete, decision-ready insights."),
                ("Final report / dashboard", "Assemble a polished report or interactive dashboard."),
                ("Submit project", "Push work to GitHub and submit the repository and report."),
            ]),
            "resources": [
                {"id": gen_id(), "title": "Enrollment Dataset (CSV)", "description": "The raw dataset for analysis.",
                 "type": "csv", "external_url": "https://example.com/dataset.csv", "order": 0, "visibility": "enrolled"},
                {"id": gen_id(), "title": "Analysis Requirements", "description": "What the analysis must cover.",
                 "type": "doc", "external_url": "https://example.com/analysis-brief", "order": 1, "visibility": "enrolled"},
            ],
            "featured": True,
        },
    ]
    from .routes_admin import CONTENT_FIELDS
    for p in projects:
        doc = {"id": gen_id(), "status": "published", "current_version": 1,
               "enrollment_count": 0, "created_at": now_iso(), "updated_at": now_iso(),
               "published_at": now_iso(), **p}
        await db.projects.insert_one(dict(doc))
        snapshot = {k: doc.get(k) for k in CONTENT_FIELDS}
        await db.project_versions.insert_one({
            "project_id": doc["id"], "version": 1, "data": snapshot, "created_at": now_iso()})
    logger.info("Seeded demo projects")


async def write_test_credentials():
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    content = f"""# Test Credentials

## Admin (super_admin)
- Email: {email}
- Password: {password}
- Role: super_admin
- Login at: /login  then visit /admin

## Test Student
- Register a new student via /register (role defaults to student)
- Or use: student@example.com / Student@2026 (create via register if not present)

## Auth endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## Payment
- Sandbox mode is ON (PAYMENT_SANDBOX=true). Checkout completes via a sandbox confirm.
"""
    path = "/app/memory/test_credentials.md"
    try:
        with open(path, "w") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Could not write test_credentials: {e}")


async def run_seed():
    await create_indexes()
    await seed_admin()
    await seed_projects()
    await write_test_credentials()
