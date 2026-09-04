import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, apiError } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PublicLayout } from "@/components/PublicNav";
import { Loading, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, BarChart3, Layers, CheckCircle2, Lock, Target, FileText, ClipboardList, Award, ArrowRight,
} from "lucide-react";

export default function ProjectDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/projects/${slug}`).then(({ data }) => setP(data)).catch((e) => setErr(apiError(e)));
  }, [slug]);

  if (err) return <PublicLayout><ErrorState message={err} /></PublicLayout>;
  if (!p) return <PublicLayout><Loading /></PublicLayout>;

  const onEnroll = () => {
    if (!user) nav("/login", { state: { from: `/enroll/${slug}` } });
    else nav(`/enroll/${slug}`);
  };

  const Section = ({ title, children }) => (
    <div className="border-t border-zinc-200 py-8">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );

  return (
    <PublicLayout>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/projects" className="hover:text-slate-900">Projects</Link><span>/</span><span className="text-slate-700">{p.category}</span>
          </div>
          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{p.category}</Badge>
                <Badge variant="outline">{p.difficulty}</Badge>
                {p.featured && <Badge className="bg-slate-900">Featured</Badge>}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{p.title}</h1>
              <p className="mt-4 text-lg text-slate-600">{p.short_description}</p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> {p.duration_days} days</span>
                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-slate-400" /> {p.difficulty}</span>
                {p.estimated_hours && <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-slate-400" /> ~{p.estimated_hours} hours</span>}
                <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-slate-400" /> {p.task_count} tasks</span>
              </div>
            </div>

            {/* Enroll card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-zinc-200 bg-white p-6">
                {p.project_banner && <img src={p.project_banner} alt="" className="mb-5 aspect-video w-full rounded-lg object-cover" />}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{p.currency === "INR" ? "₹" : ""}{p.price}</span>
                  <span className="text-sm text-slate-500">one-time</span>
                </div>
                <Button onClick={onEnroll} size="lg" className="mt-5 w-full bg-slate-900 hover:bg-slate-800" data-testid="enroll-now-btn">
                  Enroll Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {["Full project workspace", "Structured tasks & resources", "Human review & feedback", "Verifiable certificate", "Public evidence page"].map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400"><Lock className="h-3 w-3" /> Tasks & resources unlock after enrollment.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="About this project">
              <p className="whitespace-pre-line leading-relaxed text-slate-600">{p.full_description}</p>
            </Section>

            {p.what_student_will_build && (
              <Section title="What you'll build">
                <p className="flex gap-3 text-slate-600"><Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> {p.what_student_will_build}</p>
              </Section>
            )}

            {p.learning_outcomes?.length > 0 && (
              <Section title="Project outcomes">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.learning_outcomes.map((o, i) => (
                    <li key={i} className="flex gap-2 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {o}</li>
                  ))}
                </ul>
              </Section>
            )}

            {p.requirements?.length > 0 && (
              <Section title="Requirements">
                <ul className="space-y-2">{p.requirements.map((r, i) => <li key={i} className="flex gap-2 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" /> {r}</li>)}</ul>
              </Section>
            )}

            <Section title="Tasks overview">
              <ol className="space-y-3">
                {p.tasks_overview.map((t, i) => (
                  <li key={i} className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{i + 1}</span>
                    <div>
                      <p className="font-medium text-slate-900">{t.title} {!t.required && <span className="text-xs text-slate-400">(optional)</span>}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {p.resources_overview?.length > 0 && (
              <Section title="Resources overview">
                <div className="flex flex-wrap gap-2">
                  {p.resources_overview.map((r, i) => (
                    <span key={i} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-600">
                      <FileText className="h-4 w-4 text-slate-400" /> {r.title} {r.visibility !== "public" && <Lock className="h-3 w-3 text-slate-400" />}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {p.submission_requirements?.length > 0 && (
              <Section title="Submission requirements">
                <ul className="space-y-2">{p.submission_requirements.map((r, i) => <li key={i} className="flex gap-2 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> {r}</li>)}</ul>
              </Section>
            )}

            {p.evaluation_criteria?.length > 0 && (
              <Section title="Evaluation criteria">
                <ul className="space-y-2">{p.evaluation_criteria.map((r, i) => <li key={i} className="flex gap-2 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> {r}</li>)}</ul>
              </Section>
            )}

            <Section title="After approval, you receive">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-slate-700"><Award className="h-5 w-5 text-blue-600" /> Verifiable certificate</div>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-slate-700"><FileText className="h-5 w-5 text-blue-600" /> Public evidence page</div>
              </div>
            </Section>
          </div>

          <div className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-24 mt-8 rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.12em] font-semibold text-slate-500">Technologies</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.technologies?.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.12em] font-semibold text-slate-500">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.skills?.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
          </div>
        </div>
        <div className="h-12" />
      </div>
    </PublicLayout>
  );
}
