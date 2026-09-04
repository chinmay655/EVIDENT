import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { PublicLayout } from "@/components/PublicNav";
import { Loading, ErrorState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Globe, ShieldCheck } from "lucide-react";

export default function PublicPortfolio() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.get(`/students/${username}`).then(({ data }) => setData(data)).catch(() => setErr("Profile not found")); }, [username]);

  if (err) return <PublicLayout><ErrorState message={err} /></PublicLayout>;
  if (!data) return <PublicLayout><Loading /></PublicLayout>;

  return (
    <PublicLayout>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{data.name}</h1>
          {(data.degree || data.college) && <p className="mt-2 text-slate-600">{[data.degree, data.college, data.graduation_year].filter(Boolean).join(" · ")}</p>}
          {data.bio && <p className="mt-4 max-w-2xl text-slate-600">{data.bio}</p>}
          <div className="mt-5 flex gap-3">
            {data.github && <a href={data.github} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900"><Github className="h-5 w-5" /></a>}
            {data.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900"><Linkedin className="h-5 w-5" /></a>}
            {data.portfolio && <a href={data.portfolio} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900"><Globe className="h-5 w-5" /></a>}
          </div>
          {data.skills?.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{data.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Project Experience</h2>
        {data.evidence.length === 0 ? (
          <p className="mt-4 text-slate-500">No public project evidence yet.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {data.evidence.map((ev) => (
              <Link key={ev.public_id} to={`/evidence/${ev.public_id}`} className="rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-slate-300">
                <p className="text-xs font-medium text-slate-500">{ev.category}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{ev.project_title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{ev.what_built}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{(ev.technologies || []).slice(0, 5).map((t) => <span key={t} className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-600 border border-zinc-100">{t}</span>)}</div>
              </Link>
            ))}
          </div>
        )}

        {data.certificates?.length > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-bold text-slate-900">Verified Certificates</h2>
            <div className="mt-6 space-y-3">
              {data.certificates.map((c) => (
                <Link key={c.verification_id} to={`/verify/${c.verification_id}`} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 hover:border-slate-300">
                  <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600" /><span className="font-medium text-slate-800">{c.project_title}</span></div>
                  <span className="text-sm text-blue-600">Verify →</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
