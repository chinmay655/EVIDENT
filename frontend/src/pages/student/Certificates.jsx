import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, API } from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading, EmptyState } from "@/components/common";
import { Award, Download, ExternalLink } from "lucide-react";

export default function Certificates() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/certificates").then(({ data }) => setData(data)); }, []);

  return (
    <DashboardLayout title="Certificates">
      {!data ? <Loading /> : data.items.length === 0 ? (
        <EmptyState title="No certificates yet" description="Complete and get a project approved to earn a verifiable certificate." icon={Award} testId="certs-empty" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-200 bg-white p-6" data-testid={`cert-${c.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50"><Award className="h-6 w-6 text-emerald-600" /></div>
                {c.status === "revoked" && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Revoked</span>}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{c.project_title}</h3>
              <p className="mt-1 text-sm text-slate-500">{c.certificate_id} · {c.completion_date}</p>
              {c.status === "issued" && (
                <div className="mt-4 flex gap-2">
                  <a href={`${API}/certificates/${c.id}/download`} className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800" data-testid="download-cert-btn"><Download className="h-3.5 w-3.5" /> Download</a>
                  <Link to={`/verify/${c.verification_id}`} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300" data-testid="verify-cert-btn"><ExternalLink className="h-3.5 w-3.5" /> Verify</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
