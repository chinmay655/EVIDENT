import { useEffect, useState, useCallback } from "react";
import { api, apiError, API } from "@/lib/apiClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Loading, EmptyState, StatusBadge } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Download, Copy, ShieldX, RotateCcw } from "lucide-react";

export default function AdminCertificates() {
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/certificates", { params: search ? { search } : {} });
    setItems(data.items);
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const act = async (c, kind) => {
    try { await api.post(`/admin/certificates/${c.id}/${kind}`); toast.success(kind === "revoke" ? "Certificate revoked" : "Certificate reissued"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };
  const copyLink = (c) => { navigator.clipboard.writeText(`${window.location.origin}/verify/${c.verification_id}`); toast.success("Verification link copied"); };

  return (
    <AdminLayout title="Certificates">
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, student, project" className="pl-9" data-testid="cert-search" />
      </div>
      {!items ? <Loading /> : items.length === 0 ? <EmptyState title="No certificates" /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Certificate ID</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0" data-testid={`cert-row-${c.id}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.certificate_id}</td>
                  <td className="px-4 py-3 text-slate-600">{c.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.project_title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <a href={`${API}/certificates/${c.id}/download`} className="rounded p-1.5 hover:bg-slate-100" title="Download"><Download className="h-4 w-4 text-slate-500" /></a>
                      <button onClick={() => copyLink(c)} className="rounded p-1.5 hover:bg-slate-100" title="Copy link" data-testid={`cert-copy-${c.id}`}><Copy className="h-4 w-4 text-slate-500" /></button>
                      {c.status === "issued" ? (
                        <button onClick={() => act(c, "revoke")} className="rounded p-1.5 hover:bg-red-50" title="Revoke" data-testid={`cert-revoke-${c.id}`}><ShieldX className="h-4 w-4 text-red-500" /></button>
                      ) : (
                        <button onClick={() => act(c, "reissue")} className="rounded p-1.5 hover:bg-emerald-50" title="Reissue"><RotateCcw className="h-4 w-4 text-emerald-600" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
