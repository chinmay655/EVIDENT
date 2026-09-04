import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { Loading, ErrorState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, CheckCircle2, ShieldCheck } from "lucide-react";

export default function PublicEvidence() {
  const { publicId } = useParams();
  const [ev, setEv] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.get(`/evidence/${publicId}`).then(({ data }) => setEv(data)).catch(() => setErr("Evidence not found or not public")); }, [publicId]);

  if (err) return <PublicLayout><ErrorState message={err} /></PublicLayout>;
  if (!ev) return <PublicLayout><Loading /></PublicLayout>;

  return (
    <PublicLayout>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-blue-600">Project Experience</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{ev.project_title}</h1>
          <p className="mt-2 text-slate-600">{ev.student_name} · {ev.category} · Completed {ev.completion_date}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {ev.github_url && <a href={ev.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"><Github className="h-4 w-4" /> GitHub Repository</a>}
            {ev.deployed_url && <a href={ev.deployed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"><ExternalLink className="h-4 w-4" /> Live Demo</a>}
            {ev.verification_id && <Link to={`/verify/${ev.verification_id}`} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"><ShieldCheck className="h-4 w-4" /> Verify Certificate</Link>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-6 py-12 lg:px-8">
        {ev.what_built && <section><h2 className="text-xl font-semibold text-slate-900">What was built</h2><p className="mt-3 text-slate-600">{ev.what_built}</p></section>}
        {ev.description && <section><h2 className="text-xl font-semibold text-slate-900">Project summary</h2><p className="mt-3 whitespace-pre-line text-slate-600">{ev.description}</p></section>}
        {ev.technologies?.length > 0 && <section><h2 className="text-xl font-semibold text-slate-900">Technologies</h2><div className="mt-3 flex flex-wrap gap-2">{ev.technologies.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div></section>}
        {ev.completed_tasks?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Work completed</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ev.completed_tasks.map((t, i) => <li key={i} className="flex gap-2 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {t}</li>)}
            </ul>
          </section>
        )}
        {ev.screenshots?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Screenshots</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {ev.screenshots.map((sid) => <img key={sid} src={fileUrl(sid)} alt="" className="rounded-lg border border-zinc-200" />)}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
