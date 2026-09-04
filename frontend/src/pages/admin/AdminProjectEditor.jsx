import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Rocket, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Web Development", "Data Analytics", "Python", "AI/ML", "UI/UX", "Cybersecurity", "Cloud/DevOps", "Business/Marketing"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const EMPTY = {
  title: "", short_description: "", full_description: "", category: "Web Development",
  difficulty: "Intermediate", technologies: [], skills: [], duration_days: 28, price: 999,
  currency: "INR", thumbnail: "", project_banner: "", requirements: [], learning_outcomes: [],
  what_student_will_build: "", what_student_will_submit: "", project_type: "individual",
  featured: false, estimated_hours: 40, submission_requirements: [], evaluation_criteria: [],
  certificate_config: { enabled: true }, tasks: [], resources: [],
};

const STEPS = ["Basics", "Description", "Skills & Tech", "Requirements", "Tasks", "Resources", "Submission", "Evaluation", "Certificate & Pricing"];

export default function AdminProjectEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(id ? null : { ...EMPTY });
  const [pid, setPid] = useState(id || null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) api.get(`/admin/projects/${id}`).then(({ data }) => setData({ ...EMPTY, ...data })).catch(() => nav("/admin/projects"));
  }, [id, nav]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const payload = () => ({
    ...data,
    duration_days: Number(data.duration_days) || 1,
    price: Number(data.price) || 0,
    estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : null,
  });

  const saveDraft = async () => {
    if (!data.title) return toast.error("Title is required");
    setSaving(true);
    try {
      if (pid) { await api.patch(`/admin/projects/${pid}`, payload()); toast.success("Saved"); }
      else { const { data: created } = await api.post("/admin/projects", payload()); setPid(created.id); nav(`/admin/projects/${created.id}/edit`, { replace: true }); toast.success("Draft created"); }
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (!data.title || data.tasks.length === 0) return toast.error("Add a title and at least one task before publishing");
    setSaving(true);
    try {
      let projectId = pid;
      if (projectId) await api.patch(`/admin/projects/${projectId}`, payload());
      else { const { data: created } = await api.post("/admin/projects", payload()); projectId = created.id; setPid(created.id); }
      await api.post(`/admin/projects/${projectId}/publish`);
      toast.success("Project published");
      nav("/admin/projects");
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  if (!data) return <AdminLayout title="Project Editor"><Loading /></AdminLayout>;

  return (
    <AdminLayout title={id ? "Edit Project" : "New Project"}>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} data-testid={`wizard-step-${i}`}
              className={cn("flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                step === i ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs", step === i ? "bg-white text-slate-900" : "bg-slate-200")}>{i + 1}</span> {s}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            {step === 0 && <Basics data={data} set={set} />}
            {step === 1 && <Description data={data} set={set} />}
            {step === 2 && <SkillsTech data={data} set={set} />}
            {step === 3 && <Requirements data={data} set={set} />}
            {step === 4 && <Tasks data={data} set={set} />}
            {step === 5 && <Resources data={data} set={set} />}
            {step === 6 && <ListEditor label="Submission requirements" field="submission_requirements" data={data} set={set} placeholder="e.g. Public GitHub repository" />}
            {step === 7 && <ListEditor label="Evaluation criteria" field="evaluation_criteria" data={data} set={set} placeholder="e.g. Code quality" />}
            {step === 8 && <CertPricing data={data} set={set} />}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} data-testid="wizard-prev">Back</Button>
              <Button variant="outline" disabled={step === STEPS.length - 1} onClick={() => setStep((s) => s + 1)} data-testid="wizard-next">Next</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={saving} data-testid="save-draft-project"><Save className="mr-2 h-4 w-4" /> Save draft</Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={publish} disabled={saving} data-testid="publish-project"><Rocket className="mr-2 h-4 w-4" /> Publish</Button>
            </div>
          </div>
          {data.enrollment_count > 0 && <p className="text-xs text-amber-600">This project has {data.enrollment_count} active enrollment(s). Publishing changes creates a new version — existing students keep their version.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}

const Field = ({ label, children, hint }) => (
  <div><Label>{label}</Label>{children}{hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}</div>
);

function Basics({ data, set }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Basic information</h3>
      <Field label="Project title *"><Input value={data.title} onChange={(e) => set("title", e.target.value)} className="mt-1.5" data-testid="p-title" /></Field>
      <Field label="Short description"><Textarea value={data.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} className="mt-1.5" data-testid="p-short" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category"><Select value={data.category} onValueChange={(v) => set("category", v)}><SelectTrigger className="mt-1.5" data-testid="p-category"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Difficulty"><Select value={data.difficulty} onValueChange={(v) => set("difficulty", v)}><SelectTrigger className="mt-1.5" data-testid="p-difficulty"><SelectValue /></SelectTrigger><SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <Field label="Thumbnail image URL"><Input value={data.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} className="mt-1.5" data-testid="p-thumbnail" /></Field>
      <Field label="Banner image URL"><Input value={data.project_banner} onChange={(e) => set("project_banner", e.target.value)} className="mt-1.5" /></Field>
    </div>
  );
}

function Description({ data, set }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Project description</h3>
      <Field label="Full description"><Textarea value={data.full_description} onChange={(e) => set("full_description", e.target.value)} rows={6} className="mt-1.5" data-testid="p-full" /></Field>
      <Field label="What the student will build"><Textarea value={data.what_student_will_build} onChange={(e) => set("what_student_will_build", e.target.value)} rows={3} className="mt-1.5" /></Field>
      <Field label="What the student will submit"><Textarea value={data.what_student_will_submit} onChange={(e) => set("what_student_will_submit", e.target.value)} rows={2} className="mt-1.5" /></Field>
    </div>
  );
}

function SkillsTech({ data, set }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Skills & technologies</h3>
      <TagEditor label="Technologies" field="technologies" data={data} set={set} placeholder="Add technology" />
      <TagEditor label="Skills" field="skills" data={data} set={set} placeholder="Add skill" />
    </div>
  );
}

function Requirements({ data, set }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Requirements & outcomes</h3>
      <ListEditor label="Requirements" field="requirements" data={data} set={set} placeholder="e.g. Basic HTML/CSS" bare />
      <ListEditor label="Learning outcomes" field="learning_outcomes" data={data} set={set} placeholder="e.g. Build responsive layouts" bare />
    </div>
  );
}

function CertPricing({ data, set }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Certificate & pricing</h3>
      <div className="flex items-center gap-3"><Checkbox checked={data.certificate_config?.enabled ?? true} onCheckedChange={(v) => set("certificate_config", { enabled: v })} data-testid="p-cert-enabled" /><Label className="font-normal">Issue a certificate on approval</Label></div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (₹)"><Input type="number" value={data.price} onChange={(e) => set("price", e.target.value)} className="mt-1.5" data-testid="p-price" /></Field>
        <Field label="Duration (days)"><Input type="number" value={data.duration_days} onChange={(e) => set("duration_days", e.target.value)} className="mt-1.5" data-testid="p-duration" /></Field>
      </div>
      <Field label="Estimated hours"><Input type="number" value={data.estimated_hours || ""} onChange={(e) => set("estimated_hours", e.target.value)} className="mt-1.5" /></Field>
      <div className="flex items-center gap-3"><Checkbox checked={data.featured} onCheckedChange={(v) => set("featured", v)} data-testid="p-featured" /><Label className="font-normal">Feature this project on the homepage</Label></div>
    </div>
  );
}

function TagEditor({ label, field, data, set, placeholder }) {
  const [val, setVal] = useState("");
  const items = data[field] || [];
  const add = () => { if (val.trim()) { set(field, [...items, val.trim()]); setVal(""); } };
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} data-testid={`tag-input-${field}`} />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{t}<button onClick={() => set(field, items.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button></span>
        ))}
      </div>
    </div>
  );
}

function ListEditor({ label, field, data, set, placeholder, bare }) {
  const [val, setVal] = useState("");
  const items = data[field] || [];
  const add = () => { if (val.trim()) { set(field, [...items, val.trim()]); setVal(""); } };
  return (
    <div>
      {!bare && <h3 className="mb-3 text-lg font-semibold text-slate-900">{label}</h3>}
      {bare && <Label>{label}</Label>}
      <div className="mt-2 flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} data-testid={`list-input-${field}`} />
        <Button type="button" variant="outline" onClick={add} data-testid={`list-add-${field}`}><Plus className="h-4 w-4" /></Button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm text-slate-700">{t}<button onClick={() => set(field, items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-slate-400" /></button></li>
        ))}
      </ul>
    </div>
  );
}

function Tasks({ data, set }) {
  const tasks = data.tasks || [];
  const upd = (list) => set("tasks", list.map((t, i) => ({ ...t, order: i })));
  const addTask = () => upd([...tasks, { title: "New task", description: "", instructions: "", required: true, estimated_hours: 4, difficulty: "Intermediate" }]);
  const editTask = (i, k, v) => upd(tasks.map((t, j) => j === i ? { ...t, [k]: v } : t));
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= tasks.length) return; const c = [...tasks]; [c[i], c[j]] = [c[j], c[i]]; upd(c); };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-900">Tasks ({tasks.length})</h3><Button variant="outline" size="sm" onClick={addTask} data-testid="add-task-btn"><Plus className="mr-1 h-4 w-4" /> Add task</Button></div>
      <div className="space-y-4">
        {tasks.map((t, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-4" data-testid={`task-editor-${i}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Task {i + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} className="rounded p-1 hover:bg-slate-100"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} className="rounded p-1 hover:bg-slate-100"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => upd(tasks.filter((_, j) => j !== i))} className="rounded p-1 hover:bg-slate-100"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            </div>
            <Input value={t.title} onChange={(e) => editTask(i, "title", e.target.value)} placeholder="Task title" className="mt-2" data-testid={`task-title-${i}`} />
            <Textarea value={t.description} onChange={(e) => editTask(i, "description", e.target.value)} placeholder="Short description" rows={2} className="mt-2" />
            <Textarea value={t.instructions} onChange={(e) => editTask(i, "instructions", e.target.value)} placeholder="Detailed instructions" rows={2} className="mt-2" />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={t.required} onCheckedChange={(v) => editTask(i, "required", v)} /> Required</label>
              <label className="flex items-center gap-2 text-sm">Hours <Input type="number" value={t.estimated_hours || ""} onChange={(e) => editTask(i, "estimated_hours", Number(e.target.value))} className="h-8 w-20" /></label>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-slate-400">No tasks yet. Add unlimited tasks.</p>}
      </div>
    </div>
  );
}

function Resources({ data, set }) {
  const resources = data.resources || [];
  const upd = (list) => set("resources", list.map((r, i) => ({ ...r, order: i })));
  const add = () => upd([...resources, { title: "New resource", description: "", type: "link", external_url: "", visibility: "enrolled" }]);
  const edit = (i, k, v) => upd(resources.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const onUpload = async (i, file) => {
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: res } = await api.post("/admin/resources/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      edit(i, "file_id", res.file_id); edit(i, "type", res.type); toast.success("Uploaded " + res.filename);
    } catch (e) { toast.error(apiError(e)); }
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-900">Resources ({resources.length})</h3><Button variant="outline" size="sm" onClick={add} data-testid="add-resource-btn"><Plus className="mr-1 h-4 w-4" /> Add resource</Button></div>
      <div className="space-y-4">
        {resources.map((r, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-4" data-testid={`resource-editor-${i}`}>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Resource {i + 1}</span><button onClick={() => upd(resources.filter((_, j) => j !== i))} className="rounded p-1 hover:bg-slate-100"><Trash2 className="h-4 w-4 text-red-500" /></button></div>
            <Input value={r.title} onChange={(e) => edit(i, "title", e.target.value)} placeholder="Title" className="mt-2" data-testid={`resource-title-${i}`} />
            <Input value={r.description} onChange={(e) => edit(i, "description", e.target.value)} placeholder="Description" className="mt-2" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Select value={r.type} onValueChange={(v) => edit(i, "type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["link", "video", "doc", "pdf", "csv", "zip", "xlsx", "docx", "image"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              <Select value={r.visibility} onValueChange={(v) => edit(i, "visibility", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["public", "enrolled", "admin_only"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <Input value={r.external_url || ""} onChange={(e) => edit(i, "external_url", e.target.value)} placeholder="External URL (or upload a file below)" className="mt-3" />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-blue-600 hover:underline">
              <UploadCloud className="h-4 w-4" /> {r.file_id ? "Replace file" : "Upload file"}
              <input type="file" className="hidden" onChange={(e) => e.target.files[0] && onUpload(i, e.target.files[0])} />
            </label>
          </div>
        ))}
        {resources.length === 0 && <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-slate-400">No resources yet.</p>}
      </div>
    </div>
  );
}
