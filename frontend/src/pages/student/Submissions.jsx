import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import {
  Send,
  Github,
  ExternalLink,
  ArrowRight,
  Clock,
  FolderKanban,
  RefreshCw,
} from "lucide-react";

export default function Submissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/dashboard");

      const enrollments = [
        ...(data.active_projects || []),
        ...(data.completed_projects || []),
      ];

      const results = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const response = await api.get(
              `/workspaces/${enrollment.id}`
            );

            const workspace = response.data;

            return {
              enrollment,
              project: workspace.project,
              submissions: workspace.submissions || [],
            };
          } catch {
            return {
              enrollment,
              project: enrollment.project || {},
              submissions: [],
            };
          }
        })
      );

      const flattened = [];

      results.forEach((item) => {
        item.submissions.forEach((submission) => {
          flattened.push({
            ...submission,
            enrollmentId: item.enrollment.id,
            project: item.project,
          });
        });
      });

      flattened.sort((a, b) => {
        const aDate = new Date(
          a.updated_at || a.created_at || 0
        ).getTime();

        const bDate = new Date(
          b.updated_at || b.created_at || 0
        ).getTime();

        return bDate - aDate;
      });

      setItems(flattened);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout title="Submissions">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <Send className="h-4 w-4" />
              Your submitted work
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              My Submissions
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              Review the work you've submitted and see its current
              evaluation status.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            data-testid="refresh-submissions"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && <Loading />}

        {/* Error */}
        {!loading && error && (
          <EmptyState
            title="Unable to load submissions"
            description={error}
            action={
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Try Again
              </button>
            }
          />
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No submissions yet"
            description="Complete your project work and submit your GitHub repository from the project workspace."
            icon={Send}
            action={
              <Link
                to="/workspace"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        )}

        {/* Submission list */}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((submission) => (
              <SubmissionCard
                key={`${submission.enrollmentId}-${submission.id}`}
                submission={submission}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SubmissionCard({ submission }) {
  const project = submission.project || {};

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
      data-testid={`submission-${submission.id}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderKanban className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  {project.title || "Project"}
                </h2>

                {submission.version && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Version {submission.version}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {project.category || "Project submission"}
              </p>
            </div>
          </div>

          {/* GitHub */}
          {submission.github_url && (
            <a
              href={submission.github_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Github className="h-4 w-4 shrink-0" />

              <span className="truncate">
                {submission.github_url}
              </span>

              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}

          {/* Date */}
          {(submission.updated_at || submission.created_at) && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Last updated {formatDate(
                submission.updated_at || submission.created_at
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <StatusBadge status={submission.status} />

          <Link
            to={`/workspace/${submission.enrollmentId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Open Workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Evaluator notes */}
      {submission.evaluator_notes && (
        <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Reviewer feedback
          </p>

          <p className="mt-1 text-sm leading-6 text-orange-900">
            {submission.evaluator_notes}
          </p>
        </div>
      )}

      {/* Required changes */}
      {submission.required_changes && (
        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Required changes
          </p>

          <p className="mt-1 text-sm leading-6 text-orange-900">
            {submission.required_changes}
          </p>
        </div>
      )}
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