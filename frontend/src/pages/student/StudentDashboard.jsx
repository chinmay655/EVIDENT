import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectCard } from "@/components/ProjectCard";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileCheck2,
  FolderKanban,
  FolderOpen,
  GitBranch,
  GraduationCap,
  Layers3,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";


/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

function StatBox({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>

        <span className="text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-900">
        {label}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}


function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  action,
  actionLabel,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          to={action}
          className="group inline-flex items-center text-sm font-semibold text-blue-600"
        >
          {actionLabel || "View all"}
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}


function ProgressCard({ enrollment }) {
  const project = enrollment.project;

  return (
    <Link
      to={`/workspace/${enrollment.id}`}
      data-testid={`active-project-${enrollment.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FolderOpen className="h-5 w-5 text-blue-600" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-950">
              {project.title}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Your active project
            </p>
          </div>
        </div>

        <StatusBadge status={enrollment.status} />
      </div>

      <div className="mt-6">

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Project progress
          </span>

          <span className="text-sm font-bold text-slate-900">
            {enrollment.progress}%
          </span>
        </div>

        <Progress
          value={enrollment.progress}
          className="mt-2 h-2"
        />

      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          Keep building your evidence
        </div>

        <span className="inline-flex items-center text-sm font-semibold text-blue-600">
          Workspace
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>

      </div>
    </Link>
  );
}


function CompletedCard({ enrollment }) {
  return (
    <Link
      to={`/workspace/${enrollment.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-950">
              {enrollment.project.title}
            </h3>

            <p className="mt-0.5 text-xs text-emerald-600">
              Project completed
            </p>
          </div>
        </div>

        <StatusBadge status={enrollment.status} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">
          View your evidence and project
        </span>

        <ArrowUpRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600" />
      </div>
    </Link>
  );
}


/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function StudentDashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);


  /* ----------------------------------------------------------
     Derived values
  ---------------------------------------------------------- */

  const firstName = user?.name?.split(" ")[0] || "there";

  const activeProjects = data?.active_projects || [];
  const completedProjects = data?.completed_projects || [];
  const recommendedProjects = data?.recommended || [];
  const revisionRequests = data?.revision_requests || [];

  const stats = data?.stats || {
    active: 0,
    completed: 0,
    certificates: 0,
    unread_notifications: 0,
  };

  const totalProjects =
    Number(stats.active || 0) +
    Number(stats.completed || 0);

  const completionRate = useMemo(() => {
    if (!totalProjects) return 0;

    return Math.round(
      (Number(stats.completed || 0) / totalProjects) * 100
    );
  }, [stats.completed, totalProjects]);


  if (!data) {
    return (
      <DashboardLayout title="Dashboard">
        <Loading />
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout title="Dashboard">

      <div className="min-h-full bg-[#f7faff]">

        {/* =====================================================
            PAGE CONTAINER
        ===================================================== */}

        <div className="mx-auto max-w-[1500px] space-y-8 px-1 pb-10">


          {/* ===================================================
              WELCOME HERO
          =================================================== */}

          <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-[#eef5ff] via-white to-[#f5f8ff]">

            {/* decorative background */}
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />

            <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl" />

            <div className="relative grid items-center gap-8 px-7 py-8 lg:grid-cols-[1fr_0.72fr] lg:px-9 lg:py-9">

              {/* LEFT */}
              <div>

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  BUILD • PROVE • GROW
                </div>

                <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 lg:text-5xl">
                  Real Projects.
                  <span className="block text-blue-600">
                    Real Experience.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Go beyond just certificates. Work on industry-style
                  projects, apply your knowledge, and build verified project
                  experience for your resume.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Button
                    asChild
                    className="h-11 rounded-xl bg-slate-950 px-5 font-semibold shadow-md hover:bg-blue-700"
                  >
                    <Link to="/projects">
                      Explore Projects
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white px-5 font-semibold"
                  >
                    <Link to="/how-it-works">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Watch How It Works
                    </Link>
                  </Button>

                </div>

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Industry-style projects
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Expert feedback
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Verified certificates
                  </div>

                </div>
              </div>


              {/* RIGHT VISUAL */}
              <div className="relative hidden min-h-[240px] lg:block">

                <div className="absolute right-5 top-0 h-56 w-56 rounded-full bg-blue-100/70" />

                <div className="absolute right-20 top-6 flex h-48 w-48 items-center justify-center rounded-full border border-white bg-white/70 shadow-xl backdrop-blur">

                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">

                    <Rocket className="h-8 w-8" />

                    <span className="mt-3 text-xs font-semibold">
                      Keep Building
                    </span>

                    <span className="mt-1 text-[10px] text-blue-100">
                      Your evidence
                    </span>

                  </div>
                </div>

                <div className="absolute left-0 top-8 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <GitBranch className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Evidence
                      </p>

                      <p className="text-xs font-semibold text-slate-900">
                        GitHub-backed work
                      </p>
                    </div>

                  </div>
                </div>

                <div className="absolute bottom-2 right-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </p>

                      <p className="text-xs font-semibold text-slate-900">
                        Build. Submit. Verify.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </section>


          {/* ===================================================
              TOP STATS
          =================================================== */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatBox
              icon={FolderKanban}
              label="Active Projects"
              value={stats.active}
              description="Projects currently in progress"
            />

            <StatBox
              icon={CheckCircle2}
              label="Completed"
              value={stats.completed}
              description="Projects successfully completed"
            />

            <StatBox
              icon={Award}
              label="Certificates"
              value={stats.certificates}
              description="Verified certificates earned"
            />

            <StatBox
              icon={Bell}
              label="Notifications"
              value={stats.unread_notifications}
              description="Unread notifications"
            />

          </section>


          {/* ===================================================
              REVISION ALERT
          =================================================== */}

          {revisionRequests.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-orange-200 bg-orange-50">

              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                    <FileCheck2 className="h-5 w-5 text-orange-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-orange-900">
                      Your work needs another look
                    </p>

                    <p className="mt-1 text-sm text-orange-700">
                      You have {revisionRequests.length} revision request
                      {revisionRequests.length !== 1 ? "s" : ""}.
                      Review the feedback and update your submission.
                    </p>
                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  {revisionRequests.map((revision) => (
                    <Button
                      key={revision.id}
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-orange-300 bg-white text-orange-800 hover:bg-orange-100"
                    >
                      <Link to={`/workspace/${revision.id}`}>
                        Review feedback
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ))}

                </div>

              </div>
            </section>
          )}


          {/* ===================================================
              LEARNING JOURNEY + PROFILE
          =================================================== */}

          <section className="grid gap-5 xl:grid-cols-[1fr_330px]">

            {/* JOURNEY */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    Your progress
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Your Learning Journey
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Keep completing projects to build stronger evidence.
                  </p>
                </div>

                <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-blue-50 sm:flex">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>

              </div>

              <div className="mt-7">

                <div className="flex items-end justify-between">

                  <div>
                    <p className="text-3xl font-bold text-slate-950">
                      {stats.completed}
                    </p>

                    <p className="text-xs text-slate-500">
                      completed projects
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-blue-600">
                    {completionRate}%
                  </p>

                </div>

                <Progress
                  value={completionRate}
                  className="mt-3 h-2.5"
                />

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xl font-bold text-slate-950">
                      {stats.completed}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Completed
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <p className="text-xl font-bold text-blue-700">
                      {stats.active}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      In Progress
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xl font-bold text-slate-950">
                      {stats.certificates}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Certificates
                    </p>
                  </div>

                </div>

              </div>
            </div>


            {/* PROFILE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-bold text-blue-700">
                  {firstName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {user?.name || "Student"}
                  </p>

                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {user?.email || "Student account"}
                  </p>

                  <Link
                    to="/profile"
                    className="mt-2 inline-flex items-center text-xs font-semibold text-blue-600"
                  >
                    View Profile
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>

              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                    <UserRound className="h-4 w-4 text-slate-500" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      ACCOUNT
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      Student
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ===================================================
              ACTIVE PROJECTS
          =================================================== */}

          <section>

            <DashboardSectionHeader
              eyebrow="Continue building"
              title="Your Active Projects"
              description="Pick up where you left off and keep building your evidence."
            />

            {activeProjects.length === 0 ? (

              <EmptyState
                className="mt-5 rounded-2xl"
                title="No active projects yet"
                description="Choose a project and start building practical experience."
                action={
                  <Button
                    asChild
                    className="bg-slate-950 hover:bg-blue-700"
                  >
                    <Link
                      to="/projects"
                      data-testid="browse-projects-btn"
                    >
                      Explore Projects
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                }
                testId="active-empty"
              />

            ) : (

              <div className="mt-5 grid gap-5 lg:grid-cols-2">

                {activeProjects.map((enrollment) => (
                  <ProgressCard
                    key={enrollment.id}
                    enrollment={enrollment}
                  />
                ))}

              </div>

            )}

          </section>


          {/* ===================================================
              COMPLETED PROJECTS
          =================================================== */}

          {completedProjects.length > 0 && (
            <section>

              <DashboardSectionHeader
                eyebrow="Your evidence"
                title="Completed Projects"
                description="Projects you've already finished."
                action="/certificates"
                actionLabel="View certificates"
              />

              <div className="mt-5 grid gap-5 lg:grid-cols-2">

                {completedProjects.map((enrollment) => (
                  <CompletedCard
                    key={enrollment.id}
                    enrollment={enrollment}
                  />
                ))}

              </div>

            </section>
          )}


          {/* ===================================================
              RECOMMENDED PROJECTS
          =================================================== */}

          {recommendedProjects.length > 0 && (
            <section>

              <DashboardSectionHeader
                eyebrow="Keep growing"
                title="Recommended For You"
                description="Projects you can take on next."
                action="/projects"
                actionLabel="View all projects"
              />

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {recommendedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}

              </div>

            </section>
          )}


          {/* ===================================================
              CERTIFICATE CTA
          =================================================== */}

          <section className="relative overflow-hidden rounded-3xl bg-slate-950">

            <div className="absolute -right-20 -top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

            <div className="relative flex flex-col gap-7 px-7 py-8 md:flex-row md:items-center md:justify-between lg:px-9 lg:py-10">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Award className="h-6 w-6 text-blue-400" />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
                    Build your proof
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    Earn verified certificates
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Complete projects, get your work reviewed and build
                    evidence that you can share with recruiters.
                  </p>

                </div>

              </div>

              <Button
                asChild
                className="h-11 shrink-0 rounded-xl bg-white px-5 font-semibold text-slate-950 hover:bg-blue-50"
              >
                <Link to="/projects">
                  Explore Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

            </div>
          </section>


          {/* ===================================================
              HELP
          =================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-950">
                    Need help?
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Have a question about your project or workspace?
                  </p>
                </div>

              </div>

              <Link
                to="/notifications"
                className="inline-flex items-center text-sm font-semibold text-blue-600"
              >
                Check notifications
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>

            </div>

          </section>

        </div>
      </div>

    </DashboardLayout>
  );
}