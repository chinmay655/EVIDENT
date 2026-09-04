import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, apiError, fileUrl, API } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, StatusBadge, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  LayoutList, ListChecks, FolderOpen, Send, MessageSquare, BarChart3, Award, FileBadge,
  Clock, AlertTriangle, ExternalLink, FileText, Github, CheckCircle2, Download, Globe, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: LayoutList },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "resources", label: "Resources", icon: FolderOpen },
  { key: "submission", label: "Submission", icon: Send },
  { key: "questions", label: "Questions", icon: MessageSquare },
  { key: "progress", label: "Progress", icon: BarChart3 },
  { key: "certificate", label: "Certificate", icon: Award },
  { key: "evidence", label: "Evidence", icon: FileBadge },
];

export default function Workspace() {
  const { enrollmentId } = useParams();
  const [ws, setWs] = useState(null);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    try { const { data } = await api.get(`/workspaces/${enrollmentId}`); setWs(data); }
    catch (e) { setErr(apiError(e)); }
  }, [enrollmentId]);
  useEffect(() => { load(); }, [load]);

  if (err) return <DashboardLayout title="Workspace"><EmptyState title="Cannot access workspace" description={err} /></DashboardLayout>;
  if (!ws) return <DashboardLayout title="Workspace"><Loading /></DashboardLayout>;

  const { enrollment, project, progress } = ws;

  return (
    <DashboardLayout title="Workspace">
      {/* Top bar */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">{project.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{project.category} · Version {enrollment.project_version}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge status={enrollment.status} />
            {enrollment.due_date && enrollment.status !== "completed" && (
              <span className={cn("flex items-center gap-1.5 text-sm", enrollment.overdue ? "text-red-600" : "text-slate-600")}>
                {enrollment.overdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {enrollment.overdue ? "Overdue" : `${enrollment.days_remaining} days left`}
              </span>
            )}
            <div className="w-32">
              <div className="flex justify-between text-xs text-slate-500"><span>Progress</span><span>{progress.student_percent}%</span></div>
              <Progress value={progress.student_percent} className="mt-1 h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Section nav */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setTab(s.key)} data-testid={`ws-tab-${s.key}`}
              className={cn("flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                tab === s.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
              <s.icon className="h-4 w-4" strokeWidth={1.75} /> {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "overview" && <Overview project={project} />}
          {tab === "tasks" && <Tasks ws={ws} enrollmentId={enrollmentId} reload={load} />}
          {tab === "resources" && <Resources resources={ws.resources} />}
          {tab === "submission" && <Submission ws={ws} enrollmentId={enrollmentId} reload={load} />}
          {tab === "questions" && <Questions ws={ws} enrollmentId={enrollmentId} reload={load} />}
          {tab === "progress" && <ProgressView ws={ws} />}
          {tab === "certificate" && <Certificate ws={ws} />}
          {tab === "evidence" && <Evidence ws={ws} reload={load} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

const Card = ({ children, className }) => <div className={cn("rounded-lg border border-zinc-200 bg-white p-6", className)}>{children}</div>;

function Overview({ project }) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Project overview</h3>
        <p className="mt-3 whitespace-pre-line text-slate-600">{project.full_description}</p>
      </Card>
      {project.what_student_will_build && <Card><h4 className="font-semibold text-slate-900">What you'll build</h4><p className="mt-2 text-slate-600">{project.what_student_will_build}</p></Card>}
      {project.what_student_will_submit && <Card><h4 className="font-semibold text-slate-900">What you'll submit</h4><p className="mt-2 text-slate-600">{project.what_student_will_submit}</p></Card>}
      {project.evaluation_criteria?.length > 0 && (
        <Card><h4 className="font-semibold text-slate-900">Evaluation criteria</h4>
          <ul className="mt-3 space-y-2">{project.evaluation_criteria.map((c, i) => <li key={i} className="flex gap-2 text-slate-600"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" /> {c}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}

function Tasks({ ws, enrollmentId, reload }) {
  const toggle = async (task, checked) => {
    try { await api.patch(`/tasks/${task.id}/progress?enrollment_id=${enrollmentId}`, { student_completed: checked }); reload(); }
    catch (e) { toast.error(apiError(e)); }
  };
  return (
    <div className="space-y-3">
      {ws.tasks.map((t, i) => (
        <Card key={t.id} className="p-5" data-testid={`task-${i}`}>
          <div className="flex items-start gap-4">
            <Checkbox checked={t.student_completed} onCheckedChange={(v) => toggle(t, v)} disabled={t.admin_approved} className="mt-1" data-testid={`task-check-${i}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{i + 1}. {t.title}</p>
                {t.required ? <span className="text-xs text-slate-400">required</span> : <span className="text-xs text-slate-400">optional</span>}
                {t.admin_approved && <StatusBadge status="approved" />}
                {!t.admin_approved && t.student_completed && <StatusBadge status="completed" />}
              </div>
              {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
              {t.instructions && t.instructions !== t.description && <p className="mt-2 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-600">{t.instructions}</p>}
              {t.estimated_hours && <p className="mt-2 text-xs text-slate-400">Est. {t.estimated_hours}h</p>}
            </div>
          </div>
        </Card>
      ))}
      <p className="text-xs text-slate-400">Marking a task complete signals your progress. Final approval is granted by a reviewer.</p>
    </div>
  );
}

function Resources({ resources }) {
  if (!resources.length) return <EmptyState title="No resources yet" description="Resources for this project will appear here." icon={FolderOpen} />;
  return (
    <div className="space-y-3">
      {resources.map((r) => {
        const href = r.external_url || (r.file_id ? fileUrl(r.file_id) : null);
        return (
          <Card key={r.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <div><p className="font-medium text-slate-900">{r.title}</p>{r.description && <p className="text-sm text-slate-500">{r.description}</p>}</div>
            </div>
            {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline" data-testid={`resource-open-${r.id}`}>Open <ExternalLink className="h-3.5 w-3.5" /></a>}
          </Card>
        );
      })}
    </div>
  );
}

function Submission({ ws, enrollmentId, reload }) {
  const latest = ws.submissions[ws.submissions.length - 1];
  const [form, setForm] = useState({ github_url: "", deployed_url: "", description: "", technologies: "", challenges: "", solution_summary: "", demo_video: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (doSubmit) => {
    setSaving(true);
    try {
      await api.post(`/submissions?enrollment_id=${enrollmentId}`, {
        github_url: form.github_url, deployed_url: form.deployed_url || null,
        description: form.description, technologies: form.technologies.split(",").map((s) => s.trim()).filter(Boolean),
        challenges: form.challenges, solution_summary: form.solution_summary,
        demo_video: form.demo_video || null, screenshots: [], submit: doSubmit,
      });
      toast.success(doSubmit ? "Submitted for review!" : "Draft saved");
      reload();
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {latest?.status === "revision_required" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="font-medium text-orange-800">Revision requested</p>
          <p className="mt-1 text-sm text-orange-700">{latest.evaluator_notes}</p>
          {latest.required_changes && <p className="mt-2 text-sm text-orange-700"><strong>Required changes:</strong> {latest.required_changes}</p>}
        </div>
      )}
      {latest?.status === "approved" ? (
        <Card><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /><p className="font-semibold">Your submission has been approved!</p></div></Card>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Submit your work</h3>
          <p className="mt-1 text-sm text-slate-500">Provide your GitHub repository and details about what you built.</p>
          {ws.project.submission_requirements?.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{ws.project.submission_requirements.map((r, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" /> {r}</li>)}</ul>
          )}
          <div className="mt-5 space-y-4">
            <div><Label>GitHub repository URL *</Label><Input value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/you/project" className="mt-1.5" data-testid="sub-github" /></div>
            <div><Label>Deployed URL</Label><Input value={form.deployed_url} onChange={(e) => set("deployed_url", e.target.value)} placeholder="https://your-demo.com" className="mt-1.5" data-testid="sub-deployed" /></div>
            <div><Label>Technologies used (comma separated)</Label><Input value={form.technologies} onChange={(e) => set("technologies", e.target.value)} placeholder="React, Node, MongoDB" className="mt-1.5" data-testid="sub-tech" /></div>
            <div><Label>Project explanation</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="mt-1.5" data-testid="sub-desc" /></div>
            <div><Label>Challenges faced</Label><Textarea value={form.challenges} onChange={(e) => set("challenges", e.target.value)} rows={2} className="mt-1.5" data-testid="sub-challenges" /></div>
            <div><Label>Solution summary</Label><Textarea value={form.solution_summary} onChange={(e) => set("solution_summary", e.target.value)} rows={2} className="mt-1.5" data-testid="sub-solution" /></div>
            <div><Label>Demo video URL</Label><Input value={form.demo_video} onChange={(e) => set("demo_video", e.target.value)} className="mt-1.5" data-testid="sub-video" /></div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => submit(true)} disabled={saving || !form.github_url} className="bg-slate-900 hover:bg-slate-800" data-testid="submit-work-btn"><Github className="mr-2 h-4 w-4" /> Submit for review</Button>
            <Button onClick={() => submit(false)} disabled={saving} variant="outline" data-testid="save-draft-btn">Save draft</Button>
          </div>
        </Card>
      )}

      {ws.submissions.length > 0 && (
        <Card>
          <h4 className="font-semibold text-slate-900">Submission history</h4>
          <div className="mt-4 space-y-3">
            {ws.submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0" data-testid={`sub-history-${s.version}`}>
                <div><p className="text-sm font-medium text-slate-800">Submission #{s.version}</p><a href={s.github_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{s.github_url}</a></div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Questions({ ws, enrollmentId, reload }) {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [saving, setSaving] = useState(false);
  const ask = async () => {
    if (!form.subject || !form.message) return toast.error("Add a subject and message");
    setSaving(true);
    try { await api.post("/questions", { enrollment_id: enrollmentId, ...form }); setForm({ subject: "", message: "" }); toast.success("Question sent"); reload(); }
    catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Ask a question</h3>
        <div className="mt-4 space-y-3">
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" data-testid="q-subject" />
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Describe your question…" data-testid="q-message" />
          <Button onClick={ask} disabled={saving} className="bg-slate-900 hover:bg-slate-800" data-testid="ask-question-btn">Send question</Button>
        </div>
      </Card>
      {ws.questions.length === 0 ? <EmptyState title="No questions yet" icon={MessageSquare} /> : (
        <div className="space-y-3">
          {ws.questions.map((q) => (
            <Card key={q.id}>
              <div className="flex items-center justify-between"><p className="font-medium text-slate-900">{q.subject}</p><StatusBadge status={q.status} /></div>
              <p className="mt-2 text-sm text-slate-600">{q.message}</p>
              {q.answer && <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-slate-700"><p className="text-xs font-semibold text-blue-700">Reviewer's answer</p><p className="mt-1">{q.answer}</p></div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressView({ ws }) {
  const { progress } = ws;
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">Your progress</h3>
      <div className="mt-4"><div className="flex justify-between text-sm text-slate-600"><span>Required tasks approved</span><span>{progress.required_approved}/{progress.required_total}</span></div><Progress value={progress.percent} className="mt-2 h-3" /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4"><p className="text-2xl font-bold text-slate-900">{progress.percent}%</p><p className="text-xs text-slate-500">Complete</p></div>
        <div className="rounded-lg border border-zinc-200 p-4"><p className="text-2xl font-bold text-slate-900">{progress.student_completed}/{progress.task_total}</p><p className="text-xs text-slate-500">Tasks you marked done</p></div>
        <div className="rounded-lg border border-zinc-200 p-4"><p className="text-2xl font-bold text-slate-900">{progress.required_approved}</p><p className="text-xs text-slate-500">Approved by reviewer</p></div>
      </div>
    </Card>
  );
}

function Certificate({ ws }) {
  const cert = ws.certificate;
  if (!cert || cert.status !== "issued") return <EmptyState title="Certificate not issued yet" description="Once your submission is approved, your certificate will appear here." icon={Award} />;
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"><Award className="h-7 w-7 text-emerald-600" /></div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">Certificate issued</h3>
      <p className="mt-1 text-sm text-slate-500">{cert.certificate_id}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a href={`${API}/certificates/${cert.id}/download`} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800" data-testid="download-cert-btn"><Download className="h-4 w-4" /> Download PDF</a>
        <Link to={`/verify/${cert.verification_id}`} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"><ExternalLink className="h-4 w-4" /> Public verification</Link>
      </div>
    </Card>
  );
}

function Evidence({ ws, reload }) {
  const ev = ws.evidence;
  const [saving, setSaving] = useState(false);
  if (!ev) return <EmptyState title="Evidence page not ready" description="Your project evidence page is generated after approval." icon={FileBadge} />;
  const toggle = async () => {
    setSaving(true);
    try { await api.patch(`/evidence/${ev.public_id}/visibility`, { is_public: !ev.is_public }); toast.success(!ev.is_public ? "Evidence is now public" : "Evidence set to private"); reload(); }
    catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div><h3 className="text-lg font-semibold text-slate-900">Project evidence page</h3><p className="mt-1 text-sm text-slate-500">A shareable page proving what you built.</p></div>
        {ev.is_public ? <span className="flex items-center gap-1 text-sm text-emerald-600"><Globe className="h-4 w-4" /> Public</span> : <span className="flex items-center gap-1 text-sm text-slate-500"><Lock className="h-4 w-4" /> Private</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={toggle} disabled={saving} variant="outline" data-testid="toggle-evidence-btn">{ev.is_public ? "Make private" : "Make public"}</Button>
        {ev.is_public && <Link to={`/evidence/${ev.public_id}`} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"><ExternalLink className="h-4 w-4" /> View evidence page</Link>}
      </div>
    </Card>
  );
}
