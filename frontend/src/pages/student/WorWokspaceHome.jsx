import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import {
  FolderKanban,
  ArrowRight,
  Clock,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function WorkspaceHome() {
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
      <DashboardLayout title="My Workspace">
        <EmptyState
          title="Unable to load workspace"
          description={error}
        />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="My Workspace">
        <Loading />
      </DashboardLayout>
    );
  }

  const active = data.active_projects || [];
  const completed = data.completed_projects || [];

  return (
    <DashboardLayout title="My Workspace">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <Play className="h-4 w-4" />
            Continue your work
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            My Workspace
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Open your project workspace, complete tasks, access resources,
            submit your work, and track your progress.
          </p>
        </div>

        {/* Active projects */}
        {active.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Continue Working
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pick up where you left off.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {active.length} active
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {active.map((enrollment) => (
                <WorkspaceCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  active
                />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            title="No active workspace yet"
            description="Enroll in a project and your workspace will appear here after payment is verified."
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

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Completed Workspaces
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revisit your completed projects and evidence.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {completed.map((enrollment) => (
                <WorkspaceCard
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

function WorkspaceCard({ enrollment, active }) {
  const project = enrollment.project || {};
  const progress = Number(enrollment.progress || 0);

  return (
    <Link
      to={`/workspace/${enrollment.id}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
      data-testid={`workspace-card-${enrollment.id}`}
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-50 opacity-60 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderKanban className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                {project.title || "Project Workspace"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {project.category || "Project Experience"}
              </p>
            </div>
          </div>

          <StatusBadge status={enrollment.status} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Progress
            </span>

            <span className="font-bold text-slate-900">
              {progress}%
            </span>
          </div>

          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {project.duration_days && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {project.duration_days} days
              </span>
            )}

            {active ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Play className="h-3.5 w-3.5" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
            )}
          </div>

          <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            Open
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}