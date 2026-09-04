import { cn } from "@/lib/utils";
import { Loader2, Inbox, ShieldAlert } from "lucide-react";

export function Loading({ label = "Loading…", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-slate-500", className)} data-testid="loading-state">
      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, testId = "empty-state" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16 px-6 text-center" data-testid={testId}>
      <div className="rounded-full bg-slate-50 p-3 border border-zinc-200">
        <Icon className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="error-state">
      <ShieldAlert className="h-6 w-6 text-red-500" strokeWidth={1.5} />
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm font-medium text-blue-600 hover:underline" data-testid="retry-button">
          Try again
        </button>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-violet-50 text-violet-700 border-violet-200",
  submitted: "bg-violet-50 text-violet-700 border-violet-200",
  revision_required: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  issued: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  revoked: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  answered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status }) {
  const label = String(status || "").replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
      STATUS_STYLES[status] || "bg-zinc-100 text-zinc-600 border-zinc-200")}>
      {label}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, hint, testId }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5" data-testid={testId}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.12em] font-semibold text-slate-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />}
      </div>
      <p className="mt-3 text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
