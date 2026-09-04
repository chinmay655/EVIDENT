import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiError, fileUrl } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Github, ExternalLink, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

export default function AdminSubmissionReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get(`/admin/submissions/${id}`).then(({ data }) => setD(data)), [id]);
  useEffect(() => { load(); }, [load]);

  const action = async (kind) => {
    if ((kind === "request-changes" || kind === "reject") && !feedback.trim()) return toast.error("Feedback is required");
    setBusy(true);
    try {
      await api.post(`/admin/submissions/${id}/${kind}`, kind === "approve" ? {} : { feedback });
      toast.success(kind === "approve" ? "Approved & certificate issued" : kind === "reject" ? "Rejected" : "Changes requested");
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  if (!d) return <AdminLayout title="Review"><Loading /></AdminLayout>;
  const s = d.submission;
  const done = s.status === "approved" || s.status === "rejected";

  return (
    <AdminLayout title="Submission Review">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold text-slate-900">{d.project}</h2><p className="text-sm text-slate-500">{d.student.name} · {d.student.email} · Submission #{s.version} · Project v{d.project_version}</p></div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-4"><div className="flex justify-between text-sm text-slate-600"><span>Task progress</span><span>{d.progress.required_approved}/{d.progress.required_total}</span></div><Progress value={d.progress.percent} className="mt-2 h-2" /></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={s.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"><Github className="h-4 w-4" /> Repository</a>
              {s.deployed_url && <a href={s.deployed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"><ExternalLink className="h-4 w-4" /> Live demo</a>}
            </div>
            {s.description && <Block label="Explanation" text={s.description} />}
            {s.technologies?.length > 0 && <Block label="Technologies" text={s.technologies.join(", ")} />}
            {s.challenges && <Block label="Challenges" text={s.challenges} />}
            {s.solution_summary && <Block label="Solution summary" text={s.solution_summary} />}
            {s.screenshots?.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3">{s.screenshots.map((sid) => <img key={sid} src={fileUrl(sid)} alt="" className="rounded border border-zinc-200" />)}</div>}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Submission history</h3>
            <div className="mt-4 space-y-2">
              {d.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
                  <span className="text-slate-700">#{h.version} · {h.github_url}</span><StatusBadge status={h.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-24 rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Review decision</h3>
            {done ? (
              <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">This submission is <strong>{s.status}</strong>. Reviewed by {s.reviewed_by}.</p>
            ) : (
              <>
                <div className="mt-4"><Label>Feedback (required for changes/reject)</Label><Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="mt-1.5" data-testid="review-feedback" /></div>
                <div className="mt-4 space-y-2">
                  <Button onClick={() => action("approve")} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="approve-btn"><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>
                  <Button onClick={() => action("request-changes")} disabled={busy} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50" data-testid="request-changes-btn"><RefreshCw className="mr-2 h-4 w-4" /> Request changes</Button>
                  <Button onClick={() => action("reject")} disabled={busy} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50" data-testid="reject-btn"><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                </div>
              </>
            )}
            {s.evaluator_notes && <p className="mt-4 rounded-md bg-orange-50 p-3 text-sm text-orange-700"><strong>Previous notes:</strong> {s.evaluator_notes}</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const Block = ({ label, text }) => (
  <div className="mt-4"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{text}</p></div>
);
