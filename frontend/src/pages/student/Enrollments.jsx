import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  ArrowRight,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";

export default function Enrollments() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setData(data))
      .catch((err) => setError(apiError(err)));
  }, []);

  if (error) {
    return (
      <DashboardLayout title="My Enrollments">
        <EmptyState
          title="Unable to load enrollments"
          description={error}
        />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="My Enrollments">
        <Loading />
      </DashboardLayout>
    );
  }

  const active = data.active_projects || [];
  const completed = data.completed_projects || [];
  const all = [...active, ...completed];

  return (
    <DashboardLayout title="My Enrollments">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <FolderKanban className="h-4 w-4" />
              Your project journey
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              My Enrollments
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              Track the projects you've joined, monitor your progress,
              and continue building practical experience.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            data-testid="browse-more-projects"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Total Enrolled"
            value={all.length}
            icon={FolderKanban}
          />

          <Stat
            label="In Progress"
            value={active.length}
            icon={Clock}
          />

          <Stat
            label="Completed"
            value={completed.length}
            icon={CheckCircle2}
          />
        </div>

        {/* Empty */}
        {all.length === 0 && (
          <EmptyState
            title="You haven't enrolled in a project yet"
            description="Choose an industry-style project and start building evidence of your practical skills."
            action={
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Explore Projects
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        )}

        {/* Active */}
        {active.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Active Projects
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Projects you're currently working on.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {active.length} active
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {active.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  active
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Completed Projects
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your finished project experiences.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {completed.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function EnrollmentCard({ enrollment, active }) {
  const project = enrollment.project || {};
  const progress = Number(enrollment.progress || 0);

  return (
    <Link
      to={`/workspace/${enrollment.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
      data-testid={`enrollment-${enrollment.id}`}
    >
      {/* Top accent */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderKanban className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-600">
                {project.title || "Project"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {project.category || "Project Experience"}
              </p>
            </div>
          </div>

          <StatusBadge status={enrollment.status} />
        </div>

        {project.short_description && (
          <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
            {project.short_description}
          </p>
        )}

        {/* Progress */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              Project progress
            </span>

            <span className="font-bold text-slate-900">
              {progress}%
            </span>
          </div>

          <Progress value={progress} className="h-2.5" />
        </div>

        {/* Bottom */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {project.duration_days && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {project.duration_days} days
              </span>
            )}

            {enrollment.due_date && active && (
              <span>
                Due {formatDate(enrollment.due_date)}
              </span>
            )}
          </div>

          <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            Open Workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}